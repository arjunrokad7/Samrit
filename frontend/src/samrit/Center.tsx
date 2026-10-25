import { Sheet } from "./Sheet";
import { ui } from "./design";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, CheckCircle2, LocateFixed } from "lucide-react";
import { request, gps, errorMessage, REGION } from "./api";
import type { Overview, CenterProfile } from "./api";
import { BatchCard, Empty, PhotoField, QR, ScanField } from "./components";
export function CenterProfileForm({
  data,
  refresh,
}: {
  data: Overview;
  refresh: () => Promise<void>;
}) {
  const center = data.centers[0];
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState({
    lat: center?.location.lat ?? REGION.lat,
    lng: center?.location.lng ?? REGION.lng,
  });
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await request("/api/centers/profile", "PUT", {
        name: form.get("name"),
        location: { ...coords, address: form.get("address") },
        timeZone: String(form.get("timeZone")),
        capabilities: {
          refrigeration: form.has("refrigeration"),
          hotHolding: form.has("hotHolding"),
          freezer: form.has("freezer"),
          maxMealCapacity: Number(form.get("capacity")),
        },
        operatingHours: { open: form.get("open"), close: form.get("close") },
        seating: Number(form.get("seating")),
        staffing: Number(form.get("staffing")),
      });
      await refresh();
      toast.success("Facility profile saved.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={ui("sr-two-col")}>
      <section className={ui("sr-panel")}>
        <span className={ui("sr-eyebrow")}>A PLACE AT THE TABLE</span>
        <h2>Your center, in detail.</h2>

        <form onSubmit={save}>
          <label>
            Center name
            <input
              name="name"
              defaultValue={center?.name || ""}
              required
              placeholder="East Village Community Kitchen"
            />
          </label>
          <label>
            Street address
            <input
              name="address"
              required
              defaultValue={center?.location.address || ""}
              placeholder="100 Demo Community Avenue, New York, NY 10003"
            />
          </label>
          <div className={ui("sr-form-grid")}>
            <label>
              Latitude
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={coords.lat}
                onChange={(e) =>
                  setCoords({ ...coords, lat: Number(e.target.value) })
                }
                required
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={coords.lng}
                onChange={(e) =>
                  setCoords({ ...coords, lng: Number(e.target.value) })
                }
                required
              />
            </label>
          </div>
          <button
            type="button"
            className={ui("sr-text-link")}
            onClick={async () => {
              try {
                setCoords(await gps());
              } catch (error) {
                toast.error(errorMessage(error));
              }
            }}
          >
            <LocateFixed size={15} />
            Use current device location
          </button>
          <div className={ui("sr-divider")} />
          <h3>Equipment & capacity</h3>
          <div className={ui("sr-equipment")}>
            {[
              ["refrigeration", "Refrigeration"],
              ["hotHolding", "Hot holding"],
              ["freezer", "Freezer"],
            ].map(([key, label]) => (
              <label className={ui("sr-checkbox")} key={key}>
                <input
                  name={key}
                  type="checkbox"
                  defaultChecked={
                    center?.capabilities[
                      key as keyof CenterProfile["capabilities"]
                    ] === true
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div className={ui("sr-form-grid")}>
            <label>
              Maximum servings per intake cycle
              <input
                name="capacity"
                type="number"
                required
                min="1"
                max="10000"
                defaultValue={center?.capabilities.maxMealCapacity || 200}
              />
            </label>
            <label>
              Seats
              <input
                name="seating"
                type="number"
                min="0"
                max="10000"
                required
                defaultValue={center?.seating || 40}
              />
            </label>
            <label>
              Staff on duty
              <input
                name="staffing"
                type="number"
                min="1"
                max="1000"
                required
                defaultValue={center?.staffing || 4}
              />
            </label>
            <label>
              Time zone
              <select
                name="timeZone"
                defaultValue={center?.timeZone || REGION.timeZone}
              >
                <option>America/New_York</option>
                <option>America/Chicago</option>
                <option>America/Denver</option>
                <option>America/Los_Angeles</option>
                <option>America/Phoenix</option>
                <option>Pacific/Honolulu</option>
                <option>America/Anchorage</option>
              </select>
            </label>
            <label>
              Opens
              <input
                name="open"
                type="time"
                required
                defaultValue={center?.operatingHours.open || "07:00"}
              />
            </label>
            <label>
              Closes
              <input
                name="close"
                type="time"
                required
                defaultValue={center?.operatingHours.close || "22:00"}
              />
            </label>
          </div>
          <button className={ui("sr-button")} disabled={busy}>
            <Building2 size={17} />
            {busy ? "Saving…" : "Save center profile"}
          </button>
        </form>
      </section>
      <aside className={ui("sr-panel sr-fit")}>
        <span className={ui("sr-eyebrow")}>YOUR FRONT DOOR</span>
        <h3>Venue check-in QR</h3>
        {center ? (
          <>
            <QR value={center.locationQrCode} label={center.name} />
            <div className={ui("sr-callout")}>
              <CheckCircle2 />
              {center.approved
                ? "Approved for matching"
                : "Awaiting central NGO approval"}
            </div>
          </>
        ) : (
          <Empty>
            Save your center profile to receive a permanent location QR.
          </Empty>
        )}
      </aside>
    </div>
  );
}
function IntakeCard({
  batch,
  refresh,
}: {
  batch: Overview["batches"][number];
  refresh: () => Promise<void>;
}) {
  const [sticker, setSticker] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function receive() {
    if (!photo || !sticker)
      return toast.error(
        "Scan the container sticker and take an arrival photo.",
      );
    setBusy(true);
    try {
      const coords = await gps();
      const form = new FormData();
      form.append("image", photo);
      form.append("stage", "3");
      form.append("lat", String(coords.lat));
      form.append("lng", String(coords.lng));
      form.append("sticker", sticker);
      await request(`/api/batches/${batch.batchId}/photo`, "PUT", form);
      await refresh();
      toast.success("Arrival verified. The full custody record is complete.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <BatchCard batch={batch}>
      <ScanField
        value={sticker}
        onChange={setSticker}
        label="Container tracking sticker"
      />
      <PhotoField
        onChange={setPhoto}
        label="Stage 3 · Arrival verification photo"
      />
      <button className={ui("sr-button")} disabled={busy} onClick={receive}>
        {busy ? "Verifying…" : "Confirm receipt with GPS"}
        <CheckCircle2 size={17} />
      </button>
    </BatchCard>
  );
}
export function CenterIntake({
  data,
  refresh,
}: {
  data: Overview;
  refresh: () => Promise<void>;
}) {
  const incoming = data.batches.filter(
    (batch) => batch.status === "in_transit",
  );
  const delivered = data.batches.filter(
    (batch) => batch.status === "delivered",
  );
  const [batchId, setBatchId] = useState(delivered[0]?.batchId || "");
  const [busy, setBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  async function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const batch = delivered.find((batch) => batch.batchId === batchId);
    if (!batch) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request("/api/reviews/process", "POST", {
        targetType: form.get("target"),
        targetId:
          form.get("target") === "donor" ? batch.donorId : batch.centerId,
        linkedBatchId: batchId,
        sentiment: form.get("sentiment"),
        rawText: form.get("text"),
      });
      toast.success("Review sent privately to the central NGO.");
      setReviewOpen(false);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={ui("sr-two-col")}>
      <section>
        <div className={ui("sr-panel-heading")}>
          <h2>Incoming food</h2>
          <span className={ui("sr-status in_transit")}>
            {incoming.length} in transit
          </span>
        </div>
        <div className={ui("sr-stack")}>
          {incoming.length ? (
            incoming.map((batch) => (
              <IntakeCard key={batch.batchId} batch={batch} refresh={refresh} />
            ))
          ) : (
            <Empty>
              In-transit batches assigned to your center will appear here.
            </Empty>
          )}
        </div>
      </section>
      <aside className={ui("sr-panel sr-fit")}>
        <span className={ui("sr-eyebrow")}>PRIVATE QUALITY FEEDBACK</span>
        <h3>How was the handoff?</h3>
        <p className="text-xs text-slate-600">Private to the central NGO.</p>
        {delivered.length ? (
          <>
            <button
              type="button"
              className={ui("sr-button")}
              onClick={() => setReviewOpen(true)}
            >
              Leave private feedback
            </button>
            {reviewOpen && (
              <Sheet
                title="Private handoff feedback"
                onClose={() => setReviewOpen(false)}
              >
                <form onSubmit={review}>
                  <label>
                    Delivered batch
                    <select
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                    >
                      {delivered.map((batch) => (
                        <option key={batch.batchId} value={batch.batchId}>
                          {batch.items.map((item) => item.name).join(", ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    About
                    <select name="target">
                      <option value="donor">Food / donor</option>
                      <option value="center">Venue / center</option>
                    </select>
                  </label>
                  <label>
                    Experience
                    <select name="sentiment">
                      <option value="positive">Positive</option>
                      <option value="negative">Needs attention</option>
                    </select>
                  </label>
                  <label>
                    What should the NGO know?
                    <textarea
                      name="text"
                      required
                      minLength={3}
                      maxLength={3000}
                      placeholder="Food condition, packaging, temperature, or venue concerns…"
                    />
                  </label>
                  <button className={ui("sr-button")} disabled={busy}>
                    {busy ? "Sending…" : "Send private review"}
                  </button>
                </form>
              </Sheet>
            )}
          </>
        ) : (
          <p>No completed deliveries to review.</p>
        )}
      </aside>
    </div>
  );
}
