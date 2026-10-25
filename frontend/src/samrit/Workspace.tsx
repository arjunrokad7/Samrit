import { ui } from "./design";
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  LayoutDashboard,
  CalendarDays,
  Package,
  Building2,
  Truck,
  ScanLine,
  ShieldCheck,
  MessageSquare,
  LogOut,
  RefreshCw,
  Menu,
  MapPin,
  ArrowUpRight,
  Heart,
} from "lucide-react";
import { Brand } from "./Auth";
import { useSession } from "./session";
import { request, errorMessage, localDate, portionCount, REGION } from "./api";
import type { Overview } from "./api";
import { BatchCard, CustodyGallery, Empty, NetworkMap } from "./components";
import Donor from "./Donor";
import { CenterIntake, CenterProfileForm } from "./Center";
import Driver from "./Driver";
import Fleet, { FleetSummary } from "./Fleet";
import { Dispatch, Centers, Moderation } from "./Admin";
const labels = {
  DONOR: "Event organizer",
  NGO: "Distribution center",
  VOLUNTEER: "NGO driver",
  ADMIN: "Central NGO",
};
const nav = {
  DONOR: [
    ["overview", "Overview", LayoutDashboard],
    ["events", "Event planning", CalendarDays],
    ["triage", "Leftover triage", Package],
    ["custody", "Chain of custody", ShieldCheck],
  ],
  NGO: [
    ["overview", "Overview", LayoutDashboard],
    ["center", "My facility", Building2],
    ["intake", "Intake & feedback", ScanLine],
    ["custody", "Chain of custody", ShieldCheck],
  ],
  VOLUNTEER: [
    ["overview", "Overview", LayoutDashboard],
    ["driver", "My handoffs", Truck],
    ["custody", "Chain of custody", ShieldCheck],
  ],
  ADMIN: [
    ["overview", "Overview", LayoutDashboard],
    ["dispatch", "Dispatch & routes", Truck],
    ["fleet", "Drivers & vehicles", Truck],
    ["centers", "Distribution centers", Building2],
    ["custody", "Chain of custody", ShieldCheck],
    ["moderation", "Private quality reviews", MessageSquare],
  ],
};
const titles: Record<string, [string, string]> = {
  overview: [
    "A little coordination. A lot of good.",
    "Your food recovery network, at a glance.",
  ],
  events: [
    "Plan the event. Rescue the possibility.",
    "Save menus before the food is ready to move.",
  ],
  triage: [
    "Good food deserves a next chapter.",
    "Turn verified leftovers into a rescue batch.",
  ],
  center: [
    "A welcoming place, ready to receive.",
    "Keep your facility capabilities and hours up to date.",
  ],
  intake: [
    "One careful handoff at a time.",
    "Verify arrivals and send quality feedback privately.",
  ],
  driver: [
    "Make your next mile matter.",
    "Your assigned routes, scans, and pickup evidence.",
  ],
  dispatch: [
    "The right food. The right destination.",
    "Match capacity, equipment, and time before dispatch.",
  ],
  fleet: [
    "The people and vehicles behind every meal.",
    "Manage your NGO drivers, fleet equipment and availability.",
  ],
  centers: [
    "A network of welcoming tables.",
    "Review and approve distribution facilities.",
  ],
  custody: [
    "Every handoff, accounted for.",
    "Photographic evidence, timestamps, and GPS records.",
  ],
  moderation: [
    "Care behind the scenes.",
    "Private quality signals for the central NGO team.",
  ],
};
export default function Workspace() {
  const { user, loading, signOut } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = params.get("view") || "overview";
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);
  const refresh = useCallback(
    () =>
      request<Overview>("/api/samrit/overview")
        .then((result) => {
          setData(result);
          setError("");
        })
        .catch((error) => {
          setError(errorMessage(error));
        })
        .finally(() => {
          setBusy(false);
        }),
    [],
  );
  useEffect(() => {
    if (!user) return;
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 15000);
    return () => clearInterval(timer);
  }, [user, refresh]);
  if (loading) return <div className={ui("sr-loading")}>Opening Samrit…</div>;
  if (!user) return <Navigate to="/login" replace />;
  const navigation = nav[user.role];
  const current = navigation.some((item) => item[0] === tab) ? tab : "overview";
  const [title] = titles[current];
  const go = (view: string) => {
    setParams({ view });
    setMobile(false);
  };
  const active =
    data?.batches.filter((batch) =>
      ["matched", "in_transit"].includes(batch.status),
    ) || [];
  const delivered =
    data?.batches.filter((batch) => batch.status === "delivered") || [];
  const next =
    user.role === "DONOR"
      ? "events"
      : user.role === "NGO"
        ? "intake"
        : user.role === "ADMIN"
          ? "dispatch"
          : "driver";
  return (
    <div className={ui("sr-workspace")}>
      <aside className={ui(`sr-sidebar ${mobile ? "is-open" : ""}`)}>
        <Brand light />
        <div className={ui("sr-workspace-label")}>FOOD RECOVERY WORKSPACE</div>
        <div className={ui("sr-role-card")}>
          <span className={ui("sr-avatar")}>{user.name[0]}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{labels[user.role]}</small>
          </div>
        </div>
        <div className={ui("sr-nav-label")}>YOUR WORKSPACE</div>
        <nav
          className={ui(
            "flex flex-col gap-2 [&>button]:flex [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-2xl [&>button]:bg-transparent [&>button]:px-3 [&>button]:py-3 [&>button]:text-left [&>button]:text-xs [&>button]:text-white/90 [&>button:hover]:bg-white/10 [&>.active]:!bg-samrita-fern [&>.active]:!text-white [&>.active]:shadow-stacked-sm [&>.active]:shadow-samrita-iron",
          )}
        >
          {navigation.map(([id, label, Icon]) => {
            const NavIcon = Icon as typeof Heart;
            return (
              <button
                key={id as string}
                className={ui(current === id ? "active" : "")}
                onClick={() => go(id as string)}
              >
                <NavIcon size={19} />
                {label as string}
                {current === id && <span className={ui("sr-nav-dot")} />}
              </button>
            );
          })}
        </nav>
        <div className={ui("sr-sidebar-bottom")}>
          <div className={ui("sr-community-note")}>
            <Heart size={22} />
            <strong>Every meal has a next chapter.</strong>
            <small>Thank you for helping write it.</small>
          </div>
          <Link to="/consumer">
            <ArrowUpRight size={17} />
            Find a meal
          </Link>
          <button onClick={signOut}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
      <div className={ui("sr-workspace-main")}>
        <header className={ui("sr-topbar")}>
          <button
            className={ui("sr-icon-button sr-mobile-menu")}
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <span>
            <span className={ui("sr-live-dot")} />
            {labels[user.role]}
            <span className={ui("sr-topbar-divider")}>/</span>
            {navigation.find((item) => item[0] === current)?.[1] as string}
          </span>
          <div>
            <MapPin size={15} />
            <span>{REGION.city} · Eastern</span>
            <span className={ui("sr-avatar sr-avatar-small")}>
              {user.name[0]}
            </span>
          </div>
        </header>
        <main className={ui("sr-content")}>
          <div className={ui("sr-page-heading")}>
            <div>
              <span className={ui("sr-eyebrow")}>
                {new Intl.DateTimeFormat(REGION.locale, {
                  timeZone: REGION.timeZone,
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(new Date())}
              </span>
              <h1>{title}</h1>
            </div>
            <button
              className={ui("sr-button sr-secondary sr-small")}
              onClick={() => {
                setBusy(true);
                void refresh();
              }}
              disabled={busy}
            >
              <RefreshCw size={15} className={ui(busy ? "sr-spin" : "")} />
              Refresh
            </button>
          </div>
          {error && (
            <div className={ui("sr-error")} role="alert">
              {error}
              <button
                className={ui("sr-text-link")}
                onClick={() => {
                  void refresh();
                }}
              >
                Retry
              </button>
            </div>
          )}
          {!data ? (
            <div className={ui("sr-loading")}>
              {error
                ? "Waiting for the API connection."
                : "Loading your recovery network…"}
            </div>
          ) : (
            <>
              {current === "fleet" && user.role === "ADMIN" && (
                <Fleet data={data} refresh={refresh} />
              )}
              {current === "overview" && (
                <>
                  {user.role === "ADMIN" && <FleetSummary data={data} />}
                  <div className={ui("sr-stats")}>
                    <div>
                      <span>BATCHES SHARED</span>
                      <strong>
                        {data.batches.length}
                        <Package />
                      </strong>
                    </div>
                    <div>
                      <span>SERVINGS DELIVERED</span>
                      <strong>
                        {delivered.reduce(
                          (sum, batch) => sum + portionCount(batch),
                          0,
                        )}
                        <Heart />
                      </strong>
                    </div>
                    <div>
                      <span>ACTIVE HANDOFFS</span>
                      <strong>
                        {active.length}
                        <Truck />
                      </strong>
                    </div>
                    <div>
                      <span>CUSTODY COMPLETE</span>
                      <strong>
                        {
                          delivered.filter(
                            (batch) => !!batch.chainOfCustody.stage3_DropoffPic,
                          ).length
                        }
                        <ShieldCheck />
                      </strong>
                    </div>
                  </div>
                  <div className={ui("sr-two-col sr-overview-cols")}>
                    <section className={ui("sr-panel")}>
                      <div className={ui("sr-panel-heading")}>
                        <div>
                          <span className={ui("sr-eyebrow")}>
                            CONNECTED BY CARE
                          </span>
                          <h3>Your neighborhood network</h3>
                        </div>
                        <span className={ui("sr-status approved")}>
                          New York
                        </span>
                      </div>
                      <NetworkMap
                        batches={data.batches}
                        centers={data.centers}
                        routes={data.routes}
                        drivers={data.drivers}
                      />
                      <div className={ui("sr-map-legend")}>
                        <span>● Distribution centers</span>
                        <span>● Pickup points</span>
                        <span>┄ Active routes</span>
                      </div>
                    </section>
                    <aside className={ui("sr-panel sr-next-step")}>
                      <span className={ui("sr-eyebrow")}>
                        YOUR NEXT GOOD THING
                      </span>
                      <h2>
                        {user.role === "DONOR"
                          ? "From your next event to someone’s next meal."
                          : user.role === "NGO"
                            ? "Make room for the next community meal."
                            : user.role === "ADMIN"
                              ? "Connect the dots. Keep food moving."
                              : "A simple route. A meaningful difference."}
                      </h2>

                      <button
                        className={ui("sr-button")}
                        onClick={() => go(next)}
                      >
                        Open{" "}
                        {next === "events"
                          ? "event planning"
                          : next === "intake"
                            ? "center intake"
                            : next === "driver"
                              ? "my handoffs"
                              : "dispatch"}
                        <ArrowRight size={17} />
                      </button>
                      <div className={ui("sr-next-step-art")}>
                        <Package size={70} strokeWidth={1} />
                        <Heart size={35} strokeWidth={1.3} />
                      </div>
                    </aside>
                  </div>
                  <div className={ui("sr-panel-heading sr-section-space")}>
                    <div>
                      <span className={ui("sr-eyebrow")}>
                        SMALL ACTIONS. SHARED IMPACT.
                      </span>
                      <h2>Recent rescue batches</h2>
                    </div>
                    <button
                      className={ui("sr-text-link")}
                      onClick={() => go("custody")}
                    >
                      View custody records <ArrowUpRight size={16} />
                    </button>
                  </div>
                  {data.batches.length ? (
                    <div className={ui("sr-card-grid")}>
                      {data.batches.slice(0, 6).map((batch) => (
                        <BatchCard key={batch.batchId} batch={batch} />
                      ))}
                    </div>
                  ) : (
                    <Empty>
                      {user.role === "DONOR"
                        ? "Create an event, then record your first leftover batch."
                        : "Your assigned batches will appear here."}
                    </Empty>
                  )}
                </>
              )}
              {current === "events" && user.role === "DONOR" && (
                <Donor data={data} refresh={refresh} />
              )}
              {current === "triage" && user.role === "DONOR" && (
                <Donor key="triage" triage data={data} refresh={refresh} />
              )}
              {current === "center" && user.role === "NGO" && (
                <CenterProfileForm data={data} refresh={refresh} />
              )}
              {current === "intake" && user.role === "NGO" && (
                <CenterIntake data={data} refresh={refresh} />
              )}
              {current === "driver" && user.role === "VOLUNTEER" && (
                <Driver data={data} refresh={refresh} />
              )}
              {current === "dispatch" && user.role === "ADMIN" && (
                <Dispatch data={data} refresh={refresh} />
              )}
              {current === "centers" && user.role === "ADMIN" && (
                <Centers data={data} refresh={refresh} />
              )}
              {current === "moderation" && user.role === "ADMIN" && (
                <Moderation data={data} />
              )}
              {current === "custody" && (
                <>
                  <CustodyGallery batches={data.batches} />
                  {!data.batches.length && (
                    <Empty>
                      Custody records appear after the first batch is created.
                    </Empty>
                  )}
                  {data.scans.length > 0 && (
                    <section className={ui("sr-panel sr-section-space")}>
                      <h3>GPS scan audit</h3>
                      <div className={ui("sr-table-wrap")}>
                        <table>
                          <thead>
                            <tr>
                              <th>Scan</th>
                              <th>Batch</th>
                              <th>Time</th>
                              <th>Device location</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.scans.map((scan) => (
                              <tr key={scan.scanId}>
                                <td>{scan.kind.replaceAll("_", " ")}</td>
                                <td>{scan.batchId.slice(0, 8)}</td>
                                <td>{localDate(scan.timestamp)}</td>
                                <td>
                                  {scan.lat.toFixed(5)}, {scan.lng.toFixed(5)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
          <footer className={ui("sr-workspace-footer")}>
            <span>Samrit · From surplus to shared possibility.</span>
            <span>US · en-US · America/New_York</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
