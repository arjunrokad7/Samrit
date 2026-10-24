import { ui } from "./design";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Truck, ScanLine, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { useSession } from "./session";
import { request, gps, errorMessage } from "./api";
import type { Overview, FoodBatch } from "./api";
import {
  BatchCard,
  Directions,
  Empty,
  NetworkMap,
  PhotoField,
  ScanField,
} from "./components";
function Pickup({
  batch,
  data,
  refresh,
}: {
  batch: FoodBatch;
  data: Overview;
  refresh: () => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [sticker, setSticker] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const center = data.centers.find(
    (center) => center.centerId === batch.centerId,
  );
  async function scan(kind: "event" | "center") {
    setBusy(true);
    try {
      await request("/api/logistics/scan", "POST", {
        batchId: batch.batchId,
        kind,
        value: code,
        ...(await gps()),
      });
      await refresh();
      toast.success(
        `${kind === "event" ? "Event" : "Center"} scan recorded with GPS.`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function pickup() {
    if (!photo) return toast.error("Take a pickup photo first.");
    setBusy(true);
    try {
      const location = await gps();
      const form = new FormData();
      form.append("image", photo);
      form.append("stage", "2");
      form.append("lat", String(location.lat));
      form.append("lng", String(location.lng));
      await request(`/api/batches/${batch.batchId}/photo`, "PUT", form);
      await refresh();
      toast.success(
        "Pickup photo recorded. Now link the physical tracking sticker.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function link() {
    setBusy(true);
    try {
      await request("/api/logistics/link-qr", "POST", {
        batchId: batch.batchId,
        qrStickerId: sticker,
        ...(await gps()),
      });
      await refresh();
      setCode("");
      toast.success(
        "Sticker permanently linked. Your delivery is now in transit.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <BatchCard batch={batch}>
      {batch.status === "matched" ? (
        <>
          <Directions location={batch.location} />
          <ScanField
            value={code}
            onChange={setCode}
            label="1. Scan the event QR at pickup"
          />
          <button
            className={ui("sr-button sr-secondary")}
            disabled={busy || !code}
            onClick={() => scan("event")}
          >
            <ScanLine size={16} />
            Record event scan + GPS
          </button>
          {!batch.chainOfCustody.stage2_PickupPic && (
            <>
              <PhotoField
                onChange={setPhoto}
                label="2. Stage 2 · Pickup food photo"
              />
              <button
                className={ui("sr-button sr-secondary")}
                disabled={busy || !photo}
                onClick={pickup}
              >
                Record pickup photo + GPS
              </button>
            </>
          )}
          <ScanField
            value={sticker}
            onChange={setSticker}
            label="3. Scan an unused container sticker"
          />
          <button
            className={ui("sr-button")}
            disabled={
              busy || !sticker || !batch.chainOfCustody.stage2_PickupPic
            }
            onClick={link}
          >
            {busy ? "Recording…" : "Link sticker & start delivery"}
            <Truck size={17} />
          </button>
        </>
      ) : (
        <>
          <div className={ui("sr-callout")}>
            <Truck />
            <div>
              Deliver to {center?.name}
              <small>{center?.location.address}</small>
            </div>
          </div>
          {center && <Directions location={center.location} />}
          <p>
            Tracking sticker: <strong>{batch.qrStickerId}</strong>
          </p>
          <ScanField
            value={code}
            onChange={setCode}
            label="4. Scan the center entrance QR on arrival"
          />
          <button
            className={ui("sr-button")}
            disabled={busy || !code}
            onClick={() => scan("center")}
          >
            <CheckCircle2 size={16} />
            Record arrival scan + GPS
          </button>
          <p className={ui("sr-note")}>
            The receiving center completes stage 3. Drivers cannot mark food
            delivered.
          </p>
        </>
      )}
    </BatchCard>
  );
}
export default function Driver({
  data,
  refresh,
}: {
  data: Overview;
  refresh: () => Promise<void>;
}) {
  const { user } = useSession();
  const [available, setAvailable] = useState(!!user?.isAvailable);
  const [busy, setBusy] = useState(false);
  const [capabilities, setCapabilities] = useState<string[]>(
    user?.transportCapabilities || ["shelf_stable"],
  );
  useEffect(() => {
    api
      .get("/auth/profile")
      .then((response) => {
        setAvailable(!!response.data.isAvailable);
        setCapabilities(
          response.data.transportCapabilities || ["shelf_stable"],
        );
      })
      .catch(() => {});
  }, []);
  const active = data.batches.filter((batch) =>
    ["matched", "in_transit"].includes(batch.status),
  );
  async function availability() {
    setBusy(true);
    try {
      const coords = await gps();
      await api.patch("/auth/profile", {
        isAvailable: !available,
        latitude: coords.lat,
        longitude: coords.lng,
        transportCapabilities: capabilities,
      });
      setAvailable(!available);
      toast.success(
        !available
          ? "Available for dispatch. Current location updated."
          : "Marked unavailable.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={ui("sr-stack")}>
      <div className={ui("sr-callout sr-driver-banner")}>
        <Truck />
        <div>
          <strong>Your next mile makes a difference.</strong>
          <small>Availability updates include your current location.</small>
        </div>
        <button
          className={ui("sr-button sr-secondary")}
          disabled={busy}
          onClick={availability}
        >
          {available ? "Go offline" : "Set available + GPS"}
        </button>
      </div>
      <section className={ui("sr-panel")}>
        <h3>My transport equipment</h3>
        <p>
          Confirm the equipment you can actually provide. Dispatch checks these
          capabilities.
        </p>
        <div className={ui("sr-equipment")}>
          {["shelf_stable", "hot", "refrigerated", "frozen"].map((value) => (
            <label className={ui("sr-checkbox")} key={value}>
              <input
                type="checkbox"
                checked={capabilities.includes(value)}
                onChange={(event) =>
                  setCapabilities(
                    event.target.checked
                      ? [...capabilities, value]
                      : capabilities.filter((item) => item !== value),
                  )
                }
              />
              {value.replaceAll("_", " ")}
            </label>
          ))}
        </div>
        <button
          className={ui("sr-button sr-secondary")}
          disabled={busy}
          onClick={async () => {
            try {
              await api.patch("/auth/profile", {
                transportCapabilities: capabilities,
              });
              toast.success("Transport equipment updated.");
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }}
        >
          Save equipment
        </button>
      </section>
      <div className={ui("sr-two-col")}>
        <section>
          <div className={ui("sr-panel-heading")}>
            <h2>Assigned handoffs</h2>
            <span>{active.length} active</span>
          </div>
          <div className={ui("sr-stack")}>
            {active.length ? (
              active.map((batch) => (
                <Pickup
                  key={batch.batchId}
                  batch={batch}
                  data={data}
                  refresh={refresh}
                />
              ))
            ) : (
              <Empty>
                Set yourself available. Central dispatch will assign your next
                route.
              </Empty>
            )}
          </div>
        </section>
        <aside className={ui("sr-panel sr-fit")}>
          <h3>Your route</h3>
          <NetworkMap
            batches={active}
            centers={data.centers}
            routes={data.routes}
          />
          {data.routes
            .filter((route) => route.status === "active")
            .map((route) => (
              <div className={ui("sr-route-summary")} key={route.routeId}>
                <strong>
                  {route.distanceMiles} mi · about {route.estimatedMinutes} min
                </strong>
                <small>Planning estimate, not live traffic.</small>
                {route.waypoints.map((point) => (
                  <div key={point.type}>
                    <span className={ui(`sr-waypoint ${point.status}`)} />
                    {point.type === "pickup" ? "Pickup" : "Drop-off"} ·{" "}
                    {point.location.address}
                  </div>
                ))}
              </div>
            ))}
        </aside>
      </div>
    </div>
  );
}
