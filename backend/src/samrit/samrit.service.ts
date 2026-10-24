import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { SamritRecord } from './samrit.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { SamritAI } from './ai.service';
import type {
  FoodBatch,
  CenterProfile,
  DonorEvent,
  DispatchRoute,
  FeedbackReview,
  CustodyScan,
  Location,
  Proof,
} from '../../../shared/types/samrit';

export interface Actor {
  userId: string;
  role: string;
}
export function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const rad = Math.PI / 180;
  const x =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) *
      Math.cos(b.lat * rad) *
      Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function isOpen(center: CenterProfile, date = new Date()) {
  const current = new Intl.DateTimeFormat('en-GB', {
    timeZone: center.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  const { open, close } = center.operatingHours;
  return open < close
    ? current >= open && current < close
    : current >= open || current < close;
}
export function canHandle(center: CenterProfile, batch: FoodBatch) {
  return (
    batch.handlingRequirement === 'shelf_stable' ||
    (batch.handlingRequirement === 'hot' && center.capabilities.hotHolding) ||
    (batch.handlingRequirement === 'refrigerated' &&
      center.capabilities.refrigeration) ||
    (batch.handlingRequirement === 'frozen' && center.capabilities.freezer)
  );
}
export const servings = (batch: FoodBatch) =>
  batch.items.reduce((sum, item) => sum + item.estimatedServings, 0);

@Injectable()
export class SamritService {
  constructor(
    @InjectRepository(SamritRecord) private records: Repository<SamritRecord>,
    @InjectRepository(User) private users: Repository<User>,
    private config: ConfigService,
    private ai: SamritAI,
  ) {}
  require(actor: Actor, roles: string[]) {
    if (!roles.includes(actor.role))
      throw new ForbiddenException('Your role cannot perform this action.');
  }
  private async tx<T>(operation: (manager: EntityManager) => Promise<T>) {
    return this.records.manager.transaction(async (manager) => {
      // Serialize custody and capacity changes across processes, not just this server.
      await manager.query('SELECT pg_advisory_xact_lock(82461520)');
      return operation(manager);
    });
  }
  private async all<T>(
    kind: string,
    manager = this.records.manager,
  ): Promise<T[]> {
    return (
      await manager.find(SamritRecord, {
        where: { kind },
        order: { createdAt: 'DESC' },
      })
    ).map((record) => record.payload);
  }
  private async get<T>(
    kind: string,
    id: string,
    manager = this.records.manager,
  ): Promise<T> {
    const record = await manager.findOne(SamritRecord, { where: { kind, id } });
    if (!record) throw new NotFoundException(`${kind} not found`);
    return record.payload;
  }
  private async put(
    kind: string,
    id: string,
    payload: any,
    manager = this.records.manager,
  ) {
    await manager.save(SamritRecord, { id, kind, payload });
    return payload;
  }
  async activeActor(actor: Actor) {
    const user = await this.users.findOne({ where: { id: actor.userId } });
    if (!user?.isActive) throw new ForbiddenException('Account is inactive.');
    return { userId: user.id, role: user.role };
  }
  configData() {
    return {
      name: 'Samrit',
      country: 'US',
      locale: this.config.get('APP_LOCALE') || 'en-US',
      timeZone: this.config.get('APP_TIMEZONE') || 'America/New_York',
      city: this.config.get('APP_CITY') || 'New York City',
      currency: 'USD',
      distanceUnit: 'mi',
      temperatureUnit: 'F',
      map: {
        lat: Number(this.config.get('DEFAULT_LATITUDE') || 40.7306),
        lng: Number(this.config.get('DEFAULT_LONGITUDE') || -73.9866),
      },
      aiConfigured: this.ai.configured,
    };
  }
  async overview(actor: Actor) {
    const batches = await this.all<FoodBatch>('batch');
    const centers = await this.all<CenterProfile>('center');
    const events = await this.all<DonorEvent>('event');
    const routes = await this.all<DispatchRoute>('route');
    const visible = batches.filter(
      (batch) =>
        actor.role === 'ADMIN' ||
        batch.donorId === actor.userId ||
        batch.driverId === actor.userId ||
        centers.some(
          (center) =>
            center.ownerId === actor.userId &&
            center.centerId === batch.centerId,
        ),
    );
    const users =
      actor.role === 'ADMIN'
        ? await this.users.find({
            where: { role: UserRole.VOLUNTEER, isActive: true },
            select: ['id', 'name', 'isAvailable', 'latitude', 'longitude'],
          })
        : [];
    const scans = (await this.all<CustodyScan>('scan')).filter((scan) =>
      visible.some((batch) => batch.batchId === scan.batchId),
    );
    return {
      config: this.configData(),
      batches: visible,
      events: events.filter(
        (event) => actor.role === 'ADMIN' || event.donorId === actor.userId,
      ),
      centers: centers.filter(
        (center) =>
          actor.role === 'ADMIN' ||
          center.ownerId === actor.userId ||
          visible.some((batch) => batch.centerId === center.centerId),
      ),
      routes: routes.filter(
        (route) =>
          actor.role === 'ADMIN' ||
          route.driverId === actor.userId ||
          centers.some(
            (center) =>
              center.ownerId === actor.userId &&
              route.centerId === center.centerId,
          ),
      ),
      reviews:
        actor.role === 'ADMIN' ? await this.all<FeedbackReview>('review') : [],
      scans,
      drivers: users,
    };
  }
  async event(input: any, actor: Actor) {
    this.require(actor, ['DONOR']);
    const event: DonorEvent = {
      ...input,
      eventId: randomUUID(),
      donorId: actor.userId,
    };
    return this.put('event', event.eventId, event);
  }
  async center(input: any, actor: Actor) {
    this.require(actor, ['NGO']);
    return this.tx(async (manager) => {
      const existing = (await this.all<CenterProfile>('center', manager)).find(
        (center) => center.ownerId === actor.userId,
      );
      const id = existing?.centerId || randomUUID();
      const user = await manager.findOne(User, { where: { id: actor.userId } });
      const center: CenterProfile = {
        ...input,
        centerId: id,
        ownerId: actor.userId,
        locationQrCode: existing?.locationQrCode || `SAMRIT:CENTER:${id}`,
        approved: !!user?.isVerified,
      };
      return this.put('center', id, center, manager);
    });
  }
  async approve(centerId: string, actor: Actor) {
    this.require(actor, ['ADMIN']);
    return this.tx(async (manager) => {
      const center = await this.get<CenterProfile>('center', centerId, manager);
      center.approved = true;
      await manager.update(User, { id: center.ownerId }, { isVerified: true });
      return this.put('center', centerId, center, manager);
    });
  }
  async upload(
    file: Express.Multer.File,
    input: { stage: number; lat: number; lng: number },
    actor: Actor,
  ) {
    this.require(
      actor,
      input.stage === 1
        ? ['DONOR']
        : input.stage === 2
          ? ['VOLUNTEER']
          : ['NGO'],
    );
    if (!file?.buffer || file.size > 5 * 1024 * 1024)
      throw new BadRequestException('Upload a food photo up to 5 MB.');
    const buffer = file.buffer;
    const ext = buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      ? 'jpg'
      : buffer
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? 'png'
        : buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WEBP'
          ? 'webp'
          : null;
    if (!ext)
      throw new BadRequestException(
        'Only JPEG, PNG, or WebP photos are supported.',
      );
    const id = randomUUID();
    const directory = resolve(this.config.get('UPLOAD_DIR') || 'uploads');
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, `${id}.${ext}`), buffer, { flag: 'wx' });
    const proof: Proof = {
      url: `/media/${id}.${ext}`,
      lat: input.lat,
      lng: input.lng,
      timestamp: new Date().toISOString(),
      actorId: actor.userId,
      sha256: createHash('sha256').update(buffer).digest('hex'),
    };
    await this.put('photo', id, {
      ...proof,
      photoId: id,
      stage: input.stage,
      batchId: null,
    });
    return { photoId: id, proof };
  }
  private nearby(gps: { lat: number; lng: number }, target: Location) {
    const maximum = Number(this.config.get('QR_MAX_DISTANCE_METERS') || 250);
    if (distanceMiles(gps, target) * 1609.344 > maximum)
      throw new BadRequestException(
        `Move within ${maximum} meters of the registered location to record this handoff.`,
      );
  }
  async batch(input: any, actor: Actor) {
    this.require(actor, ['DONOR']);
    return this.tx(async (manager) => {
      const event = await this.get<DonorEvent>(
        'event',
        input.donorEventId,
        manager,
      );
      if (event.donorId !== actor.userId)
        throw new ForbiddenException('This event belongs to another donor.');
      if (Date.parse(event.scheduledAt) > Date.now())
        throw new BadRequestException(
          'Leftover triage opens at the scheduled event time.',
        );
      if (Date.parse(input.expiresAt) <= Date.now())
        throw new BadRequestException('Use a future expiration time.');
      if (
        input.items.some(
          (item) => item.handlingRequirement !== input.handlingRequirement,
        )
      )
        throw new BadRequestException(
          'Split food requiring different handling into separate batches.',
        );
      const photo = await this.get<any>('photo', input.photoId, manager);
      if (photo.actorId !== actor.userId || photo.stage !== 1 || photo.batchId)
        throw new BadRequestException(
          'A new stage 1 photo from this donor is required.',
        );
      this.nearby(photo, event.location);
      const batch: FoodBatch = {
        batchId: randomUUID(),
        donorId: actor.userId,
        donorEventId: event.eventId,
        eventName: event.name,
        location: event.location,
        items: input.items,
        handlingRequirement: input.handlingRequirement,
        expiresAt: input.expiresAt,
        createdAt: new Date().toISOString(),
        status: 'pending',
        qrStickerId: null,
        centerId: null,
        driverId: null,
        chainOfCustody: {
          stage1_DonorPic: this.proofOnly(photo),
          stage2_PickupPic: null,
          stage3_DropoffPic: null,
        },
      };
      photo.batchId = batch.batchId;
      await this.put('photo', input.photoId, photo, manager);
      return this.put('batch', batch.batchId, batch, manager);
    });
  }
  private proofOnly(photo: Proof): Proof {
    return {
      url: photo.url,
      timestamp: photo.timestamp,
      lat: photo.lat,
      lng: photo.lng,
      actorId: photo.actorId,
      sha256: photo.sha256,
    };
  }
  async match(input: { batchId: string; driverId?: string }, actor: Actor) {
    this.require(actor, ['ADMIN']);
    return this.tx(async (manager) => {
      const batch = await this.get<FoodBatch>('batch', input.batchId, manager);
      if (batch.status !== 'pending')
        throw new ConflictException('Only pending batches can be matched.');
      if (Date.parse(batch.expiresAt) <= Date.now())
        throw new BadRequestException('This batch has expired.');
      const batches = await this.all<FoodBatch>('batch', manager);
      const reviews = await this.all<FeedbackReview>('review', manager);
      const eligible = (
        await this.all<CenterProfile>('center', manager)
      ).filter((center) => {
        const load = batches
          .filter(
            (other) =>
              other.centerId === center.centerId &&
              ['matched', 'in_transit'].includes(other.status),
          )
          .reduce((sum, other) => sum + servings(other), 0);
        const minutes = Math.ceil(
          (distanceMiles(batch.location, center.location) / 12) * 60 + 15,
        );
        return (
          center.approved &&
          isOpen(center) &&
          isOpen(center, new Date(Date.now() + minutes * 60000)) &&
          canHandle(center, batch) &&
          load + servings(batch) <= center.capabilities.maxMealCapacity &&
          Date.now() + minutes * 60000 < Date.parse(batch.expiresAt)
        );
      });
      // Private quality reports influence ranking; never expose ratings in center listings.
      const score = (center: CenterProfile) =>
        distanceMiles(batch.location, center.location) +
        reviews.filter(
          (review) =>
            review.targetId === center.centerId &&
            review.sentiment === 'negative',
        ).length *
          0.5;
      eligible.sort((a, b) => score(a) - score(b));
      if (!eligible.length)
        throw new BadRequestException(
          'No open, approved center has the required equipment, capacity, and travel time.',
        );
      const drivers = await manager.find(User, {
        where: { role: UserRole.VOLUNTEER, isActive: true, isAvailable: true },
      });
      const activeRoutes = (
        await this.all<DispatchRoute>('route', manager)
      ).filter((route) => route.status === 'active');
      const available = drivers.filter(
        (driver) =>
          driver.latitude != null &&
          driver.longitude != null &&
          !activeRoutes.some((route) => route.driverId === driver.id) &&
          (!input.driverId || driver.id === input.driverId) &&
          (batch.handlingRequirement === 'shelf_stable' ||
            driver.transportCapabilities?.includes(batch.handlingRequirement)),
      );
      available.sort(
        (a, b) =>
          distanceMiles(
            {
              lat: a.latitude ?? batch.location.lat,
              lng: a.longitude ?? batch.location.lng,
            },
            batch.location,
          ) -
          distanceMiles(
            {
              lat: b.latitude ?? batch.location.lat,
              lng: b.longitude ?? batch.location.lng,
            },
            batch.location,
          ),
      );
      if (!available.length)
        throw new BadRequestException(
          'No available driver has the required transport equipment and a free route. Update driver capabilities or finish their route first.',
        );
      const options = eligible
        .flatMap((center) =>
          available.map((driver) => {
            const distance =
              distanceMiles(
                { lat: driver.latitude, lng: driver.longitude },
                batch.location,
              ) + distanceMiles(batch.location, center.location);
            return {
              center,
              driver,
              distance,
              minutes: Math.ceil((distance / 12) * 60 + 15),
              score:
                score(center) +
                distanceMiles(
                  { lat: driver.latitude, lng: driver.longitude },
                  batch.location,
                ),
            };
          }),
        )
        .filter(
          (option) =>
            Date.now() + option.minutes * 60000 < Date.parse(batch.expiresAt) &&
            isOpen(
              option.center,
              new Date(Date.now() + option.minutes * 60000),
            ),
        )
        .sort((a, b) => a.score - b.score);
      if (!options.length)
        throw new BadRequestException(
          'Driver travel to pickup leaves insufficient time before expiry or center closing.',
        );
      const { center, driver, distance, minutes } = options[0];
      batch.centerId = center.centerId;
      batch.driverId = driver.id;
      batch.status = 'matched';
      const route: DispatchRoute = {
        routeId: randomUUID(),
        driverId: batch.driverId,
        centerId: center.centerId,
        status: 'active',
        assignedBatches: [batch.batchId],
        distanceMiles: Number(distance.toFixed(2)),
        estimatedMinutes: minutes,
        createdAt: new Date().toISOString(),
        waypoints: [
          {
            type: 'pickup',
            location: batch.location,
            batchId: batch.batchId,
            status: 'pending',
          },
          {
            type: 'dropoff',
            location: center.location,
            batchId: batch.batchId,
            status: 'pending',
          },
        ],
      };
      await this.put('route', route.routeId, route, manager);
      await this.put('batch', batch.batchId, batch, manager);
      return {
        batch,
        route,
        centerId: center.centerId,
        estimate:
          'Straight-line distance and assumed city speed; not live traffic routing.',
      };
    });
  }
  private driver(batch: FoodBatch, actor: Actor) {
    this.require(actor, ['VOLUNTEER']);
    if (batch.driverId !== actor.userId)
      throw new ForbiddenException('This batch is assigned to another driver.');
  }
  private async recordScan(
    batch: FoodBatch,
    actor: Actor,
    input: any,
    kind: CustodyScan['kind'],
    value: string,
    manager: EntityManager,
  ) {
    const scan: CustodyScan = {
      scanId: randomUUID(),
      batchId: batch.batchId,
      actorId: actor.userId,
      kind,
      value,
      lat: input.lat,
      lng: input.lng,
      timestamp: new Date().toISOString(),
    };
    return this.put('scan', scan.scanId, scan, manager);
  }
  async scan(input: any, actor: Actor) {
    return this.tx(async (manager) => {
      const batch = await this.get<FoodBatch>('batch', input.batchId, manager);
      this.driver(batch, actor);
      if (input.kind === 'event') {
        if (Date.parse(batch.expiresAt) <= Date.now())
          throw new BadRequestException(
            'This batch has expired. Ask central dispatch to reject it.',
          );
        if (
          batch.status !== 'matched' ||
          input.value !== `SAMRIT:EVENT:${batch.donorEventId}`
        )
          throw new BadRequestException(
            'Scan the assigned event QR before pickup.',
          );
        this.nearby(input, batch.location);
      } else {
        const center = await this.get<CenterProfile>(
          'center',
          batch.centerId,
          manager,
        );
        if (
          batch.status !== 'in_transit' ||
          input.value !== center.locationQrCode
        )
          throw new BadRequestException(
            'Scan the assigned center QR after pickup.',
          );
        this.nearby(input, center.location);
      }
      return this.recordScan(
        batch,
        actor,
        input,
        input.kind,
        input.value,
        manager,
      );
    });
  }
  async reject(batchId: string, reason: string, actor: Actor) {
    this.require(actor, ['ADMIN']);
    return this.tx(async (manager) => {
      const batch = await this.get<FoodBatch>('batch', batchId, manager);
      if (['delivered', 'rejected'].includes(batch.status))
        throw new ConflictException('This batch is already finalized.');
      batch.status = 'rejected';
      batch.rejectionReason = reason;
      for (const route of await this.all<DispatchRoute>('route', manager)) {
        if (
          route.status === 'active' &&
          route.assignedBatches.includes(batchId)
        ) {
          route.status = 'cancelled';
          await this.put('route', route.routeId, route, manager);
        }
      }
      return this.put('batch', batchId, batch, manager);
    });
  }
  async link(input: any, actor: Actor) {
    return this.tx(async (manager) => {
      const batch = await this.get<FoodBatch>('batch', input.batchId, manager);
      this.driver(batch, actor);
      if (Date.parse(batch.expiresAt) <= Date.now())
        throw new BadRequestException(
          'This batch has expired. Ask central dispatch to reject it.',
        );
      if (batch.status !== 'matched' || !batch.chainOfCustody.stage2_PickupPic)
        throw new BadRequestException(
          'Record the event scan and pickup photo before linking a sticker.',
        );
      if (
        (await this.all<FoodBatch>('batch', manager)).some(
          (other) => other.qrStickerId === input.qrStickerId,
        )
      )
        throw new ConflictException(
          'This tracking sticker is already permanently linked.',
        );
      this.nearby(input, batch.location);
      batch.qrStickerId = input.qrStickerId;
      batch.status = 'in_transit';
      await this.recordScan(
        batch,
        actor,
        input,
        'sticker_link',
        input.qrStickerId,
        manager,
      );
      await this.updateRoute(batch, 'pickup', manager);
      return this.put('batch', batch.batchId, batch, manager);
    });
  }
  async attach(
    batchId: string,
    photoId: string,
    sticker: string | undefined,
    gps: { lat: number; lng: number },
    actor: Actor,
  ) {
    return this.tx(async (manager) => {
      const batch = await this.get<FoodBatch>('batch', batchId, manager);
      const photo = await this.get<any>('photo', photoId, manager);
      if (Date.parse(batch.expiresAt) <= Date.now())
        throw new BadRequestException(
          'Expired food cannot complete a handoff. Ask central dispatch to reject it.',
        );
      if (photo.actorId !== actor.userId || photo.batchId)
        throw new BadRequestException(
          'Use a new photo captured by this account.',
        );
      if (photo.stage === 2) {
        this.driver(batch, actor);
        if (batch.status !== 'matched' || batch.chainOfCustody.stage2_PickupPic)
          throw new ConflictException(
            'Pickup photo is already recorded or this batch is not ready.',
          );
        if (
          !(await this.all<CustodyScan>('scan', manager)).some(
            (scan) =>
              scan.batchId === batchId &&
              scan.kind === 'event' &&
              scan.actorId === actor.userId,
          )
        )
          throw new BadRequestException('Scan the event QR first.');
        this.nearby(photo, batch.location);
        batch.chainOfCustody.stage2_PickupPic = this.proofOnly(photo);
      } else if (photo.stage === 3) {
        this.require(actor, ['NGO']);
        if (batch.status !== 'in_transit' || !batch.centerId)
          throw new BadRequestException(
            'Only an in-transit batch can be received.',
          );
        const center = await this.get<CenterProfile>(
          'center',
          batch.centerId,
          manager,
        );
        if (center.ownerId !== actor.userId)
          throw new ForbiddenException(
            'Only the receiving center can confirm intake.',
          );
        if (
          batch.status !== 'in_transit' ||
          !batch.qrStickerId ||
          sticker !== batch.qrStickerId
        )
          throw new BadRequestException(
            'Scan the container tracking sticker for this in-transit batch.',
          );
        if (
          !(await this.all<CustodyScan>('scan', manager)).some(
            (scan) =>
              scan.batchId === batchId &&
              scan.kind === 'center' &&
              scan.actorId === batch.driverId,
          )
        )
          throw new BadRequestException(
            'The driver must scan your location QR before intake.',
          );
        this.nearby(photo, center.location);
        this.nearby(gps, center.location);
        await this.recordScan(batch, actor, gps, 'center', sticker, manager);
        batch.chainOfCustody.stage3_DropoffPic = this.proofOnly(photo);
        batch.status = 'delivered';
        await this.updateRoute(batch, 'dropoff', manager);
      } else
        throw new BadRequestException(
          'Stage 1 is recorded when creating the batch and cannot be replaced.',
        );
      photo.batchId = batchId;
      await this.put('photo', photoId, photo, manager);
      return this.put('batch', batchId, batch, manager);
    });
  }
  private async updateRoute(
    batch: FoodBatch,
    type: string,
    manager: EntityManager,
  ) {
    const route = (await this.all<DispatchRoute>('route', manager)).find(
      (item) =>
        item.assignedBatches.includes(batch.batchId) &&
        item.status === 'active',
    );
    if (route) {
      route.waypoints
        .filter(
          (point) => point.batchId === batch.batchId && point.type === type,
        )
        .forEach((point) => {
          point.status = 'done';
        });
      if (route.waypoints.every((point) => point.status === 'done'))
        route.status = 'completed';
      await this.put('route', route.routeId, route, manager);
    }
  }
  async review(input: any, actor: Actor) {
    this.require(actor, ['NGO']);
    const batch = await this.get<FoodBatch>('batch', input.linkedBatchId);
    if (batch.status !== 'delivered' || !batch.centerId)
      throw new ForbiddenException(
        'Reviews require a delivered batch received by your center.',
      );
    const center = await this.get<CenterProfile>('center', batch.centerId);
    if (center.ownerId !== actor.userId || batch.status !== 'delivered')
      throw new ForbiddenException(
        'Reviews require a delivered batch received by your center.',
      );
    if (
      (input.targetType === 'donor' && input.targetId !== batch.donorId) ||
      (input.targetType === 'center' && input.targetId !== center.centerId)
    )
      throw new BadRequestException(
        'Review target must belong to this handoff.',
      );
    const analysis = await this.ai.flags(input.rawText);
    const review: FeedbackReview = {
      ...input,
      reviewId: randomUUID(),
      authorId: actor.userId,
      aiParsedFlags: analysis.flags,
      analysisMode: analysis.mode,
      createdAt: new Date().toISOString(),
    };
    await this.put('review', review.reviewId, review);
    return { reviewId: review.reviewId, received: true }; // Analysis is central-NGO only.
  }
}
