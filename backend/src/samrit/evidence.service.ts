import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHash, randomBytes } from 'crypto';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { resolve, basename } from 'path';
import { SamritAI } from './ai.service';
import type { Actor } from './samrit.service';
const hash = (s: string | Buffer) =>
  createHash('sha256').update(s).digest('hex');
@Injectable()
export class EvidenceService {
  constructor(
    private db: DataSource,
    private ai: SamritAI,
    private config: ConfigService,
  ) {}
  async document(
    file: Express.Multer.File,
    type: 'menu' | 'invoice',
    actor: Actor,
  ) {
    if (actor.role !== 'DONOR') throw new ForbiddenException();
    if (!file?.buffer?.length || file.buffer.length > 5242880)
      throw new BadRequestException('Upload a document up to 5 MB.');
    const b = file.buffer,
      mime =
        b.subarray(0, 5).toString() === '%PDF-'
          ? 'application/pdf'
          : b
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? 'image/png'
            : b[0] === 255 && b[1] === 216 && b[2] === 255
              ? 'image/jpeg'
              : b.subarray(0, 4).toString() === 'RIFF' &&
                  b.subarray(8, 12).toString() === 'WEBP'
                ? 'image/webp'
                : null;
    if (!mime || mime !== file.mimetype)
      throw new BadRequestException(
        'Use a valid JPEG, PNG, WebP or PDF document.',
      );
    const id = randomUUID(),
      folder = resolve(
        this.config.get<string>('PRIVATE_DOCUMENT_DIR') || 'private_documents',
      );
    await mkdir(folder, { recursive: true });
    const storage = resolve(folder, id);
    await writeFile(storage, b, { flag: 'wx', mode: 0o600 });
    await this.db.query(
      'INSERT INTO food.event_documents(id,uploader_id,document_type,original_name,storage_path,mime_type,sha256,byte_size) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        id,
        actor.userId,
        type,
        basename(file.originalname).slice(0, 200),
        id,
        mime,
        hash(b),
        b.length,
      ],
    );
    const extractionId = randomUUID();
    try {
      const result = await this.ai.menu(file, type, actor.userId, id);
      const items = await this.db.transaction(async (m) => {
        await m.query(
          "INSERT INTO food.document_extractions(id,document_id,job_id,status) VALUES($1,$2,$3,'completed')",
          [extractionId, id, result.jobId],
        );
        const rows: any[] = [];
        for (const i of result.items) {
          const candidateId = randomUUID();
          await m.query(
            'INSERT INTO food.extracted_food_items(id,extraction_id,name,ingredients,allergens,quantity,unit,estimated_servings,handling,source_reference,item_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
            [
              candidateId,
              extractionId,
              i.name,
              i.ingredients,
              i.allergens,
              i.quantity,
              i.unit,
              i.estimatedServings,
              i.handlingRequirement,
              i.sourceReference,
              i.itemType,
            ],
          );
          rows.push({
            ...i,
            sourceCandidateId: candidateId,
            ingredients: i.ingredients || [],
            allergens: i.allergens || [],
            estimatedServings: i.estimatedServings || 0,
            handlingRequirement:
              i.handlingRequirement === 'unknown' ? '' : i.handlingRequirement,
            verified: false,
          });
        }
        return rows;
      });
      return {
        documentId: id,
        extractionId,
        items,
        requiresHumanVerification: true,
        mode: 'gemini',
      };
    } catch {
      await this.db.query(
        "INSERT INTO food.document_extractions(id,document_id,status,error_code) VALUES($1,$2,'failed','extraction_unavailable')",
        [extractionId, id],
      );
      return {
        documentId: id,
        extractionId,
        items: [],
        mode: 'manual_entry',
        requiresHumanVerification: true,
        message:
          'Document saved privately. Extraction unavailable; enter dishes manually.',
      };
    }
  }
  async original(id: string, actor: Actor) {
    const row = (
      await this.db.query('SELECT * FROM food.event_documents WHERE id=$1', [
        id,
      ])
    )[0];
    if (!row) throw new NotFoundException();
    if (actor.role !== 'ADMIN' && row.uploader_id !== actor.userId)
      throw new ForbiddenException();
    return {
      buffer: await readFile(
        resolve(
          this.config.get<string>('PRIVATE_DOCUMENT_DIR') ||
            'private_documents',
          row.storage_path,
        ),
      ),
      mime: row.mime_type,
    };
  }
  async linkDocuments(
    m: EntityManager,
    eventId: string,
    input: any,
    actor: Actor,
  ) {
    for (const id of input.documentIds || []) {
      const docs = await m.query(
        'UPDATE food.event_documents SET event_id=$1 WHERE id=$2 AND uploader_id=$3 AND (event_id IS NULL OR event_id=$1) RETURNING id',
        [eventId, id, actor.userId],
      );
      if (!docs.length)
        throw new BadRequestException(
          'Document is not available to this event.',
        );
    }
    const menu = await m.query(
      'SELECT id,position FROM food.menu_items WHERE event_id=$1',
      [eventId],
    );
    for (const [position, item] of input.items.entries())
      if (item.sourceCandidateId) {
        const rows = await m.query(
          'SELECT c.id FROM food.extracted_food_items c JOIN food.document_extractions x ON x.id=c.extraction_id JOIN food.event_documents d ON d.id=x.document_id WHERE c.id=$1 AND d.event_id=$2 AND d.uploader_id=$3',
          [item.sourceCandidateId, eventId, actor.userId],
        );
        if (!rows.length)
          throw new BadRequestException(
            'Candidate document must belong to this event.',
          );
        await m.query(
          'INSERT INTO food.document_item_links(candidate_id,menu_item_id,confirmed_by) VALUES($1,$2,$3)',
          [
            item.sourceCandidateId,
            menu.find((r: any) => r.position === position).id,
            actor.userId,
          ],
        );
        await m.query(
          'UPDATE food.extracted_food_items SET confirmed=true WHERE id=$1',
          [item.sourceCandidateId],
        );
      }
  }
  async catalog() {
    return this.db.query(
      `SELECT coalesce(o.metadata->>'slug',o.id::text) AS id,p.name,l.address,l.latitude AS lat,l.longitude AS lng,o.name AS meal,o.description,o.serving_temperature AS "servingTemperature",o.dietary_tags AS "dietaryTags",o.allergens,coalesce(o.metadata->>'distance','') AS distance,coalesce(o.metadata->>'hours','Confirm service hours') AS hours FROM food.meal_offers o JOIN directory.locations l ON l.id=o.location_id JOIN directory.providers p ON p.id=l.provider_id WHERE o.data_class='demo' OR (o.available_from<=now() AND o.available_until>now()) ORDER BY o.id`,
    );
  }
  async directory() {
    return this.db.query(
      `SELECT l.id,p.name,l.address,l.borough,l.latitude AS lat,l.longitude AS lng,p.phone,p.website,p.partner_verified AS "partnerVerified",s.service_type AS "serviceType",s.description,d.url AS "sourceUrl",d.retrieved_at AS "retrievedAt" FROM directory.providers p JOIN directory.locations l ON l.provider_id=p.id JOIN directory.services s ON s.location_id=l.id JOIN audit.source_records r ON r.id=s.source_record_id JOIN audit.data_sources d ON d.id=r.source_id WHERE p.data_class='public_directory' ORDER BY l.borough,p.name LIMIT 200`,
    );
  }
  async scan(input: any) {
    if (input.phase !== 'entry')
      throw new BadRequestException(
        'Use the finish visit button; exit QR codes are no longer used.',
      );
    return this.db.transaction(async (m) => {
      const qr = (
        await m.query(
          'SELECT q.*,l.provider_id FROM feedback.venue_qr_codes q JOIN directory.locations l ON l.id=q.location_id WHERE token_hash=$1 AND active=true',
          [hash(input.code)],
        )
      )[0];
      if (!qr || qr.phase !== input.phase)
        throw new BadRequestException('Use a valid venue code for this step.');
      const visitId = randomUUID(),
        secret = randomBytes(32).toString('base64url');
      await m.query(
        'INSERT INTO feedback.visits(id,location_id,secret_hash) VALUES($1,$2,$3)',
        [visitId, qr.location_id, hash(secret)],
      );
      const duplicate = (
        await m.query(
          'SELECT id FROM feedback.visit_scans WHERE visit_id=$1 AND phase=$2',
          [visitId, input.phase],
        )
      )[0];
      if (duplicate)
        throw new BadRequestException('This step has already been recorded.');
      const scan = (
        await m.query(
          'INSERT INTO feedback.visit_scans(id,visit_id,qr_code_id,phase,device_recorded_at,latitude,longitude,accuracy_meters,capture_method,location_source) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING server_recorded_at',
          [
            randomUUID(),
            visitId,
            qr.id,
            input.phase,
            input.deviceRecordedAt || null,
            input.location?.latitude ?? null,
            input.location?.longitude ?? null,
            input.location?.accuracyMeters ?? null,
            input.method,
            this.config.get('DEMO_LOCATION_MODE') === 'true'
              ? 'simulated'
              : input.location
                ? 'device'
                : 'unspecified',
          ],
        )
      )[0];
      return {
        visitId,
        secret,
        venueId: qr.location_id,
        recordedAt: scan.server_recorded_at,
      };
    });
  }
  async visitReview(input: any) {
    const reviewId = randomUUID();
    const context = await this.db.transaction(async (m) => {
      const visit = (
        await m.query(
          'SELECT * FROM feedback.visits WHERE id=$1 AND secret_hash=$2 FOR UPDATE',
          [input.visitId, hash(input.secret)],
        )
      )[0];
      if (!visit)
        throw new ForbiddenException('Visit credentials are invalid.');
      const scans = await m.query(
        'SELECT phase,server_recorded_at,device_recorded_at,latitude,longitude,accuracy_meters,capture_method,location_source FROM feedback.visit_scans WHERE visit_id=$1 ORDER BY server_recorded_at',
        [input.visitId],
      );
      if (!scans.some((s: any) => s.phase === 'entry') || !visit.finished_at)
        throw new BadRequestException(
          'Check in and finish your visit before leaving a review.',
        );
      if (
        (
          await m.query(
            'SELECT id FROM feedback.visit_reviews WHERE visit_id=$1',
            [input.visitId],
          )
        ).length
      )
        throw new BadRequestException('A review has already been submitted.');
      await m.query(
        'INSERT INTO feedback.visit_reviews(id,visit_id,sentiment,raw_text) VALUES($1,$2,$3,$4)',
        [reviewId, input.visitId, input.sentiment, input.rawText],
      );
      const entry = scans.find((s: any) => s.phase === 'entry');
      return {
        scans,
        completionMethod: visit.completion_method,
        finishedAt: visit.finished_at,
        durationMeaning:
          'Approximate time until the visitor presses finish, not verified departure or queue time. No exit GPS.',
        elapsedMinutes:
          (Date.parse(visit.finished_at) -
            Date.parse(entry.server_recorded_at)) /
          60000,
        venue: (
          await m.query(
            'SELECT latitude,longitude FROM directory.locations WHERE id=$1',
            [visit.location_id],
          )
        )[0],
      };
    });
    const analysis = await this.ai.analyze(
      input.rawText,
      context,
      undefined,
      reviewId,
      'feedback_analysis',
    );
    await this.saveAnalysis(reviewId, 'visit', analysis);
    return { reviewId, received: true };
  }
  async saveAnalysis(
    id: string,
    type: 'visit' | 'handoff',
    a: any,
    m: EntityManager = this.db.manager,
  ) {
    await m.query(
      `INSERT INTO feedback.review_analysis(id,visit_review_id,handoff_review_id,job_id,flags,summary,consistency,uncertainties,analysis_mode) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        randomUUID(),
        type === 'visit' ? id : null,
        type === 'handoff' ? id : null,
        a.jobId,
        a.flags,
        a.summary,
        a.consistency,
        a.uncertainties,
        a.mode,
      ],
    );
  }
  async adminReviews(actor: Actor) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    return this.db.query(
      `SELECT r.id,r.sentiment,r.raw_text,r.created_at,r.moderation_status,v.location_id,p.name AS "venueName",a.flags,a.summary,a.consistency,a.uncertainties,a.requires_human_review,a.analysis_mode,(SELECT jsonb_agg(jsonb_build_object('phase',s.phase,'recordedAt',s.server_recorded_at,'latitude',s.latitude,'longitude',s.longitude,'accuracyMeters',s.accuracy_meters,'method',s.capture_method,'locationSource',s.location_source) ORDER BY s.server_recorded_at) FROM feedback.visit_scans s WHERE s.visit_id=v.id) AS scans FROM feedback.visit_reviews r JOIN feedback.visits v ON v.id=r.visit_id JOIN directory.locations l ON l.id=v.location_id LEFT JOIN directory.providers p ON p.id=l.provider_id LEFT JOIN feedback.review_analysis a ON a.visit_review_id=r.id ORDER BY r.created_at DESC LIMIT 100`,
    );
  }
  async finishVisit(input: any) {
    const rows = await this.db.query(
      `WITH completed AS (UPDATE feedback.visits v SET finished_at=coalesce(finished_at,clock_timestamp()),completion_method=coalesce(completion_method,'button') WHERE id=$1 AND secret_hash=$2 AND EXISTS(SELECT 1 FROM feedback.visit_scans s WHERE s.visit_id=v.id AND s.phase='entry') RETURNING finished_at) SELECT * FROM completed`,
      [input.visitId, hash(input.secret)],
    );
    if (!rows.length)
      throw new ForbiddenException(
        'Check in first using valid visit credentials.',
      );
    return { finishedAt: rows[0].finished_at, completionMethod: 'button' };
  }
  async issueVisitCodes(id: string, actor: Actor) {
    const c = (
      await this.db.query(
        'SELECT * FROM directory.partner_centers WHERE id=$1',
        [id],
      )
    )[0];
    if (!c) throw new NotFoundException();
    if (
      actor.role !== 'ADMIN' &&
      !(actor.role === 'NGO' && c.owner_id === actor.userId)
    )
      throw new ForbiddenException();
    if (!c.approved)
      throw new BadRequestException('Center approval is required.');
    return { entry: c.qr_code };
  }
  async moderateReview(id: string, actor: Actor) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    const rows = await this.db.query(
      "UPDATE feedback.visit_reviews SET moderation_status='reviewed' WHERE id=$1 RETURNING id",
      [id],
    );
    if (!rows.length) throw new NotFoundException();
    await this.db.query(
      "INSERT INTO audit.audit_events(record_id,actor_id,action) VALUES($1,$2,'visit_review.reviewed')",
      [id, actor.userId],
    );
    return { reviewed: true };
  }
}
