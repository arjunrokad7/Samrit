import { ui } from "./design";
import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  LocateFixed,
} from "lucide-react";
import { toast } from "sonner";
import {
  ALLERGENS,
  request,
  gps,
  errorMessage,
  REGION,
  localDate,
  localInputToISO,
  handlingLabel,
} from "./api";
import type { Overview, MenuItem, Handling } from "./api";
import { Empty, PhotoField, QR } from "./components";
type Draft = Omit<MenuItem, "verified" | "handlingRequirement"> & {
  handlingRequirement: Handling | "";
  verified: boolean;
};
const newItem = (): Draft => ({
  name: "",
  ingredients: [],
  allergens: [],
  estimatedServings: 20,
  handlingRequirement: "",
  verified: false,
});
function localInput(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: REGION.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(date)
    .replace(" ", "T");
}
export default function Donor({
  data,
  refresh,
  triage = false,
}: {
  data: Overview;
  refresh: () => Promise<void>;
  triage?: boolean;
}) {
  const [items, setItems] = useState<Draft[]>([newItem()]);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("menu");
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [source, setSource] = useState("Manual entry");
  const [coords, setCoords] = useState({ lat: REGION.lat, lng: REGION.lng });
  const [eventId, setEventId] = useState(data.events[0]?.eventId || "");
  const [leftovers, setLeftovers] = useState<Record<number, number>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [handling, setHandling] = useState<Handling>("hot");
  const [expires, setExpires] = useState(() =>
    localInput(new Date(Date.now() + 4 * 3600000)),
  );
  const event = data.events.find((item) => item.eventId === eventId);
  const edit = (index: number, patch: Partial<Draft>) =>
    setItems((current) =>
      current.map((item, row) =>
        row === index ? { ...item, ...patch } : item,
      ),
    );
  async function extract() {
    if (!menu) return toast.error("Choose a menu image first.");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("image", menu);
      form.append("documentType", documentType);
      const result = await request<{
        documentId: string;
        items: Draft[];
        mode: string;
        message?: string;
      }>("/api/event-documents", "POST", form);
      setDocumentIds((current) => [...current, result.documentId]);
      if (!result.items.length) {
        toast.info(result.message || "Enter dishes manually.");
        return;
      }
      setItems(result.items.map((item) => ({ ...item, verified: false })));
      setSource("AI extracted · verify every ingredient and allergen");
      toast.success("Menu extracted. Please verify every dish.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function saveEvent(submit: React.FormEvent<HTMLFormElement>) {
    submit.preventDefault();
    if (
      items.some(
        (item) =>
          !item.verified ||
          !item.name.trim() ||
          !item.handlingRequirement ||
          item.estimatedServings < 1,
      )
    )
      return toast.error(
        "Verify every dish, its ingredients, and its allergens first.",
      );
    setBusy(true);
    const formElement=submit.currentTarget;
    const form = new FormData(formElement);
    try {
      await request("/api/events", "POST", {
        name: form.get("name"),
        scheduledAt: localInputToISO(String(form.get("scheduledAt"))),
        location: { ...coords, address: form.get("address") },
        items,
        documentIds,
        notes: form.get("notes"),
      });
      await refresh();
      toast.success("Event and verified menu saved.");
      setDocumentIds([]);setItems([newItem()]);setMenu(null);setSource("Manual entry");formElement.reset();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function createBatch() {
    if (!event || !photo)
      return toast.error("Choose an event and take a stage 1 food photo.");
    const selected = event.items.flatMap((item, index) =>
      (leftovers[index] || 0) > 0
        ? [{ ...item, estimatedServings: leftovers[index] }]
        : [],
    );
    if (!selected.length)
      return toast.error("Select at least one leftover dish.");
    if (selected.some((item) => item.handlingRequirement !== handling))
      return toast.error(
        "Create separate batches for different handling requirements.",
      );
    setBusy(true);
    try {
      const location = await gps();
      const upload = new FormData();
      upload.append("image", photo);
      upload.append("stage", "1");
      upload.append("lat", String(location.lat));
      upload.append("lng", String(location.lng));
      const evidence = await request<{
        photoId: string;
      }>("/api/photos", "POST", upload);
      await request("/api/batches", "POST", {
        donorEventId: event.eventId,
        items: selected,
        handlingRequirement: handling,
        expiresAt: localInputToISO(expires),
        photoId: evidence.photoId,
      });
      await refresh();
      setLeftovers({});
      toast.success(
        "Batch created with GPS and donor photo. Dispatch can now match it.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (triage)
    return (
      <div className={ui("sr-two-col")}>
        <section className={ui("sr-panel")}>
          <span className={ui("sr-eyebrow")}>AFTER THE EVENT</span>
          <h2>Give leftovers a destination.</h2>
          <p>
            Choose what remains. Keep different handling requirements in
            separate batches.
          </p>
          <label>
            Saved event
            <select
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setLeftovers({});
              }}
            >
              <option value="">Choose an event</option>
              {data.events.map((event) => (
                <option value={event.eventId} key={event.eventId}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
          {event ? (
            <>
              <div className={ui("sr-triage-list")}>
                {event.items.map((item, index) => (
                  <div className={ui("sr-triage-item")} key={index}>
                    <label className={ui("sr-checkbox")}>
                      <input
                        type="checkbox"
                        checked={!!leftovers[index]}
                        onChange={(e) =>
                          setLeftovers({
                            ...leftovers,
                            [index]: e.target.checked
                              ? item.estimatedServings
                              : 0,
                          })
                        }
                      />
                      <span>
                        <strong>{item.name}</strong>
                        <small>
                          {handlingLabel(item.handlingRequirement)} ·{" "}
                          {item.allergens.length
                            ? `Contains ${item.allergens.join(", ")}`
                            : "No major allergens declared; confirm ingredients"}
                        </small>
                      </span>
                    </label>
                    <label className={ui("sr-servings")}>
                      Servings
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        disabled={!leftovers[index]}
                        value={leftovers[index] || ""}
                        onChange={(e) =>
                          setLeftovers({
                            ...leftovers,
                            [index]: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className={ui("sr-form-grid")}>
                <label>
                  Batch handling
                  <select
                    value={handling}
                    onChange={(e) => setHandling(e.target.value as Handling)}
                  >
                    {["hot", "refrigerated", "frozen", "shelf_stable"].map(
                      (value) => (
                        <option value={value} key={value}>
                          {handlingLabel(value)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Use by · Eastern
                  <input
                    type="datetime-local"
                    value={expires}
                    onChange={(e) => setExpires(e.target.value)}
                    required
                  />
                </label>
              </div>
              <PhotoField
                onChange={setPhoto}
                label="Stage 1 · Donor food photo"
              />
              <div className={ui("sr-note")}>
                <LocateFixed size={17} />
                Your current device GPS will be recorded. Be at the event
                location to submit.
              </div>
              <button
                className={ui("sr-button")}
                disabled={busy}
                onClick={createBatch}
              >
                {busy ? "Recording custody…" : "Create rescue batch"}
                <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <Empty>
              Save an event and verified menu in Event planning first.
            </Empty>
          )}
        </section>
        <aside className={ui("sr-panel sr-fit")}>
          <span className={ui("sr-eyebrow")}>THE FIRST HANDOFF</span>
          <h3>Ready for your driver.</h3>
          <p>
            Display this event QR at the pickup point. Your assigned driver
            scans it before photographing the food.
          </p>
          {event && (
            <>
              <QR value={`SAMRIT:EVENT:${event.eventId}`} label={event.name} />
              <p>{event.location.address}</p>
              <small>{localDate(event.scheduledAt)}</small>
            </>
          )}
          <div className={ui("sr-callout")}>
            <CheckCircle2 />
            Allergen verification stays with the batch throughout its journey.
          </div>
        </aside>
      </div>
    );
  return (
    <div className={ui("sr-stack")}>
      <div className={ui("sr-two-col")}>
        <section className={ui("sr-panel")}>
          <span className={ui("sr-eyebrow")}>BEFORE THE EVENT</span>
          <h2>Good planning. Less waste.</h2>
          <p>
            Upload a catering menu or enter it manually. A person verifies the
            final ingredients, allergens, and handling.
          </p>
          <label>
            Document type
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="menu">Menu</option>
              <option value="invoice">Invoice</option>
            </select>
          </label>
          <p className="text-xs">
            Images and PDFs up to 5 MB are stored privately and sent to Gemini.
            Confirm what was actually served; invoice ingredients alone do not
            confirm a dish.
          </p>
          <div className={ui("sr-menu-upload")}>
            <Camera />
            <input
              aria-label="Catering menu image"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setMenu(e.target.files?.[0] || null)}
            />
            <button
              className={ui("sr-button sr-secondary")}
              type="button"
              onClick={extract}
              disabled={busy || !data.config.aiConfigured}
            >
              {busy ? "Reading menu…" : "Extract menu with AI"}
            </button>
          </div>
          {!data.config.aiConfigured && (
            <div className={ui("sr-note")}>
              AI vision awaits provider configuration. Manual menu entry is
              ready below.
            </div>
          )}
          <form onSubmit={saveEvent}>
            <div className={ui("sr-form-grid")}>
              <label>
                Event name
                <input name="name" required placeholder="Midtown team lunch" />
              </label>
              <label>
                Event time · Eastern
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  required
                  defaultValue={localInput(new Date())}
                />
              </label>
            </div>
            <label>
              Pickup address
              <input
                name="address"
                required
                defaultValue="100 Demo Market Street, New York, NY 10003"
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
                />
              </label>
            </div>
            <button
              className={ui("sr-text-link")}
              type="button"
              onClick={async () => {
                try {
                  setCoords(await gps());
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }}
            >
              <LocateFixed size={15} />
              Use my current location
            </button>
            <div className={ui("sr-divider")} />
            <div className={ui("sr-panel-heading")}>
              <h3>Verify your menu</h3>
              <span className={ui("sr-muted")}>{source}</span>
            </div>
            {items.map((item, index) => (
              <div className={ui("sr-menu-item")} key={index}>
                <div className={ui("sr-input-action")}>
                  <label>
                    Dish name
                    <input
                      required
                      value={item.name}
                      placeholder="Roasted vegetable pasta"
                      onChange={(e) =>
                        edit(index, {
                          name: e.target.value,

                          verified: false,
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className={ui("sr-icon-button")}
                    aria-label="Remove dish"
                    onClick={() =>
                      setItems(items.filter((_, row) => row !== index))
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <label>
                  Miscellaneous food notes
                  <input
                    value={String(item.metadata?.notes || "")}
                    maxLength={2000}
                    placeholder="Packaging, portion details or other notes"
                    onChange={(e) =>
                      edit(index, {
                        metadata: { notes: e.target.value },
                        verified: false,
                      })
                    }
                  />
                </label>
                <label>
                  Ingredients · comma separated
                  <input
                    value={item.ingredients.join(", ")}
                    onChange={(e) =>
                      edit(index, {
                        ingredients: e.target.value
                          .split(",")
                          .map((value) => value.trim()),
                        verified: false,
                      })
                    }
                    placeholder="Pasta, tomatoes, olive oil"
                  />
                </label>
                <div className={ui("sr-form-grid")}>
                  <label>
                    Estimated servings
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={item.estimatedServings}
                      onChange={(e) =>
                        edit(index, {
                          estimatedServings: Number(e.target.value),
                          verified: false,
                        })
                      }
                    />
                  </label>
                  <label>
                    Handling · confirm suggestion
                    <select
                      required
                      value={item.handlingRequirement}
                      onChange={(e) =>
                        edit(index, {
                          handlingRequirement: e.target.value as Handling,
                          verified: false,
                        })
                      }
                    >
                      <option value="">Select handling</option>
                      {["hot", "refrigerated", "frozen", "shelf_stable"].map(
                        (value) => (
                          <option key={value} value={value}>
                            {handlingLabel(value)}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
                <span className={ui("sr-field-label")}>
                  Major US allergens · select all that apply
                </span>
                <div className={ui("sr-allergen-checks")}>
                  {ALLERGENS.map((allergen) => (
                    <label key={allergen}>
                      <input
                        type="checkbox"
                        checked={item.allergens.includes(allergen)}
                        onChange={(e) =>
                          edit(index, {
                            allergens: e.target.checked
                              ? [...item.allergens, allergen]
                              : item.allergens.filter(
                                  (value) => value !== allergen,
                                ),
                            verified: false,
                          })
                        }
                      />
                      {allergen}
                    </label>
                  ))}
                </div>
                <label className={ui("sr-checkbox sr-confirm")}>
                  <input
                    type="checkbox"
                    checked={item.verified}
                    onChange={(e) =>
                      edit(index, { verified: e.target.checked })
                    }
                  />
                  I confirm this dish was provided and checked its ingredients, allergens, servings, and
                  handling.
                </label>
              </div>
            ))}
            <button
              className={ui("sr-text-link")}
              type="button"
              onClick={() => setItems([...items, newItem()])}
            >
              <Plus size={16} />
              Add another dish
            </button>
            <label>
              Pickup notes
              <textarea
                name="notes"
                placeholder="Loading entrance, access instructions, packaging details…"
              />
            </label>
            <button
              className={ui("sr-button")}
              disabled={busy || !items.length}
            >
              {busy ? "Saving…" : "Save verified event"}
              <CheckCircle2 size={17} />
            </button>
          </form>
        </section>
        <aside className={ui("sr-panel sr-fit")}>
          <span className={ui("sr-eyebrow")}>ON YOUR CALENDAR</span>
          <h3>Saved events</h3>
          {data.events.length ? (
            data.events.map((event) => (
              <div className={ui("sr-event-summary")} key={event.eventId}>
                <h4>{event.name}</h4>
                <p>{localDate(event.scheduledAt)}</p>
                <small>
                  {event.items.length} verified dishes ·{" "}
                  {event.location.address}
                </small>
                <QR
                  value={`SAMRIT:EVENT:${event.eventId}`}
                  label="Event pickup QR"
                />
              </div>
            ))
          ) : (
            <Empty>
              Your events will appear here, ready for leftover triage.
            </Empty>
          )}
        </aside>
      </div>
    </div>
  );
}
