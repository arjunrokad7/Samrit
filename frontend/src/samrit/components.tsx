import { ui } from "./design";
import { DEMO_LOCATION_MODE } from "./location";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { QRCodeSVG } from "qrcode.react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
} from "react-leaflet";
import { Camera, Check, MapPin, ScanLine } from "lucide-react";
import {
  REGION,
  localDate,
  mediaUrl,
  batchHandlingLabel,
  portionCount,
  errorMessage,
} from "./api";
import type { FoodBatch, CenterProfile, DispatchRoute, Location } from "./api";
import { Sheet } from "./Sheet";
import type { FleetDriver } from "../../../shared/types/samrit";
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className={ui("sr-empty")}>
      <span className={ui("sr-icon-box")}>
        <MapPin />
      </span>
      <h3>A little room for good things.</h3>
      <p>{children}</p>
    </div>
  );
}
export function Tag({ value }: { value: string }) {
  return (
    <span className={ui(`sr-status ${value}`)}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
export function QR({
  value,
  label,
  caption,
}: {
  value: string;
  label: string;
  caption?: string;
}) {
  return (
    <div className={ui("sr-qr")}>
      <QRCodeSVG value={value} size={112} level="M" />
      <div>
        <strong>{label}</strong>
        <small>{value}</small>
        {caption && <span>{caption}</span>}
      </div>
    </div>
  );
}
export function PhotoField({
  onChange,
  label = "Take or upload a food photo",
}: {
  onChange: (file: File | null) => void;
  label?: string;
}) {
  const [preview, setPreview] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className={ui("sr-photo-field")}>
      <Camera size={25} />
      <strong>{label}</strong>
      <small>JPEG, PNG, or WebP · up to 5 MB</small>
      <button
        type="button"
        className={ui("sr-button sr-secondary")}
        onClick={() => setOpen(true)}
      >
        <Camera size={17} />
        {preview ? "Change photo" : "Add food photo"}
      </button>
      {preview && <img src={preview} alt="Selected food evidence" />}
      {open && (
        <Sheet title={label} onClose={() => setOpen(false)}>
          <p className="text-xs text-slate-600">
            {DEMO_LOCATION_MODE
              ? "Demo location is recorded automatically."
              : "GPS required for handoff."}
          </p>
          <label className={ui("sr-photo-field")}>
            <Camera size={30} />
            <strong>Take or choose your food photo</strong>
            <input
              aria-label={label}
              className="max-w-full text-xs file:mr-3 file:rounded-2xl file:border-0 file:bg-samrita-teal file:px-4 file:py-3 file:text-xs file:font-semibold file:text-white"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                onChange(file);
                setPreview(file ? URL.createObjectURL(file) : "");
                if (file) setOpen(false);
              }}
            />
          </label>
        </Sheet>
      )}
    </div>
  );
}
export function ScanField({
  value,
  onChange,
  label,
  onScan,
  openRequest = 0,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  onScan?: (value: string) => void;
  openRequest?: number;
}) {
  const [manualOpen, setOpen] = useState(false);
  const [handledRequest, setHandledRequest] = useState(0);
  const open = manualOpen || openRequest > handledRequest;
  const closeCamera = useCallback(() => {
    setOpen(false);
    setHandledRequest(openRequest);
  }, [openRequest]);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!open || !video.current) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    const reader = new BrowserQRCodeReader();
    reader
      .decodeFromVideoDevice(
        undefined,
        video.current,
        (result, _error, controls) => {
          if (result && !cancelled) {
            onChange(result.getText());
            controls.stop();
            closeCamera();
            onScan?.(result.getText());
          }
        },
      )
      .then((controls) => {
        if (cancelled) controls.stop();
        else stop = () => controls.stop();
      })
      .catch((error) => {
        if (cancelled) return;
        setError(errorMessage(error));
        closeCamera();
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [open, onChange, onScan, closeCamera]);
  return (
    <div className={ui("sr-scan")}>
      <label>
        {label}
        <div className={ui("sr-input-action")}>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Scan QR or enter its printed ID"
          />
          <button
            type="button"
            className={ui("sr-button sr-secondary")}
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            <ScanLine size={18} />
            Camera
          </button>
        </div>
      </label>
      {open && (
        <Sheet title={label} onClose={closeCamera}>
          <video ref={video} className={ui("sr-camera")} muted playsInline />
        </Sheet>
      )}
      {error && (
        <p className={ui("sr-error")}>
          Camera unavailable: {error}. You can enter the printed code.
        </p>
      )}
    </div>
  );
}
export function NetworkMap({
  batches,
  centers,
  routes = [],
  drivers = [],
}: {
  batches: FoodBatch[];
  centers: CenterProfile[];
  routes?: DispatchRoute[];
  drivers?: FleetDriver[];
}) {
  const [offline, setOffline] = useState(false);
  return (
    <div className={ui("sr-map")}>
      <MapContainer
        center={[REGION.lat, REGION.lng]}
        zoom={12}
        scrollWheelZoom={false}
        className={ui("h-full min-h-[320px] w-full")}
      >
        <TileLayer
          eventHandlers={{ tileerror: () => setOffline(true) }}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {drivers
          .filter(
            (driver) =>
              driver.latitude != null &&
              driver.longitude != null &&
              driver.isActive,
          )
          .map((driver) => (
            <CircleMarker
              key={driver.id}
              center={[driver.latitude!, driver.longitude!]}
              radius={7}
              pathOptions={{ color: "#244557", fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{driver.name}</strong>
                <p>
                  {driver.locationSource === "admin_base"
                    ? "Dispatch base, not current GPS"
                    : "Last reported location"}
                </p>
                <p>
                  {driver.locationUpdatedAt
                    ? localDate(driver.locationUpdatedAt)
                    : "Timestamp unavailable"}
                </p>
              </Popup>
            </CircleMarker>
          ))}
        {batches
          .filter((batch) => batch.status !== "delivered")
          .map((batch) => (
            <CircleMarker
              key={batch.batchId}
              center={[batch.location.lat, batch.location.lng]}
              radius={8}
              pathOptions={{ color: "#537a5a", fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{batch.eventName}</strong>
                <br />
                {portionCount(batch)} servings · {batchHandlingLabel(batch)}
              </Popup>
            </CircleMarker>
          ))}
        {centers.map((center) => (
          <CircleMarker
            key={center.centerId}
            center={[center.location.lat, center.location.lng]}
            radius={10}
            pathOptions={{ color: "#376c6f", fillOpacity: 0.8 }}
          >
            <Popup>
              <strong>{center.name}</strong>
              <br />
              {center.location.address}
            </Popup>
          </CircleMarker>
        ))}
        {routes
          .filter((route) => route.status === "active")
          .map((route) => (
            <Polyline
              key={route.routeId}
              positions={route.waypoints.map((point) => [
                point.location.lat,
                point.location.lng,
              ])}
              pathOptions={{ color: "#376c6f", dashArray: "7 8", weight: 3 }}
            >
              <Popup>
                <strong>Route {route.routeId.slice(0, 8)}</strong>
                <p>
                  {drivers.find((driver) => driver.id === route.driverId)
                    ?.name || "Assigned driver"}
                </p>
                <p>
                  {route.vehicleSnapshot
                    ? `${route.vehicleSnapshot.name} / ${route.vehicleSnapshot.registration}`
                    : "Historical route: no vehicle record"}
                </p>
                <p>
                  {
                    route.waypoints.filter((point) => point.status === "done")
                      .length
                  }{" "}
                  / {route.waypoints.length} stops completed
                </p>
              </Popup>
            </Polyline>
          ))}
      </MapContainer>
      {offline && (
        <div className={ui("sr-map-offline")}>
          Map background unavailable. Pickup and center markers still show
          registered coordinates.
        </div>
      )}
    </div>
  );
}
export function Directions({
  location,
  transit = false,
}: {
  location: Location;
  transit?: boolean;
}) {
  return (
    <a
      className={ui("sr-text-link")}
      target="_blank"
      rel="noreferrer"
      href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=${transit ? "transit" : "driving"}`}
    >
      <MapPin size={15} />
      {transit ? "Transit directions" : "Driving directions"} ↗
    </a>
  );
}
export function BatchCard({
  batch,
  children,
}: {
  batch: FoodBatch;
  children?: ReactNode;
}) {
  return (
    <article className={ui("sr-batch")}>
      <div className={ui("sr-batch-top")}>
        <span className={ui("sr-eyebrow")}>
          BATCH / {batch.batchId.slice(0, 8)}
        </span>
        <Tag value={batch.status} />
      </div>
      <h3>{batch.items.map((item) => item.name).join(" + ")}</h3>
      <p>
        {batch.eventName} · {portionCount(batch)} servings
      </p>
      <div className={ui("sr-batch-meta")}>
        <span>{batchHandlingLabel(batch)}</span>
        <span>Use by {localDate(batch.expiresAt)}</span>
      </div>
      <div className={ui("sr-allergens")}>
        {[...new Set(batch.items.flatMap((item) => item.allergens))].map(
          (allergen) => (
            <span key={allergen}>Contains {allergen.toLowerCase()}</span>
          ),
        )}
      </div>
      <div className={ui("sr-custody-mini")}>
        {[
          batch.chainOfCustody.stage1_DonorPic,
          batch.chainOfCustody.stage2_PickupPic,
          batch.chainOfCustody.stage3_DropoffPic,
        ].map((photo, index) => (
          <span className={ui(photo ? "complete" : "")} key={index}>
            {photo ? <Check size={12} /> : <Camera size={12} />}
            {["Donor", "Pickup", "Arrival"][index]}
          </span>
        ))}
      </div>
      {children}
    </article>
  );
}
export function CustodyGallery({ batches }: { batches: FoodBatch[] }) {
  return (
    <div className={ui("sr-stack")}>
      {batches.map((batch) => (
        <section className={ui("sr-panel")} key={batch.batchId}>
          <div className={ui("sr-panel-heading")}>
            <div>
              <span className={ui("sr-eyebrow")}>
                {batch.batchId.slice(0, 8)}
              </span>
              <h3>{batch.items.map((item) => item.name).join(", ")}</h3>
            </div>
            <Tag value={batch.status} />
          </div>
          <div className={ui("sr-proof-grid")}>
            {[
              batch.chainOfCustody.stage1_DonorPic,
              batch.chainOfCustody.stage2_PickupPic,
              batch.chainOfCustody.stage3_DropoffPic,
            ].map((photo, index) => (
              <div className={ui("sr-proof")} key={index}>
                <strong>
                  0{index + 1} /{" "}
                  {["At the event", "Driver pickup", "Center arrival"][index]}
                </strong>
                {photo ? (
                  <>
                    <a
                      href={mediaUrl(photo.url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={mediaUrl(photo.url)}
                        alt={`${["Donor", "Pickup", "Arrival"][index]} custody evidence`}
                      />
                    </a>
                    <small>{localDate(photo.timestamp)}</small>
                    <small>
                      {photo.locationSource === "simulated"
                        ? "Simulated location · "
                        : ""}
                      {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
                    </small>
                    <span
                      className={ui("sr-evidence-hash")}
                      title={photo.sha256}
                    >
                      SHA256 {photo.sha256.slice(0, 16)}…
                    </span>
                  </>
                ) : (
                  <div className={ui("sr-proof-pending")}>
                    <Camera size={24} />
                    <span>Waiting for handoff</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
