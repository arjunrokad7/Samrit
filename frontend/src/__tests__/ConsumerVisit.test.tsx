import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ConsumerCheckIn from "../samrit/ConsumerCheckIn";
describe("single venue check-in and finish button", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (url) =>
        ({
          ok: true,
          json: async () => ({
            data: String(url).endsWith("/scan")
              ? {
                  visitId: "visit",
                  secret: "secret",
                  venueId: "venue",
                  recordedAt: new Date().toISOString(),
                }
              : String(url).endsWith("/finish")
                ? { finishedAt: new Date().toISOString() }
                : { received: true },
          }),
        }) as Response,
    );
    vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation(
      (_success, fail) =>
        fail?.({ code: 1, message: "Denied" } as GeolocationPositionError),
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("unlocks a private review with a finish button and no exit QR", async () => {
    render(
      <MemoryRouter>
        <ConsumerCheckIn />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("button", { name: "Finish visit and leave a review" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Venue check-in QR code"), {
      target: { value: "SAMRIT:CENTER:test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check in" }));
    await screen.findByText("You're checked in.");
    expect(
      screen.getByText(
        /Location unavailable; this visit can still be reviewed/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Exit QR code")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Finish visit and leave a review" }),
    );
    await screen.findByRole("button", { name: "Good experience" });
    expect(
      screen.getByRole("button", { name: "Submit private review" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Needs attention" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Submit private review" }),
    );
    await screen.findByText(/Your private review was received/);
    expect(
      vi
        .mocked(fetch)
        .mock.calls.filter(([url]) => String(url).endsWith("/scan")),
    ).toHaveLength(1);
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([url]) => String(url).endsWith("/finish")),
    ).toBe(true);
  });
  it("keeps the review closed when finish fails", async () => {
    vi.mocked(fetch).mockImplementation(async (url) =>
      String(url).endsWith("/finish")
        ? ({
            ok: false,
            json: async () => ({ message: "Try again" }),
          } as Response)
        : ({
            ok: true,
            json: async () => ({
              data: {
                visitId: "visit",
                secret: "secret",
                venueId: "venue",
                recordedAt: new Date().toISOString(),
              },
            }),
          } as Response),
    );
    render(
      <MemoryRouter>
        <ConsumerCheckIn />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Venue check-in QR code"), {
      target: { value: "SAMRIT:CENTER:test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check in" }));
    await screen.findByText("You're checked in.");
    fireEvent.click(
      screen.getByRole("button", { name: "Finish visit and leave a review" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Try again"),
    );
    expect(
      screen.queryByRole("button", { name: "Submit private review" }),
    ).not.toBeInTheDocument();
  });
});
