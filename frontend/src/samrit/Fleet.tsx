import { useState } from "react";
import { Plus, Truck, Users, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "./Sheet";
import { ui } from "./design";
import { request, errorMessage, localDate, handlingLabel } from "./api";
import type { Overview } from "./api";
import type {
  FleetDriver,
  FleetVehicle,
  Handling,
} from "../../../shared/types/samrit";

const emptyVehicle = {
  name: "",
  registration: "",
  capacityServings: 100,
  capabilities: ["shelf_stable"] as Handling[],
  equipment: [] as string[],
  status: "ready" as FleetVehicle["status"],
};
export function FleetSummary({ data }: { data: Overview }) {
  const active = data.routes.filter((route) => route.status === "active");
  const freeDrivers = data.drivers.filter(
    (driver) =>
      driver.isActive &&
      driver.isAvailable &&
      !active.some((route) => route.driverId === driver.id),
  );
  const freeVehicles = (data.vehicles || []).filter(
    (vehicle) =>
      vehicle.status === "ready" &&
      !active.some((route) => route.vehicleId === vehicle.vehicleId),
  );
  return (
    <div className={ui("sr-stats")}>
      <div>
        <span>AVAILABLE DRIVERS</span>
        <strong>
          {freeDrivers.length}
          <Users />
        </strong>
      </div>
      <div>
        <span>AVAILABLE VEHICLES</span>
        <strong>
          {freeVehicles.length}
          <Truck />
        </strong>
      </div>
      <div>
        <span>ACTIVE ROUTES</span>
        <strong>
          {active.length}
          <MapPin />
        </strong>
      </div>
      <div>
        <span>FLEET NEEDS ATTENTION</span>
        <strong>
          {
            (data.vehicles || []).filter(
              (vehicle) => vehicle.status !== "ready",
            ).length
          }
          <Truck />
        </strong>
      </div>
    </div>
  );
}

export default function Fleet({
  data,
  refresh,
}: {
  data: Overview;
  refresh: () => Promise<void>;
}) {
  const [vehicleOpen, setVehicleOpen] = useState(false),
    [driverOpen, setDriverOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [driverEditId, setDriverEditId] = useState("");
  const [vehicle, setVehicle] = useState({ ...emptyVehicle });
  const [equipmentText, setEquipmentText] = useState("");
  const [driver, setDriver] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    isAvailable: false,
    location: {
      lat: 40.7306,
      lng: -73.9866,
      address: "New York City dispatch base",
    },
  });
  const [busy, setBusy] = useState(false);
  const active = data.routes.filter((route) => route.status === "active");
  const isDriverBusy = (id: string) =>
    active.some((route) => route.driverId === id);
  const isVehicleBusy = (id: string) =>
    active.some((route) => route.vehicleId === id);
  async function saveVehicle(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await request(
        editId ? `/api/fleet/vehicles/${editId}` : "/api/fleet/vehicles",
        editId ? "PUT" : "POST",
        {
          ...vehicle,
          equipment: equipmentText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      );
      await refresh();
      setVehicleOpen(false);
      toast.success("Fleet vehicle saved.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function createDriver(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await request(
        driverEditId
          ? `/api/fleet/drivers/${driverEditId}`
          : "/api/fleet/drivers",
        driverEditId ? "PATCH" : "POST",
        driverEditId
          ? {
              name: driver.name,
              phone: driver.phone,
              location: driver.location,
              isAvailable: driver.isAvailable,
            }
          : driver,
      );
      await refresh();
      setDriverOpen(false);
      setDriver({
        ...driver,
        name: "",
        email: "",
        password: "",
        phone: "",
        isAvailable: false,
      });
      toast.success(
        driverEditId
          ? "Driver details updated."
          : "Driver account created. Share the issued credentials privately.",
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function updateDriver(
    item: FleetDriver,
    fields: { isAvailable?: boolean; isActive?: boolean },
  ) {
    setBusy(true);
    try {
      await request(`/api/fleet/drivers/${item.id}`, "PATCH", fields);
      await refresh();
      toast.success("Driver updated.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function editVehicle(item?: FleetVehicle) {
    setEditId(item?.vehicleId || "");
    setVehicle(
      item
        ? {
            name: item.name,
            registration: item.registration,
            capacityServings: item.capacityServings,
            capabilities: item.capabilities,
            equipment: item.equipment,
            status: item.status,
          }
        : { ...emptyVehicle },
    );
    setEquipmentText(item?.equipment.join(", ") || "");
    setVehicleOpen(true);
  }
  return (
    <div className={ui("sr-stack")}>
      <FleetSummary data={data} />
      <section className={ui("sr-panel")}>
        <div className={ui("sr-panel-heading")}>
          <div>
            <span className={ui("sr-eyebrow")}>CENTRAL NGO RESOURCES</span>
            <h2>Drivers</h2>
          </div>
          <button
            className={ui("sr-button sr-small")}
            onClick={() => {
              setDriverEditId("");
              setDriver({
                name: "",
                email: "",
                password: "",
                phone: "",
                isAvailable: false,
                location: {
                  lat: 40.7306,
                  lng: -73.9866,
                  address: "New York City dispatch base",
                },
              });
              setDriverOpen(true);
            }}
          >
            <Plus size={16} />
            Provision driver
          </button>
        </div>

        <div className={ui("sr-table-wrap")}>
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Status</th>
                <th>Last location</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {data.drivers.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small className="block text-xs text-slate-500">
                      {item.email}
                    </small>
                  </td>
                  <td>
                    {!item.isActive
                      ? "Account disabled"
                      : isDriverBusy(item.id)
                        ? "On route"
                        : item.isAvailable
                          ? "Available"
                          : "Unavailable"}
                  </td>
                  <td>
                    <span className="text-xs">
                      {item.latitude == null || item.longitude == null
                        ? "No location recorded"
                        : `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
                    </span>
                    <small className="block text-[10px] text-slate-500">
                      {item.locationUpdatedAt
                        ? `${item.locationSource === "admin_base" ? "Dispatch base" : "Reported"} · ${localDate(item.locationUpdatedAt)}`
                        : "Location time not recorded"}
                    </small>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-3">
                      <button
                        className={ui("sr-text-link")}
                        disabled={busy || isDriverBusy(item.id)}
                        onClick={() => {
                          setDriverEditId(item.id);
                          setDriver({
                            name: item.name,
                            email: item.email || "",
                            password: "",
                            phone: item.phone || "",
                            isAvailable: item.isAvailable,
                            location: {
                              lat: item.latitude ?? 40.7306,
                              lng: item.longitude ?? -73.9866,
                              address:
                                item.address || "New York City dispatch base",
                            },
                          });
                          setDriverOpen(true);
                        }}
                      >
                        Edit details / base
                      </button>
                      <button
                        className={ui("sr-text-link")}
                        disabled={busy || !item.isActive}
                        onClick={() =>
                          void updateDriver(item, {
                            isAvailable: !item.isAvailable,
                          })
                        }
                      >
                        {item.isAvailable
                          ? "Mark unavailable"
                          : "Mark available"}
                      </button>
                      <button
                        className={ui("sr-text-link")}
                        disabled={
                          busy || (item.isActive && isDriverBusy(item.id))
                        }
                        onClick={() =>
                          void updateDriver(item, { isActive: !item.isActive })
                        }
                      >
                        {item.isActive ? "Disable account" : "Enable account"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.drivers.length && <p>No drivers registered.</p>}
      </section>
      <section className={ui("sr-panel")}>
        <div className={ui("sr-panel-heading")}>
          <div>
            <span className={ui("sr-eyebrow")}>
              EQUIPMENT BELONGS TO THE VEHICLE
            </span>
            <h2>Vehicles &amp; equipment</h2>
          </div>
          <button
            className={ui("sr-button sr-small")}
            onClick={() => editVehicle()}
          >
            <Plus size={16} />
            Add vehicle
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {(data.vehicles || []).map((item) => (
            <article
              key={item.vehicleId}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <Truck size={24} />
                <span className="text-xs font-semibold">
                  {isVehicleBusy(item.vehicleId) ? "On route" : item.status}
                </span>
              </div>
              <h3 className="mt-4 text-2xl">{item.name}</h3>
              <p className="mt-2 text-xs text-slate-600">
                {item.registration} · {item.capacityServings} servings
              </p>
              <div className="my-4 flex flex-wrap gap-2">
                {item.capabilities.map((value) => (
                  <span
                    className="rounded-xl bg-white px-3 py-1 text-[10px] text-samrita-teal"
                    key={value}
                  >
                    {handlingLabel(value)}
                  </span>
                ))}
              </div>
              <p className="mb-4 text-xs text-slate-600">
                {item.equipment.join(", ") || "No additional equipment listed"}
              </p>
              <button
                className={ui("sr-text-link")}
                disabled={isVehicleBusy(item.vehicleId)}
                onClick={() => editVehicle(item)}
              >
                <Pencil size={14} />
                {isVehicleBusy(item.vehicleId)
                  ? "Assigned · editing locked"
                  : "Edit vehicle"}
              </button>
            </article>
          ))}
        </div>
        {!data.vehicles?.length && <p>No vehicles registered.</p>}
      </section>
      {vehicleOpen && (
        <Sheet
          title={editId ? "Edit vehicle" : "Add NGO vehicle"}
          onClose={() => {
            if (!busy) setVehicleOpen(false);
          }}
        >
          <form onSubmit={saveVehicle}>
            <label>
              Vehicle name
              <input
                required
                maxLength={100}
                value={vehicle.name}
                onChange={(e) =>
                  setVehicle({ ...vehicle, name: e.target.value })
                }
              />
            </label>
            <label>
              Registration / fleet identifier
              <input
                required
                maxLength={30}
                value={vehicle.registration}
                onChange={(e) =>
                  setVehicle({ ...vehicle, registration: e.target.value })
                }
              />
            </label>
            <label>
              Capacity (servings)
              <input
                required
                type="number"
                min={1}
                max={10000}
                value={vehicle.capacityServings}
                onChange={(e) =>
                  setVehicle({
                    ...vehicle,
                    capacityServings: Number(e.target.value),
                  })
                }
              />
            </label>
            <fieldset className="my-5">
              <legend className="text-xs font-semibold">
                Transport capabilities
              </legend>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    "shelf_stable",
                    "hot",
                    "refrigerated",
                    "frozen",
                  ] as Handling[]
                ).map((value) => (
                  <label className="!flex-row !items-center" key={value}>
                    <input
                      type="checkbox"
                      checked={vehicle.capabilities.includes(value)}
                      onChange={(e) =>
                        setVehicle({
                          ...vehicle,
                          capabilities: e.target.checked
                            ? [...vehicle.capabilities, value]
                            : vehicle.capabilities.filter(
                                (item) => item !== value,
                              ),
                        })
                      }
                    />
                    {handlingLabel(value)}
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              Equipment (comma separated)
              <input
                value={equipmentText}
                onChange={(e) => setEquipmentText(e.target.value)}
                placeholder="Insulated hot boxes, lift gate, hand truck"
              />
            </label>
            <label>
              Operational status
              <select
                value={vehicle.status}
                onChange={(e) =>
                  setVehicle({
                    ...vehicle,
                    status: e.target.value as FleetVehicle["status"],
                  })
                }
              >
                <option value="ready">Ready</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <button
              className={ui("sr-button")}
              disabled={busy || !vehicle.capabilities.length}
            >
              {busy ? "Saving..." : "Save vehicle"}
            </button>
          </form>
        </Sheet>
      )}
      {driverOpen && (
        <Sheet
          title={driverEditId ? "Edit NGO driver" : "Provision NGO driver"}
          onClose={() => {
            if (!busy) {
              setDriverOpen(false);
              setDriver((current) => ({ ...current, password: "" }));
            }
          }}
        >
          <form onSubmit={createDriver}>
            <label>
              Full name
              <input
                required
                maxLength={100}
                value={driver.name}
                onChange={(e) => setDriver({ ...driver, name: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                disabled={!!driverEditId}
                type="email"
                autoComplete="off"
                required
                value={driver.email}
                onChange={(e) =>
                  setDriver({ ...driver, email: e.target.value })
                }
              />
            </label>
            {!driverEditId && (
              <label>
                Issued password (10+ characters)
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={100}
                  value={driver.password}
                  onChange={(e) =>
                    setDriver({ ...driver, password: e.target.value })
                  }
                />
              </label>
            )}
            <label>
              Phone
              <input
                value={driver.phone}
                onChange={(e) =>
                  setDriver({ ...driver, phone: e.target.value })
                }
              />
            </label>
            <label>
              Dispatch base address
              <input
                required
                minLength={5}
                value={driver.location.address}
                onChange={(e) =>
                  setDriver({
                    ...driver,
                    location: { ...driver.location, address: e.target.value },
                  })
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label>
                Base latitude
                <input
                  type="number"
                  required
                  step="any"
                  min={-90}
                  max={90}
                  value={driver.location.lat}
                  onChange={(e) =>
                    setDriver({
                      ...driver,
                      location: {
                        ...driver.location,
                        lat: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                Base longitude
                <input
                  type="number"
                  required
                  step="any"
                  min={-180}
                  max={180}
                  value={driver.location.lng}
                  onChange={(e) =>
                    setDriver({
                      ...driver,
                      location: {
                        ...driver.location,
                        lng: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            </div>
            <label className="!flex-row !items-center">
              <input
                type="checkbox"
                checked={driver.isAvailable}
                onChange={(e) =>
                  setDriver({ ...driver, isAvailable: e.target.checked })
                }
              />
              Available for dispatch
            </label>
            <button className={ui("sr-button")} disabled={busy}>
              {busy
                ? "Saving..."
                : driverEditId
                  ? "Save driver details"
                  : "Create driver account"}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
