import { ui } from "./design";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  ArrowUpRight,
  AlertTriangle,
  Navigation,
  Truck,
} from "lucide-react";
import {
  request,
  errorMessage,
  portionCount,
  localDate,
  handlingLabel,
} from "./api";
import type { Overview } from "./api";
import { Empty, NetworkMap, Tag } from "./components";
export function Dispatch({
  data,
  refresh,
}: {
  data: Overview;
  refresh: () => Promise<void>;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  const [busy, setBusy] = useState("");
  const [driver, setDriver] = useState("");
  const [reason, setReason] = useState("");
  const pending = data.batches
    .filter((batch) => batch.status === "pending")
    .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
  async function match(batchId: string) {
    setBusy(batchId);
    try {
      await request("/api/logistics/match", "POST", {
        batchId,
        ...(driver ? { driverId: driver } : {}),
      });
      await refresh();
      toast.success("Center and driver matched. Route is ready.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy("");
    }
  }
  async function reject(batchId: string) {
    if (reason.trim().length < 5)
      return toast.error(
        "Enter a quality hold reason of at least 5 characters.",
      );
    setBusy(batchId);
    try {
      await request(`/api/batches/${batchId}/reject`, "PATCH", { reason });
      await refresh();
      toast.success("Batch rejected. Any active route was cancelled.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className={ui("sr-stack")}>
      <div className={ui("sr-two-col")}>
        <section className={ui("sr-panel")}>
          <div className={ui("sr-panel-heading")}>
            <div>
              <span className={ui("sr-eyebrow")}>THE NEXT GOOD HANDOFF</span>
              <h2>Dispatch queue</h2>
            </div>
            <span className={ui("sr-status pending")}>
              {pending.length} waiting
            </span>
          </div>
          <p>
            Earliest expiry first. Matching checks open hours, equipment,
            available capacity, and a driver's current assignment.
          </p>
          <label>
            Driver assignment
            <select
              value={driver}
              onChange={(event) => setDriver(event.target.value)}
            >
              <option value="">Nearest available driver</option>
              {data.drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                  {driver.isAvailable ? " · available" : " · offline"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quality hold reason ? required to reject
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe the concern for the audit record"
            />
          </label>
          {pending.length ? (
            <div className={ui("sr-queue")}>
              {pending.map((batch) => (
                <div className={ui("sr-queue-row")} key={batch.batchId}>
                  <span className={ui("sr-queue-icon")}>
                    <Navigation size={20} />
                  </span>
                  <div>
                    <h4>{batch.items.map((item) => item.name).join(", ")}</h4>
                    <p>
                      {portionCount(batch)} servings ·{" "}
                      {handlingLabel(batch.handlingRequirement)}
                    </p>
                    <small>Use by {localDate(batch.expiresAt)}</small>
                  </div>
                  <button
                    className={ui("sr-button sr-small")}
                    disabled={!!busy || Date.parse(batch.expiresAt) <= now}
                    onClick={() => match(batch.batchId)}
                  >
                    {busy === batch.batchId
                      ? "Matching…"
                      : Date.parse(batch.expiresAt) <= now
                        ? "Expired"
                        : "Match route"}
                    <ArrowUpRight size={16} />
                  </button>
                  <button
                    className={ui("sr-text-link")}
                    disabled={!!busy}
                    onClick={() => reject(batch.batchId)}
                  >
                    Reject / hold
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Empty>New donor batches will appear here for matching.</Empty>
          )}
        </section>
        <aside className={ui("sr-panel sr-fit")}>
          <div className={ui("sr-panel-heading")}>
            <h3>Recovery network</h3>
            <span className={ui("sr-status delivered")}>NYC</span>
          </div>
          <NetworkMap
            batches={data.batches}
            centers={data.centers}
            routes={data.routes}
          />
          <div className={ui("sr-map-legend")}>
            <span>● Centers</span>
            <span>● Pickups</span>
            <span>┄ Active routes</span>
          </div>
          <small className={ui("sr-muted")}>
            Routes show straight-line connections. Travel estimates use an
            assumed city speed.
          </small>
        </aside>
      </div>
      <section className={ui("sr-panel")}>
        <div className={ui("sr-panel-heading")}>
          <h3>Dispatch routes</h3>
          <Truck size={20} />
        </div>
        {data.routes.length ? (
          <div className={ui("sr-table-wrap")}>
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Destination</th>
                  <th>Distance</th>
                  <th>Status</th>
                  <th>Quality hold</th>
                </tr>
              </thead>
              <tbody>
                {data.routes.map((route) => (
                  <tr key={route.routeId}>
                    <td>{route.routeId.slice(0, 8)}</td>
                    <td>
                      {data.drivers.find(
                        (driver) => driver.id === route.driverId,
                      )?.name || route.driverId.slice(0, 8)}
                    </td>
                    <td>
                      {
                        data.centers.find(
                          (center) => center.centerId === route.centerId,
                        )?.name
                      }
                    </td>
                    <td>
                      {route.distanceMiles} mi · ~{route.estimatedMinutes} min
                    </td>
                    <td>
                      <Tag value={route.status} />
                    </td>
                    <td>
                      {route.status === "active" && (
                        <button
                          className={ui("sr-text-link")}
                          disabled={!!busy}
                          onClick={() => reject(route.assignedBatches[0])}
                        >
                          Reject batch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Matched batches create a driver route.</Empty>
        )}
      </section>
    </div>
  );
}
export function Centers({
  data,
  refresh,
}: {
  data: Overview;
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState("");
  async function approve(id: string) {
    setBusy(id);
    try {
      await request(`/api/centers/${id}/approve`, "PATCH");
      await refresh();
      toast.success("Center approved for matching.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className={ui("sr-card-grid")}>
      {data.centers.length ? (
        data.centers.map((center) => (
          <article className={ui("sr-panel")} key={center.centerId}>
            <div className={ui("sr-panel-heading")}>
              <h3>{center.name}</h3>
              <Tag value={center.approved ? "approved" : "pending"} />
            </div>
            <p>{center.location.address}</p>
            <div className={ui("sr-equipment")}>
              {center.capabilities.refrigeration && <span>Refrigeration</span>}
              {center.capabilities.hotHolding && <span>Hot holding</span>}
              {center.capabilities.freezer && <span>Freezer</span>}
            </div>
            <p>
              {center.capabilities.maxMealCapacity} servings · {center.seating}{" "}
              seats · {center.staffing} staff
            </p>
            <small>
              {center.operatingHours.open}–{center.operatingHours.close} ·{" "}
              {center.timeZone}
            </small>
            {!center.approved && (
              <button
                className={ui("sr-button")}
                disabled={!!busy}
                onClick={() => approve(center.centerId)}
              >
                <ShieldCheck size={17} />
                Approve facility
              </button>
            )}
          </article>
        ))
      ) : (
        <Empty>
          Registered distribution centers will appear here for approval.
        </Empty>
      )}
    </div>
  );
}
export function Moderation({ data }: { data: Overview }) {
  return (
    <div className={ui("sr-stack")}>
      <div className={ui("sr-callout")}>
        <ShieldCheck />
        <div>
          <strong>Central NGO · restricted quality records</strong>
          <small>
            Reviews and quality flags are never returned to other roles or
            displayed on public center profiles.
          </small>
        </div>
      </div>
      {data.reviews.length ? (
        data.reviews.map((review) => (
          <article className={ui("sr-panel")} key={review.reviewId}>
            <div className={ui("sr-panel-heading")}>
              <div>
                <span className={ui("sr-eyebrow")}>
                  {review.targetType.toUpperCase()} /{" "}
                  {review.targetId.slice(0, 8)}
                </span>
                <h3>
                  {review.sentiment === "negative"
                    ? "Needs a closer look"
                    : "A handoff that worked"}
                </h3>
              </div>
              {review.sentiment === "negative" ? (
                <AlertTriangle className={ui("sr-coral")} />
              ) : (
                <ShieldCheck className={ui("sr-green")} />
              )}
            </div>
            <p>{review.rawText}</p>
            <div className={ui("sr-allergens")}>
              {review.aiParsedFlags.map((flag) => (
                <span key={flag}>{flag.replaceAll("_", " ")}</span>
              ))}
            </div>
            <small className={ui("sr-muted")}>
              {localDate(review.createdAt)} · Batch{" "}
              {review.linkedBatchId.slice(0, 8)} ·{" "}
              {review.analysisMode === "gemini"
                ? "Gemini classification"
                : review.analysisMode === "qwen"
                  ? "Local Qwen classification"
                  : "Local keyword classification"}
            </small>
          </article>
        ))
      ) : (
        <Empty>Private center reviews will appear here.</Empty>
      )}
    </div>
  );
}
