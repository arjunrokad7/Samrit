import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Consumer from "../samrit/Consumer";
import { CONSUMER_MEALS } from "../../../shared/types/consumer-meals";
const matches = [
  { id: "east-village", match: "yes", reason: "Served hot." },
  { id: "lower-east-side", match: "yes", reason: "Served hot." },
  { id: "union-square", match: "no", reason: "Served cold." },
];
function mockApi(failed = false) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    if (String(url).endsWith("/catalog"))
      return {
        ok: true,
        json: async () => ({ data: CONSUMER_MEALS }),
      } as Response;
    if (String(url).endsWith("/directory"))
      return { ok: true, json: async () => ({ data: [] }) } as Response;
    return {
      ok: !failed,
      json: async () =>
        failed
          ? { message: "Smart search is unavailable." }
          : { data: { mode: "gemini", matches } },
    } as Response;
  });
}
describe("meal preferences", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("applies matches and clears the preference filter", async () => {
    mockApi();
    render(
      <MemoryRouter>
        <Consumer />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Union Square Shared Table" });
    fireEvent.change(
      screen.getByLabelText("Any other preferences or dietary restrictions?"),
      { target: { value: "cant eat cold fooood" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Find meals for my preferences" }),
    );
    await screen.findByText(/Gemini preferences applied/);
    expect(
      screen.queryByRole("heading", { name: "Union Square Shared Table" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "East Village Community Table" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear preferences" }));
    expect(
      screen.getByRole("heading", { name: "Union Square Shared Table" }),
    ).toBeInTheDocument();
  });
  it("shows provider failure without claiming preferences were applied", async () => {
    mockApi(true);
    render(
      <MemoryRouter>
        <Consumer />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Union Square Shared Table" });
    fireEvent.change(
      screen.getByLabelText("Any other preferences or dietary restrictions?"),
      { target: { value: "no cold food" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Find meals for my preferences" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "your note has not been applied",
      ),
    );
    expect(
      screen.getByRole("heading", { name: "Union Square Shared Table" }),
    ).toBeInTheDocument();
  });
});
