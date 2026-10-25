import { distanceMiles, canHandle, isOpen } from './samrit.service';
import { batchSchema, centerSchema, eventSchema } from './contracts';
import type { FoodBatch, CenterProfile } from '../../../shared/types/samrit';
const center: CenterProfile = {
  centerId: 'x',
  ownerId: 'x',
  name: 'NYC',
  approved: true,
  locationQrCode: 'x',
  location: { lat: 40.73, lng: -73.98, address: 'New York, NY' },
  timeZone: 'America/New_York',
  capabilities: {
    refrigeration: true,
    hotHolding: false,
    freezer: false,
    maxMealCapacity: 100,
  },
  operatingHours: { open: '08:00', close: '20:00' },
  seating: 10,
  staffing: 2,
};
describe('Samrit matching constraints', () => {
  it('requires every storage capability for a mixed batch', () => {
    const batch = {
      handlingRequirement: 'hot',
      items: [
        { handlingRequirement: 'hot' },
        { handlingRequirement: 'refrigerated' },
        { handlingRequirement: 'frozen' },
      ],
    } as FoodBatch;
    expect(canHandle(center, batch)).toBe(false);
    expect(
      canHandle(
        {
          ...center,
          capabilities: { ...center.capabilities, hotHolding: true },
        },
        batch,
      ),
    ).toBe(false);
    expect(
      canHandle(
        {
          ...center,
          capabilities: {
            ...center.capabilities,
            hotHolding: true,
            freezer: true,
          },
        },
        batch,
      ),
    ).toBe(true);
  });
  it('keeps frozen and chilled storage distinct', () => {
    expect(
      canHandle(center, { handlingRequirement: 'refrigerated' } as FoodBatch),
    ).toBe(true);
    expect(
      canHandle(center, { handlingRequirement: 'frozen' } as FoodBatch),
    ).toBe(false);
    expect(canHandle(center, { handlingRequirement: 'hot' } as FoodBatch)).toBe(
      false,
    );
  });
  it('uses Eastern local time through summer and winter offsets', () => {
    expect(isOpen(center, new Date('2026-07-01T12:30:00Z'))).toBe(true);
    expect(isOpen(center, new Date('2026-01-01T12:30:00Z'))).toBe(false);
  });
  it('supports overnight facilities and excludes the exact closing time', () => {
    const night = {
      ...center,
      operatingHours: { open: '20:00', close: '06:00' },
    };
    expect(isOpen(night, new Date('2026-10-24T05:00:00Z'))).toBe(true);
    expect(isOpen(night, new Date('2026-10-24T10:00:00Z'))).toBe(false);
  });
  it('returns miles and is symmetric', () => {
    expect(distanceMiles({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(
      69.09,
      1,
    );
    expect(distanceMiles(center.location, center.location)).toBe(0);
    expect(distanceMiles({ lat: 40, lng: -73 }, center.location)).toBe(
      distanceMiles(center.location, { lat: 40, lng: -73 }),
    );
  });
});
describe('Samrit contracts', () => {
  it('accepts multiple batch handling types and rejects zero servings', () => {
    const input = {
      donorEventId: '3dddbafd-92b3-430b-8530-b19fd87c1f1a',
      items: [
        { ...item, handlingRequirement: 'hot' },
        { ...item, name: 'Chilled salad', handlingRequirement: 'refrigerated' },
      ],
      handlingRequirement: 'hot',
      handlingRequirements: ['hot', 'refrigerated'],
      expiresAt: '2027-10-25T12:00:00Z',
      photoId: '22c9201e-f130-4aee-a23c-7a4ef23710f6',
    };
    expect(batchSchema.safeParse(input).success).toBe(true);
    expect(
      batchSchema.safeParse({
        ...input,
        items: [{ ...item, estimatedServings: 0 }],
      }).success,
    ).toBe(false);
  });
  const item = {
    name: 'Bread',
    ingredients: ['Wheat'],
    allergens: ['Wheat'],
    estimatedServings: 10,
    handlingRequirement: 'shelf_stable',
    verified: true,
  };
  const event = {
    name: 'Test event',
    scheduledAt: '2026-10-24T13:00:00Z',
    location: center.location,
    items: [item],
    notes: '',
  };
  it('requires human verification and the US allergen vocabulary', () => {
    expect(eventSchema.safeParse(event).success).toBe(true);
    expect(
      eventSchema.safeParse({ ...event, items: [{ ...item, verified: false }] })
        .success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({
        ...event,
        items: [{ ...item, allergens: ['Gluten'] }],
      }).success,
    ).toBe(false);
  });
  it('rejects client supplied status, identity, and proof URLs', () => {
    expect(
      batchSchema.safeParse({
        donorEventId: '3dddbafd-92b3-430b-8530-b19fd87c1f1a',
        items: [item],
        handlingRequirement: 'shelf_stable',
        expiresAt: '2026-10-25T12:00:00Z',
        photoId: '22c9201e-f130-4aee-a23c-7a4ef23710f6',
        status: 'delivered',
      }).success,
    ).toBe(false);
  });
  it('rejects invalid GPS, zone, and operating hours', () => {
    const input = {
      name: center.name,
      location: center.location,
      timeZone: center.timeZone,
      capabilities: center.capabilities,
      operatingHours: center.operatingHours,
      seating: center.seating,
      staffing: center.staffing,
    };
    expect(centerSchema.safeParse(input).success).toBe(true);
    expect(
      centerSchema.safeParse({ ...input, timeZone: 'Easternish' }).success,
    ).toBe(false);
    expect(
      centerSchema.safeParse({
        ...input,
        location: { ...input.location, lat: 999 },
      }).success,
    ).toBe(false);
    expect(
      centerSchema.safeParse({
        ...input,
        operatingHours: { open: '25:00', close: '06:00' },
      }).success,
    ).toBe(false);
  });
});
