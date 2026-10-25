import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Donor from "../samrit/Donor";
import { request, type Overview } from "../samrit/api";
vi.mock("../samrit/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../samrit/api")>()),
  request: vi.fn(),
  gps: vi.fn().mockResolvedValue({ lat: 40.73, lng: -73.98 }),
}));
vi.mock("../samrit/components", () => ({
  Empty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  QR: () => <div>QR</div>,
  PhotoField: ({ onChange }: { onChange: (file: File | null) => void }) => (
    <input
      type="file"
      aria-label="Test food photo"
      onChange={(e) => onChange(e.target.files?.[0] || null)}
    />
  ),
}));
const data = {
  config: {
    city: "New York City",
    timeZone: "America/New_York",
    aiConfigured: true,
  },
  events: [
    {
      eventId: "event",
      donorId: "donor",
      name: "Mixed menu event",
      scheduledAt: "2026-01-01T12:00:00Z",
      location: { lat: 40.73, lng: -73.98, address: "Test NYC" },
      items: [
        {
          name: "Hot soup",
          ingredients: [],
          allergens: [],
          estimatedServings: 30,
          handlingRequirement: "hot",
          verified: true,
        },
        {
          name: "Cold salad",
          ingredients: [],
          allergens: [],
          estimatedServings: 20,
          handlingRequirement: "refrigerated",
          verified: true,
        },
        {
          name: "Frozen fruit",
          ingredients: [],
          allergens: [],
          estimatedServings: 10,
          handlingRequirement: "frozen",
          verified: true,
        },
      ],
    },
  ],
  batches: [],
  centers: [],
  routes: [],
  reviews: [],
  scans: [],
  drivers: [],
  vehicles: [],
} as unknown as Overview;
describe("donor leftover selection", () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
  });
  it("keeps a dish checked and editable while its servings are blank or zero", () => {
    render(<Donor triage data={data} refresh={vi.fn()} />);
    const dish = screen.getByRole("checkbox", { name: /Hot soup/ });
    fireEvent.click(dish);
    const servings = screen.getByLabelText("Servings for Hot soup");
    fireEvent.change(servings, { target: { value: "" } });
    expect(dish).toBeChecked();
    expect(servings).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Create rescue batch" }),
    ).toBeDisabled();
    fireEvent.change(servings, { target: { value: "0" } });
    expect(dish).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Create rescue batch" }),
    ).toBeDisabled();
    fireEvent.change(servings, { target: { value: "5" } });
    expect(
      screen.getByRole("button", { name: "Create rescue batch" }),
    ).toBeEnabled();
    fireEvent.click(dish);
    expect(servings).toBeDisabled();
  });
  it("creates a mixed batch with every selected dish and handling requirement", async () => {
    vi.mocked(request).mockImplementation(
      async (path) =>
        (path === "/api/photos" ? { photoId: "photo" } : {}) as never,
    );
    const refresh = vi.fn().mockResolvedValue(undefined);
    render(<Donor triage data={data} refresh={refresh} />);
    for (const name of ["Hot soup", "Cold salad", "Frozen fruit"])
      fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(name) }));
    fireEvent.change(screen.getByLabelText("Test food photo"), {
      target: {
        files: [new File(["image"], "food.png", { type: "image/png" })],
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create rescue batch" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        "/api/batches",
        "POST",
        expect.objectContaining({
          handlingRequirements: ["hot", "refrigerated", "frozen"],
          items: expect.arrayContaining([
            expect.objectContaining({
              name: "Cold salad",
              estimatedServings: 20,
            }),
          ]),
        }),
      ),
    );
    expect(refresh).toHaveBeenCalled();
  });
});
