import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { ConsumerMeal } from "../../../shared/types/consumer-meals";

const pin = L.divIcon({
  className: "",
  html: '<span class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-samrita-teal text-sm font-bold text-white shadow-lg" aria-hidden="true">♥</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
function FitResults({ venues }: { venues: ConsumerMeal[] }) {
  const map = useMap();
  useEffect(() => {
    const resize = () => {
      if (!map.getContainer().clientWidth) return;
      map.invalidateSize({ animate: false });
      if (venues.length)
        map.fitBounds(
          venues.map((venue) => [venue.lat, venue.lng] as [number, number]),
          { padding: [40, 40], maxZoom: 14, animate: false },
        );
      else map.setView([40.7306, -73.9866], 13, { animate: false });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, venues]);
  return null;
}
export default function ConsumerMap({
  venues,
  publicDirectory = false,
}: {
  venues: ConsumerMeal[];
  publicDirectory?: boolean;
}) {
  const [unavailable, setUnavailable] = useState(false);
  return (
    <section
      aria-label={publicDirectory ? 'New York City food assistance directory map' : 'New York City meal map'}
      className="relative isolate overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-stacked-sm shadow-samrita-charcoal"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <strong className="text-sm">New York City</strong>
        <span className="text-[10px] text-slate-600">
          {venues.length}{" "}
          {publicDirectory ? "publicly listed" : "fictional demo"}{" "}
          {venues.length === 1 ? "location" : "locations"}
        </span>
      </div>
      <div className="h-[310px] lg:h-[380px]" role="region" aria-label={publicDirectory ? 'Interactive map of publicly listed food assistance locations' : 'Interactive map with fictional meal locations'}>
        <MapContainer
          center={[40.7306, -73.9866]}
          zoom={13}
          zoomAnimation={false}
          fadeAnimation={false}
          markerZoomAnimation={false}
          scrollWheelZoom={false}
          className="h-full w-full"
          aria-label={
            publicDirectory
              ? "Interactive map of publicly listed food assistance locations"
              : "Interactive map with fictional meal locations"
          }
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            eventHandlers={{
              tileerror: () => setUnavailable(true),
              tileload: () => setUnavailable(false),
            }}
          />
          <FitResults venues={venues} />
          {venues.map((venue) => (
            <Marker key={venue.id} position={[venue.lat, venue.lng]} icon={pin}>
              <Popup>
                <strong>{venue.name}</strong>
                <p>{venue.meal}</p>
                <p>{publicDirectory ? "Hours and availability unverified. Contact the provider before visiting." : "Fictional demo location; no live availability"}</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {unavailable && (
        <p role="status" className="bg-white px-4 py-3 text-xs text-slate-600">
          Map tiles could not load. Check your connection, or use the location
          details below.
        </p>
      )}
      <p className="bg-white px-4 py-2 text-[10px] text-slate-600">
        {publicDirectory
          ? "NYC Open Data locations; no live meal availability or verified partnership."
          : "Real street map; sample markers only. Do not travel to these locations expecting food."}
      </p>
    </section>
  );
}
