describe("optional simulated geolocation", () => {
  afterEach(() => {
    vi.stubEnv("VITE_DEMO_LOCATION_MODE", "false");
    vi.resetModules();
    vi.restoreAllMocks();
  });
  it("returns sample NYC coordinates without asking for location permission in demo mode", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_DEMO_LOCATION_MODE", "true");
    const spy = vi.spyOn(navigator.geolocation, "getCurrentPosition");
    const { gps } = await import("../samrit/api");
    expect(await gps()).toEqual({ lat: 40.7306, lng: -73.9866 });
    expect(spy).not.toHaveBeenCalled();
  });
  it("uses the real device provider when demo mode is off", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_DEMO_LOCATION_MODE", "false");
    const spy = vi
      .spyOn(navigator.geolocation, "getCurrentPosition")
      .mockImplementation((success) =>
        success({
          coords: { latitude: 40, longitude: -74 },
        } as GeolocationPosition),
      );
    const { gps } = await import("../samrit/api");
    expect(await gps()).toEqual({ lat: 40, lng: -74 });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
