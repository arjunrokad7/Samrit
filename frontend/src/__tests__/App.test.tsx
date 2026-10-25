import { render, screen, within } from "@testing-library/react";
import App from "../App";
vi.mock("../samrit/Workspace", () => ({ default: () => <div>Workspace</div> }));
describe("Samrit routes", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });
  it("offers public registration only for donors and centers", () => {
    window.history.replaceState({}, "", "/register");
    render(<App />);
    expect(
      screen.getByRole("option", { name: "Event organizer / donor" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Distribution center" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /driver|volunteer/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
  it("renders the Samrit landing page and consumer entry point", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /Good food/ }),
    ).toBeInTheDocument();
    const hero = within(screen.getByRole("region", { name: /Good food/ }));
    expect(hero.getByRole("link", { name: /Find a meal/ })).toHaveAttribute(
      "href",
      "/consumer",
    );
    expect(
      hero.getByRole("link", { name: /Be a part of the solution/ }),
    ).toHaveAttribute("href", "/register");
    expect(
      hero.getByRole("link", { name: "Terms and Conditions" }),
    ).toHaveAttribute("href", "/terms");
    expect(
      screen.getByRole("navigation", { name: "Footer links" }),
    ).toBeInTheDocument();
  });
  it("renders the consumer concept without public quality ratings", () => {
    window.history.replaceState({}, "", "/consumer");
    render(<App />);
    expect(screen.getByText(/NO LIVE AVAILABILITY/)).toBeInTheDocument();

    expect(screen.queryByText(/star rating/i)).not.toBeInTheDocument();
    expect(screen.getByText(/By using our site/)).toBeInTheDocument();
  });
  it.each([
    ["/terms", "Terms and Conditions"],
    ["/regulations", "Food Donation Regulations"],
  ])("opens public legal route %s", (path, title) => {
    window.history.replaceState({}, "", path);
    render(<App />);
    expect(
      screen.getByRole("heading", { name: title, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Find a meal/ })[0],
    ).toHaveAttribute("href", "/consumer");
    if (path === "/regulations")
      expect(
        screen.getByRole("link", { name: /Read NY Agriculture/ }),
      ).toHaveAttribute(
        "href",
        "https://www.nysenate.gov/legislation/laws/AGM/71-Z",
      );
  });
});
