import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { EntityManager } from 'typeorm';
import { batchHandlingRequirements } from '../../../shared/types/samrit';
export const stableId = (value: string) => {
  const h = createHash('sha256').update(value).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const NGO = '10000000-0000-4000-8000-000000000001';
@Injectable()
export class RelationalStore {
  async all<T>(kind: string, m: EntityManager): Promise<T[]> {
    const rows = await m.query(
      'SELECT id FROM app.domain_records WHERE kind=$1 ORDER BY created_at DESC',
      [kind],
    );
    return Promise.all(rows.map((r: any) => this.get<T>(kind, r.id, m)));
  }
  async get<T>(kind: string, id: string, m: EntityManager): Promise<T> {
    const rows = await m.query(
      'SELECT payload FROM app.domain_payloads WHERE kind=$1 AND id=$2',
      [kind, id],
    );
    if (!rows[0]) throw new NotFoundException(`${kind} not found`);
    const payload = rows[0].payload;
    const locationTable = {
      scan: 'evidence.custody_events',
      driver_location: 'evidence.location_reports',
    }[kind];
    if (locationTable) {
      const source = await m.query(
        `SELECT location_source FROM ${locationTable} WHERE id=$1`,
        [id],
      );
      payload.locationSource = source[0]?.location_source || 'unspecified';
    }
    return kind === 'batch'
      ? { ...payload, handlingRequirements: batchHandlingRequirements(payload) }
      : payload;
  }
  private async upsert(
    m: EntityManager,
    table: string,
    row: Record<string, any>,
    keys = ['id'],
  ) {
    const cols = Object.keys(row),
      values = cols.map((k) => (row[k] === undefined ? null : row[k]));
    const update = cols
      .filter((k) => !keys.includes(k))
      .map((k) => `"${k}"=EXCLUDED."${k}"`)
      .join(',');
    await m.query(
      `INSERT INTO ${table} (${cols.map((k) => '"' + k + '"').join(',')}) VALUES (${cols.map((_, i) => '$' + (i + 1)).join(',')}) ON CONFLICT(${keys.join(',')}) DO ${update ? 'UPDATE SET ' + update : 'NOTHING'}`,
      values,
    );
  }
  private async location(
    m: EntityManager,
    id: string,
    p: any,
    provider?: string,
    timeZone = 'America/New_York',
  ) {
    await this.upsert(m, 'directory.locations', {
      id,
      provider_id: provider,
      address: p.address,
      latitude: p.lat,
      longitude: p.lng,
      timezone: timeZone,
      coordinate_source: 'operator_supplied',
    });
    return id;
  }
  async put(
    kind: string,
    id: string,
    p: any,
    m: EntityManager,
    createdAt?: string,
  ) {
    const actor =
      p.donorId || p.ownerId || p.actorId || p.authorId || p.driverId || null;
    await m.query(
      `INSERT INTO app.domain_records(id,kind,actor_id,created_at) VALUES($1,$2,$3,coalesce($4::timestamptz,now())) ON CONFLICT(id) DO UPDATE SET updated_at=now()`,
      [id, kind, actor, createdAt || p.createdAt || null],
    );
    const metadata = JSON.stringify(p.metadata || {});
    if (kind === 'event') {
      const location = await this.location(
        m,
        stableId('event-location:' + id),
        p.location,
      );
      await this.upsert(m, 'food.donor_events', {
        id,
        donor_id: p.donorId,
        organization_id: p.donorId,
        location_id: location,
        name: p.name,
        scheduled_at: p.scheduledAt,
        notes: p.notes || '',
        metadata,
      });
      for (const [position, item] of p.items.entries()) {
        const itemId = stableId(id + ':item:' + position);
        await this.upsert(m, 'food.menu_items', {
          id: itemId,
          event_id: id,
          position,
          name: item.name,
          estimated_servings: item.estimatedServings,
          handling: item.handlingRequirement,
          verified: item.verified,
          description: item.description || null,
          metadata: JSON.stringify(item.metadata || {}),
        });
        await m.query(
          'DELETE FROM food.menu_item_ingredients WHERE menu_item_id=$1',
          [itemId],
        );
        for (const [i, name] of [
          ...new Set<string>(item.ingredients),
        ].entries()) {
          const normalized = name.trim().toLowerCase(),
            ingredientId = stableId('ingredient:' + normalized);
          await this.upsert(m, 'food.ingredients', {
            id: ingredientId,
            name,
            normalized_name: normalized,
          });
          await this.upsert(
            m,
            'food.menu_item_ingredients',
            { menu_item_id: itemId, ingredient_id: ingredientId, position: i },
            ['menu_item_id', 'ingredient_id'],
          );
        }
        await m.query(
          'DELETE FROM food.menu_item_allergens WHERE menu_item_id=$1',
          [itemId],
        );
        for (const allergen of item.allergens)
          await m.query(
            'INSERT INTO food.menu_item_allergens SELECT $1,id FROM food.allergens WHERE name=$2 ON CONFLICT DO NOTHING',
            [itemId, allergen],
          );
      }
    } else if (kind === 'center') {
      const provider = stableId('provider:' + id);
      await this.upsert(m, 'directory.providers', {
        id: provider,
        name: p.name,
        organization_id: p.ownerId,
        data_class: 'operational',
        partner_verified: p.approved,
      });
      const location = await this.location(
        m,
        stableId('center-location:' + id),
        p.location,
        provider,
        p.timeZone,
      );
      await this.upsert(m, 'directory.partner_centers', {
        id,
        owner_id: p.ownerId,
        organization_id: p.ownerId,
        location_id: location,
        name: p.name,
        refrigeration: p.capabilities.refrigeration,
        hot_holding: p.capabilities.hotHolding,
        freezer: p.capabilities.freezer,
        capacity_servings: p.capabilities.maxMealCapacity,
        open_time: p.operatingHours.open,
        close_time: p.operatingHours.close,
        seating: p.seating,
        staffing: p.staffing,
        qr_code: p.locationQrCode,
        approved: p.approved,
        metadata,
      });
      if (p.approved)
        await m.query(
          `INSERT INTO feedback.venue_qr_codes(id,location_id,phase,token_hash) VALUES($1,$2,'entry',$3) ON CONFLICT(token_hash) DO UPDATE SET active=true`,
          [
            stableId('venue-entry:' + id),
            location,
            createHash('sha256').update(p.locationQrCode).digest('hex'),
          ],
        );
    } else if (kind === 'vehicle') {
      await this.upsert(m, 'logistics.vehicles', {
        id,
        organization_id: NGO,
        name: p.name,
        registration: p.registration,
        capacity_servings: p.capacityServings,
        status: p.status,
        metadata,
      });
      await m.query(
        'DELETE FROM logistics.vehicle_capabilities WHERE vehicle_id=$1',
        [id],
      );
      for (const handling of [...new Set(p.capabilities)])
        await m.query(
          'INSERT INTO logistics.vehicle_capabilities VALUES($1,$2)',
          [id, handling],
        );
      await m.query(
        'DELETE FROM logistics.vehicle_equipment WHERE vehicle_id=$1',
        [id],
      );
      for (const name of [...new Set<string>(p.equipment)]) {
        const eid = stableId('equipment:' + name);
        await this.upsert(m, 'logistics.equipment_types', { id: eid, name });
        await m.query('INSERT INTO logistics.vehicle_equipment VALUES($1,$2)', [
          id,
          eid,
        ]);
      }
    } else if (kind === 'photo') {
      await this.upsert(m, 'evidence.photos', {
        id,
        location_source: p.locationSource || 'unspecified',
        actor_id: p.actorId,
        stage: p.stage,
        batch_id: p.batchId,
        url: p.url,
        sha256: p.sha256,
        latitude: p.lat,
        longitude: p.lng,
        captured_at: p.timestamp,
      });
    } else if (kind === 'batch') {
      const proof = async (v: any) =>
        v
          ? (
              await m.query(
                'SELECT id FROM evidence.photos WHERE url=$1 AND sha256=$2',
                [v.url, v.sha256],
              )
            )[0]?.id
          : null;
      const location = await this.location(
        m,
        stableId('batch-location:' + id),
        p.location,
      );
      await this.upsert(m, 'food.food_batches', {
        id,
        event_id: p.donorEventId,
        donor_id: p.donorId,
        location_id: location,
        status: p.status,
        handling: p.handlingRequirement,
        expires_at: p.expiresAt,
        sticker_id: p.qrStickerId,
        center_id: p.centerId,
        driver_id: p.driverId,
        donor_photo_id: await proof(p.chainOfCustody.stage1_DonorPic),
        pickup_photo_id: await proof(p.chainOfCustody.stage2_PickupPic),
        dropoff_photo_id: await proof(p.chainOfCustody.stage3_DropoffPic),
        rejection_reason: p.rejectionReason,
        metadata,
      });
      await m.query('DELETE FROM food.batch_items WHERE batch_id=$1', [id]);
      for (const item of p.items) {
        const menu = (
          await m.query(
            'SELECT id FROM food.menu_items WHERE event_id=$1 AND name=$2 AND handling=$3 ORDER BY position LIMIT 1',
            [p.donorEventId, item.name, item.handlingRequirement],
          )
        )[0];
        if (!menu)
          throw Error('Batch item is absent from its confirmed event menu');
        await m.query('INSERT INTO food.batch_items VALUES($1,$2,$3)', [
          id,
          menu.id,
          item.estimatedServings,
        ]);
      }
    } else if (kind === 'route') {
      await this.upsert(m, 'logistics.routes', {
        id,
        driver_id: p.driverId,
        vehicle_id: p.vehicleId,
        center_id: p.centerId,
        status: p.status,
        distance_miles: p.distanceMiles,
        estimated_minutes: p.estimatedMinutes,
        vehicle_snapshot: p.vehicleSnapshot
          ? JSON.stringify(p.vehicleSnapshot)
          : null,
        cancelled_at: p.cancelledAt,
        cancellation_reason: p.cancellationReason,
        metadata,
      });
      await m.query('DELETE FROM logistics.route_batches WHERE route_id=$1', [
        id,
      ]);
      for (const bid of p.assignedBatches)
        await m.query('INSERT INTO logistics.route_batches VALUES($1,$2)', [
          id,
          bid,
        ]);
      await m.query('DELETE FROM logistics.route_stops WHERE route_id=$1', [
        id,
      ]);
      for (const [position, w] of p.waypoints.entries()) {
        const location = await this.location(
          m,
          stableId(id + ':stop-location:' + position),
          w.location,
        );
        await this.upsert(m, 'logistics.route_stops', {
          id: stableId(id + ':stop:' + position),
          route_id: id,
          batch_id: w.batchId,
          location_id: location,
          position,
          stop_type: w.type,
          status: w.status,
        });
      }
    } else if (kind === 'scan') {
      await this.upsert(m, 'evidence.custody_events', {
        id,
        location_source: p.locationSource || 'unspecified',
        batch_id: p.batchId,
        actor_id: p.actorId,
        event_type: p.kind,
        scanned_value: p.value,
        latitude: p.lat,
        longitude: p.lng,
        occurred_at: p.timestamp,
      });
    } else if (kind === 'driver_location') {
      await this.upsert(m, 'evidence.location_reports', {
        id,
        location_source: p.locationSource || 'unspecified',
        driver_id: p.driverId,
        latitude: p.lat,
        longitude: p.lng,
        reported_at: p.timestamp,
        source: p.source,
      });
    } else if (kind === 'review') {
      await this.upsert(m, 'feedback.reviews', {
        id,
        author_id: p.authorId,
        target_type: p.targetType,
        target_id: p.targetId,
        donor_id: p.targetType === 'donor' ? p.targetId : null,
        center_id: p.targetType === 'center' ? p.targetId : null,
        batch_id: p.linkedBatchId,
        sentiment: p.sentiment,
        raw_text: p.rawText,
        parsed_flags: p.aiParsedFlags,
        analysis_mode: p.analysisMode,
        metadata,
      });
    } else throw Error('Unsupported domain kind');
    await m.query(
      'INSERT INTO audit.audit_events(record_id,actor_id,action) VALUES($1,$2,$3)',
      [id, actor, createdAt ? 'legacy_migration' : kind + '.saved'],
    );
    return p;
  }
}
