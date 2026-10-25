import { SamritService } from './samrit.service';
describe('server-controlled demo location mode', () => {
  function service(mode?: string) {
    return new SamritService(
      {} as any,
      {} as any,
      {
        get: (key: string) => (key === 'DEMO_LOCATION_MODE' ? mode : undefined),
      } as any,
      { configured: false } as any,
    ) as any;
  }
  const far = { lat: 0, lng: 0 },
    venue = { lat: 40.73, lng: -73.98 };
  it('keeps real proximity checks enabled by default', () => {
    expect(() => service().nearby(far, venue)).toThrow('Move within');
    expect(() => service('false').nearby(far, venue)).toThrow('Move within');
  });
  it('allows distant demo handoffs only when the server flag is explicitly enabled', () => {
    expect(() => service('true').nearby(far, venue)).not.toThrow();
    expect(service('true').configData().demoLocationMode).toBe(true);
  });
  it('retains simulated provenance when reducing a stored photo to custody proof', () => {
    expect(
      service('true').proofOnly({
        url: 'demo',
        ...far,
        locationSource: 'simulated',
      }).locationSource,
    ).toBe('simulated');
  });
});
