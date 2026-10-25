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
  batchHandlingLabel,
  batchHandlingRequirements,
} from "./api";
import type { Overview } from "./api";
import { Sheet } from "./Sheet";
import { FleetSummary } from "./Fleet";
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
  const [vehicle, setVehicle] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [cancelId, setCancelId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const activeRoutes = data.routes.filter((route) => route.status === "active");
  const freeDrivers = data.drivers.filter(
    (item) =>
      item.isActive &&
      item.isAvailable &&
      !activeRoutes.some((route) => route.driverId === item.id),
  );
  const freeVehicles = (data.vehicles || []).filter(
    (item) =>
      item.status === "ready" &&
      !activeRoutes.some((route) => route.vehicleId === item.vehicleId),
  );
  const mapRoutes = selectedRoute
    ? activeRoutes.filter((route) => route.routeId === selectedRoute)
    : activeRoutes;
  const mapBatches = selectedRoute
    ? data.batches.filter((batch) =>
        mapRoutes.some((route) =>
          route.assignedBatches.includes(batch.batchId),
        ),
      )
    : data.batches;
  async function cancelRoute() {
    setBusy(cancelId);
    try {
      await request(`/api/logistics/routes/${cancelId}/cancel`, "PATCH", {
        reason: cancelReason,
      });
      await refresh();
      setCancelId("");
      setCancelReason("");
      toast.success("Route cancelled. Driver and vehicle released.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy("");
    }
  }

  const [reason, setReason] = useState("");
  const pending = data.batches
    .filter((batch) => batch.status === "pending")
    .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
  async function match(batchId: string) {
    setBusy(batchId);
    try {
      await request("/api/logistics/match", "POST", {
        batchId,
        driverId: driver,
        vehicleId: vehicle,
      });
      await refresh();
      toast.success("Center, driver and vehicle assigned. Route is ready.");
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
      <FleetSummary data={data} />
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

          <label>
            Driver assignment
            <select
              value={driver}
              onChange={(event) => setDriver(event.target.value)}
            >
              <option value="">Select an available NGO driver</option>
              {freeDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                  {driver.isAvailable ? " · available" : " · offline"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vehicle assignment
            <select
              value={vehicle}
              onChange={(event) => setVehicle(event.target.value)}
            >
              <option value="">Select a ready NGO vehicle</option>
              {freeVehicles.map((item) => (
                <option key={item.vehicleId} value={item.vehicleId}>
                  {item.name} / {item.registration} / {item.capacityServings}{" "}
                  servings / {item.capabilities.map(handlingLabel).join(", ")}
                </option>
              ))}
            </select>
          </label>
          {(!freeDrivers.length || !freeVehicles.length) && null}

          <label>
            Quality hold reason
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
                      {batchHandlingLabel(batch)}
                    </p>
                    <small>Use by {localDate(batch.expiresAt)}</small>
                  </div>
                  <button
                    className={ui("sr-button sr-small")}
                    disabled={
                      !!busy ||
                      Date.parse(batch.expiresAt) <= now ||
                      !freeDrivers.some((item) => item.id === driver) ||
                      !freeVehicles.some(
                        (item) =>
                          item.vehicleId === vehicle &&
                          item.capacityServings >= portionCount(batch) &&
                          batchHandlingRequirements(batch).every((value) =>
                            item.capabilities.includes(value),
                          ),
                      )
                    }
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
          <label>
            Active route on map
            <select
              value={selectedRoute}
              onChange={(event) => setSelectedRoute(event.target.value)}
            >
              <option value="">All active routes</option>
              {activeRoutes.map((route) => (
                <option key={route.routeId} value={route.routeId}>
                  {route.routeId.slice(0, 8)} /{" "}
                  {data.drivers.find((item) => item.id === route.driverId)
                    ?.name || "Driver"}
                </option>
              ))}
            </select>
          </label>
          <NetworkMap
            batches={mapBatches}
            centers={data.centers}
            routes={mapRoutes}
            drivers={
              selectedRoute
                ? data.drivers.filter((item) =>
                    mapRoutes.some((route) => route.driverId === item.id),
                  )
                : data.drivers
            }
          />
          <div className={ui("sr-map-legend")}>
            <span>● Centers</span>
            <span>● Pickups</span>
            <span>┄ Active routes</span>
          </div>
          <small className={ui("sr-muted")}>
            Estimated routes; no live traffic.
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
                  <th>Vehicle</th>
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
                      {route.vehicleSnapshot
                        ? `${route.vehicleSnapshot.name} / ${route.vehicleSnapshot.registration}`
                        : "Historical: vehicle not recorded"}
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
                      <small className="block mt-2 text-[10px] text-slate-500">
                        {
                          route.waypoints.filter(
                            (point) => point.status === "done",
                          ).length
                        }{" "}
                        / {route.waypoints.length} stops done
                      </small>
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
                      {route.status === "active" && (
                        <button
                          className={ui("sr-text-link mt-3")}
                          disabled={!!busy}
                          onClick={() => {
                            setCancelId(route.routeId);
                            setCancelReason("");
                          }}
                        >
                          Cancel before pickup
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
      {cancelId && (
        <Sheet
          title="Cancel route before pickup"
          onClose={() => {
            if (!busy) setCancelId("");
          }}
        >
          <p>Cancel this route and release its uncollected batches?</p>
          <label>
            Cancellation reason
            <input
              minLength={5}
              maxLength={500}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          </label>
          <button
            className={ui("sr-button")}
            disabled={!!busy || cancelReason.trim().length < 5}
            onClick={() => void cancelRoute()}
          >
            Cancel route and release resources
          </button>
        </Sheet>
      )}
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
interface PrivateVisitReview {
  id: string;
  venueName?: string;
  sentiment: string;
  raw_text?: string;
  summary?: string;
  moderation_status: string;
  analysis_mode?: string;
  consistency?: string;
  uncertainties?: string[];
  scans?: {
    locationSource?: string;
    phase: string;
    recordedAt: string;
    method: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracyMeters?: number | null;
  }[];
}
export function Moderation({ data }: { data: Overview }) {
  const [visits, setVisits] = useState<PrivateVisitReview[]>([]);
  const [visitError, setVisitError] = useState("");
  useEffect(() => {
    let active = true;
    request<PrivateVisitReview[]>("/api/admin/visit-reviews")
      .then((rows) => {
        if (active) setVisits(rows);
      })
      .catch(() => {
        if (active) setVisitError("Private visit reviews could not load.");
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className={ui("sr-stack")}>
      <small>Private to the central NGO.</small>
      <section className={ui("sr-panel")}>
        <h3>Private venue visits</h3>
        <p className="text-sm">AI suggestions require human review.</p>
        {visitError && <p role="alert">{visitError}</p>}
        {visits.length ? (
          visits.map((v) => (
            <article className="my-4 border-t border-slate-200 pt-4" key={v.id}>
              <h4>{v.venueName || "Registered venue"}</h4>
              <strong>
                {v.sentiment === "negative"
                  ? "Needs attention"
                  : "Good experience"}
              </strong>
              <p>{v.raw_text || "No written details."}</p>
              <p>{v.summary || "Awaiting analysis"}</p>
              <details className="my-3 text-sm">
                <summary>Visit scan evidence</summary>
                {v.scans?.map((scan) => (
                  <p key={scan.phase}>
                    {scan.phase} | {localDate(scan.recordedAt)} | {scan.method}{" "}
                    |{" "}
                    {scan.locationSource === "simulated"
                      ? "Demo location · GPS not verified"
                      : scan.latitude == null
                        ? "Location unavailable"
                        : `${scan.latitude.toFixed(5)}, ${scan.longitude?.toFixed(5) ?? "unknown"} (+/-${Math.round(scan.accuracyMeters ?? 0)} m)`}
                  </p>
                ))}
              </details>
              {v.moderation_status === "pending" ? (
                <button
                  className={ui("sr-text-link")}
                  onClick={async () => {
                    try {
                      await request(
                        "/api/admin/visit-reviews/" + v.id + "/reviewed",
                        "POST",
                      );
                      setVisits((rows) =>
                        rows.map((r) =>
                          r.id === v.id
                            ? { ...r, moderation_status: "reviewed" }
                            : r,
                        ),
                      );
                    } catch (e) {
                      toast.error(errorMessage(e));
                    }
                  }}
                >
                  Mark reviewed by NGO staff
                </button>
              ) : (
                <p className="text-sm">Reviewed by NGO staff</p>
              )}
              <small>
                {v.analysis_mode || "pending"} ?{" "}
                {v.consistency || "insufficient_evidence"} ? Human review
                required
              </small>
              {v.uncertainties?.map((u: string) => (
                <p className="text-xs" key={u}>
                  {u}
                </p>
              ))}
            </article>
          ))
        ) : (
          <p>No private visit reviews yet.</p>
        )}
      </section>
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
