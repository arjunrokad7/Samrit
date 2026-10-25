import { SamritService } from './samrit.service';

describe('mixed handling rescue batches', () => {
  afterEach(() => jest.useRealTimers());
  function setup() {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-25T16:00:00Z'));
    const location = { lat: 40.73, lng: -73.98, address: 'Test NYC' };
    const items = ['hot', 'refrigerated', 'frozen'].map(
      (handlingRequirement, i) => ({
        name: `Dish ${i}`,
        ingredients: [],
        allergens: [],
        estimatedServings: 10,
        handlingRequirement,
        verified: true,
      }),
    );
    const records = new Map<string, any>([
      [
        'event:event',
        {
          donorId: 'donor',
          eventId: 'event',
          name: 'Mixed event',
          scheduledAt: '2026-10-25T12:00:00Z',
          location,
          items,
        },
      ],
      [
        'photo:photo',
        {
          actorId: 'donor',
          stage: 1,
          ...location,
          url: 'test.png',
          timestamp: new Date().toISOString(),
          sha256: 'test',
        },
      ],
      [
        'center:center',
        {
          centerId: 'center',
          approved: true,
          location,
          timeZone: 'America/New_York',
          capabilities: {
            hotHolding: true,
            refrigeration: true,
            freezer: true,
            maxMealCapacity: 100,
          },
          operatingHours: { open: '00:00', close: '23:59' },
        },
      ],
      [
        'vehicle:vehicle',
        {
          vehicleId: 'vehicle',
          status: 'ready',
          capacityServings: 100,
          capabilities: ['hot'],
          name: 'Test truck',
          registration: 'TEST',
        },
      ],
    ]);
    const manager = {
      query: jest.fn().mockResolvedValue([]),
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 'driver', latitude: location.lat, longitude: location.lng },
        ]),
    };
    const store = {
      get: jest.fn(async (kind, id) => records.get(`${kind}:${id}`)),
      all: jest.fn(async (kind) =>
        [...records.entries()]
          .filter(([key]) => key.startsWith(kind + ':'))
          .map(([, value]) => value),
      ),
      put: jest.fn(async (kind, id, value) => {
        records.set(`${kind}:${id}`, value);
        return value;
      }),
    };
    const service = new SamritService(
      { manager: { transaction: async (fn) => fn(manager) } } as any,
      {} as any,
      { get: () => undefined } as any,
      {} as any,
      store as any,
    );
    const input = {
      donorEventId: 'event',
      items,
      handlingRequirement: 'hot',
      handlingRequirements: ['hot', 'refrigerated', 'frozen'],
      expiresAt: '2026-10-25T20:00:00Z',
      photoId: 'photo',
    };
    return { service, records, input, store };
  }
  it('creates one mixed batch and refuses dispatch until the vehicle supports every required type', async () => {
    const { service, records, input } = setup();
    const batch = await service.batch(input, {
      userId: 'donor',
      role: 'DONOR',
    });
    expect(batch.handlingRequirements).toEqual([
      'hot',
      'refrigerated',
      'frozen',
    ]);
    const assignment = {
      batchId: batch.batchId,
      driverId: 'driver',
      vehicleId: 'vehicle',
    };
    await expect(
      service.match(assignment, { userId: 'admin', role: 'ADMIN' }),
    ).rejects.toThrow('required equipment');
    records.get('vehicle:vehicle').capabilities = [
      'hot',
      'refrigerated',
      'frozen',
    ];
    await service.match(assignment, { userId: 'admin', role: 'ADMIN' });
    expect(records.get(`batch:${batch.batchId}`).status).toBe('matched');
  });
  it('rejects an incomplete handling declaration before linking a photo or writing a batch', async () => {
    const { service, input, store } = setup();
    await expect(
      service.batch(
        { ...input, handlingRequirements: ['hot'] },
        { userId: 'donor', role: 'DONOR' },
      ),
    ).rejects.toThrow('every handling requirement');
    expect(store.put).not.toHaveBeenCalled();
  });
});
