import { localInputToISO, REGION } from "./api";
describe("US regional configuration", () => {
  it("uses New York and Eastern by default", () => {
    expect(REGION.city).toBe("New York City");
    expect(REGION.timeZone).toBe("America/New_York");
  });
  it("interprets event inputs in Eastern independent of the browser zone", () => {
    expect(localInputToISO("2026-07-01T09:30")).toBe(
      "2026-07-01T13:30:00.000Z",
    );
    expect(localInputToISO("2026-01-01T09:30")).toBe(
      "2026-01-01T14:30:00.000Z",
    );
  });
});
