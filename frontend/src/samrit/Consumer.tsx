import { ui } from "./design";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import AllergenSelect from "./AllergenSelect";
import { Brand } from "./Auth";
import { PublicFooter, TermsNotice } from "./PublicLinks";
import ConsumerMap from "./ConsumerMap";
import VoiceAssistant from "./VoiceAssistant";
import { DEMO_LOCATION_MODE, demoCoordinates } from "./location";
import { useNavigate } from "react-router-dom";
import type { VoiceAction } from "../../../shared/types/voice-assistant";
import {
  type ConsumerMeal,
  type MealSearchResult,
} from "../../../shared/types/consumer-meals";
export default function Consumer() {
  const navigate = useNavigate();
  const [area, setArea] = useState("");
  const [locationError, setLocationError] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [meals, setMeals] = useState<ConsumerMeal[]>([]);
  const [directory, setDirectory] = useState<
    {
      id: string;
      name: string;
      address: string;
      lat: number;
      lng: number;
      serviceType: string;
      description: string;
      sourceUrl: string;
      retrievedAt: string;
    }[]
  >([]);
  const [catalogError, setCatalogError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const base = import.meta.env.VITE_API_URL || "http://localhost:3000";
    Promise.all(
      ["/api/consumer/catalog", "/api/consumer/directory"].map((url) =>
        fetch(base + url, { signal: controller.signal }).then(async (r) => {
          if (!r.ok) throw Error("Directory unavailable");
          const data = (await r.json()).data;
          if (!Array.isArray(data)) throw Error("Invalid directory response");
          return data;
        }),
      ),
    )
      .then(([catalog, places]) => {
        setMeals(catalog);
        setDirectory(places);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setCatalogError("Meal directory could not load. Please try again.");
      });
    return () => controller.abort();
  }, []);
  const [avoid, setAvoid] = useState<string[]>([]);
  const [diet, setDiet] = useState("");
  const [smart, setSmart] = useState<MealSearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const currentRequest = useRef<AbortController | null>(null);
  useEffect(() => () => currentRequest.current?.abort(), []);
  const updateFilters = () => {
    currentRequest.current?.abort();
    setSmart(null);
    setError("");
    setBusy(false);
  };
  async function applyPreferences(preferences = diet, allergens = avoid) {
    currentRequest.current?.abort();
    const controller = new AbortController();
    currentRequest.current = controller;
    setBusy(true);
    setSmart(null);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/consumer/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: preferences.trim(), allergens }),
          signal: controller.signal,
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.message ||
            body.error ||
            "Smart search could not complete. Please try again.",
        );
      if (!controller.signal.aborted) {
        setSmart(body.data);
        return true;
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Smart search is unavailable.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
    return false;
  }
  async function locateDevice() {
    setLocationError("");
    if (DEMO_LOCATION_MODE) {
      setPosition(demoCoordinates());
      setArea("");
      return "Demo location selected. Meals are sorted using sample New York City coordinates, not device GPS.";
    }
    if (!navigator.geolocation)
      throw Error("Location is unavailable. Enter a neighborhood instead.");
    const coords = await new Promise<GeolocationCoordinates>(
      (resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          (value) => resolve(value.coords),
          () =>
            reject(
              Error(
                "Location unavailable or permission denied. Enter a neighborhood instead.",
              ),
            ),
          { timeout: 10000, maximumAge: 0 },
        ),
    );
    setPosition({ lat: coords.latitude, lng: coords.longitude });
    setArea("");
    return "Listed demo meals are now sorted by distance from your device. Availability is not verified.";
  }
  async function voiceAction(action: VoiceAction) {
    if (action.type === "check_in") {
      navigate("/consumer/check-in");
      return "Check-in page opened.";
    }
    if (action.type === "location") return locateDevice();
    if (action.type !== "filters")
      throw Error("That action is available on the check-in page.");
    updateFilters();
    setAvoid(action.allergens);
    setDiet(action.preferences);
    setArea(action.area);
    if (action.preferences.trim().length >= 2) {
      const applied = await applyPreferences(
        action.preferences,
        action.allergens,
      );
      if (!applied)
        return "Allergen and area filters updated. Smart preference search failed; check the page error and retry.";
    }
    return "Filters updated. Review the matching demo meals on the page and confirm ingredients with staff.";
  }
  const inArea = useCallback(
    (venue: { name: string; address: string }) =>
      !area.trim() ||
      `${venue.name} ${venue.address}`
        .toLowerCase()
        .includes(area.trim().toLowerCase()),
    [area],
  );
  const visibleVenues = useMemo(
    () =>
      meals
        .filter(
          (venue) =>
            inArea(venue) &&
            !avoid.some((allergen) => venue.allergens.includes(allergen)) &&
            (!smart ||
              smart.matches.some(
                (match) => match.id === venue.id && match.match === "yes",
              )),
        )
        .sort((a, b) => {
          if (!position) return 0;
          const distance = (v: ConsumerMeal) =>
            Math.acos(
              Math.min(
                1,
                Math.max(
                  -1,
                  Math.sin((position.lat * Math.PI) / 180) *
                    Math.sin((v.lat * Math.PI) / 180) +
                    Math.cos((position.lat * Math.PI) / 180) *
                      Math.cos((v.lat * Math.PI) / 180) *
                      Math.cos(((v.lng - position.lng) * Math.PI) / 180),
                ),
              ),
            );
          return distance(a) - distance(b);
        }),
    [avoid, smart, meals, inArea, position],
  );
  const unknown =
    smart?.matches.filter((match) => match.match === "unknown").length || 0;
  return (
    <div className={ui("sr-consumer")}>
      <nav className={ui("sr-public-nav")}>
        <Brand />
        <div className="max-sm:flex-col max-sm:!gap-2">
          <Link to="/" className="!inline-flex whitespace-nowrap">
            <ArrowLeft size={16} />
            Back home
          </Link>
          <Link
            to="/consumer/check-in"
            className={ui("sr-button sr-small !inline-flex")}
          >
            Check in here
          </Link>
        </div>
      </nav>
      <main>
        <div className={ui("sr-demo-label")}>
          DEMO MEALS · FICTIONAL LOCATIONS · NO LIVE AVAILABILITY
        </div>
        <span className={ui("sr-eyebrow")}>THERE’S A PLACE FOR YOU HERE</span>
        <h1>
          A good meal.
          <br />A warm welcome.
        </h1>

        <TermsNotice className="mb-6 mt-3" />
        <h2 className="mb-6 mt-10 text-3xl md:text-4xl">
          Find a place that works for you.
        </h2>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <section className={ui("sr-panel")}>
            <div className={ui("sr-panel-heading")}>
              <h3>Your preferences</h3>
              <SlidersHorizontal size={20} />
            </div>
            <label>
              Neighborhood or address
              <input
                maxLength={120}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="For example, East Village"
              />
            </label>
            <button
              type="button"
              className={ui("sr-text-link")}
              onClick={() =>
                void locateDevice().catch((e) => setLocationError(e.message))
              }
            >
              Use my location
            </button>
            {locationError && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                {locationError}
              </p>
            )}
            {position && (
              <p className="mt-2 text-xs">
                Meals sorted nearest first using{" "}
                {DEMO_LOCATION_MODE
                  ? "a simulated NYC location"
                  : "your device location"}
                . Area searches match listed names and addresses.
              </p>
            )}
            <AllergenSelect
              value={avoid}
              onChange={(value) => {
                updateFilters();
                setAvoid(value);
              }}
            />
            <label>
              Any other preferences or dietary restrictions?
              <input
                value={diet}
                onChange={(e) => {
                  updateFilters();
                  setDiet(e.target.value);
                }}
                maxLength={500}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && diet.trim().length >= 2 && !busy)
                    void applyPreferences();
                }}
                placeholder="For example, I prefer lower sodium meals"
              />
            </label>
            <div className="my-4 flex flex-wrap gap-3">
              <button
                type="button"
                className={ui("sr-button !whitespace-normal")}
                disabled={busy || diet.trim().length < 2}
                onClick={() => void applyPreferences()}
              >
                {busy
                  ? "Finding suitable meals..."
                  : "Find meals for my preferences"}
              </button>
              {(diet || smart) && (
                <button
                  type="button"
                  className={ui("sr-text-link")}
                  onClick={() => {
                    updateFilters();
                    setDiet("");
                  }}
                >
                  Clear preferences
                </button>
              )}
            </div>
            <p className="mb-3 text-[11px] text-slate-600">
              Sent to Gemini. Leave out names and medical details.
            </p>
            <small>
              Confirm ingredients and cross-contact with center staff.
            </small>
            {busy && (
              <p role="status" className="mt-3 text-xs text-samrita-teal">
                Gemini is checking the meal descriptions...
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-xs text-red-700">
                {error} Results below use allergen filters only; your note has
                not been applied.
              </p>
            )}
            {smart && (
              <p role="status" className="mt-3 text-xs text-samrita-teal">
                Gemini preferences applied. {visibleVenues.length} matching
                sample meals.
                {unknown > 0
                  ? ` ${unknown} could not be confirmed and are hidden.`
                  : ""}
              </p>
            )}
          </section>
          <ConsumerMap venues={visibleVenues} />
          {catalogError && <p role="alert">{catalogError}</p>}
        </div>
        <section className="my-8">
          <h2 className="text-3xl">NYC food assistance directory</h2>
          <p className="my-3 text-sm">
            Public listings; not verified partners. Confirm hours and
            availability. Meal filters apply to demo meals only.
          </p>
          <details>
            <summary className="cursor-pointer font-semibold">
              Browse {directory.filter(inArea).length} publicly listed locations
            </summary>
            <div className="my-5">
              <ConsumerMap
                publicDirectory
                venues={directory.filter(inArea).map((p) => ({
                  ...p,
                  meal: p.serviceType.replaceAll("_", " "),
                  description: p.description,
                  servingTemperature: "unknown",
                  dietaryTags: [],
                  allergens: [],
                  distance: "",
                  hours: "Confirm with provider",
                }))}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {directory.filter(inArea).map((place) => (
                <article
                  className={ui("sr-panel !my-0")}
                  key={place.id + place.serviceType}
                >
                  <h3>{place.name}</h3>
                  <p>{place.address}</p>
                  <p className="text-sm">
                    {place.serviceType.replaceAll("_", " ")} ? Hours unverified
                  </p>
                  <a
                    href={
                      "https://www.google.com/maps/search/?api=1&query=" +
                      encodeURIComponent(place.address)
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View location
                  </a>
                  <p className="mt-3 text-xs">
                    <a href={place.sourceUrl} target="_blank" rel="noreferrer">
                      NYC Open Data source
                    </a>{" "}
                    ? Retrieved{" "}
                    {new Date(place.retrievedAt).toLocaleDateString("en-US")}
                  </p>
                </article>
              ))}
            </div>
          </details>
        </section>
        <div className={ui("sr-panel-heading")}>
          <h2>Around your neighborhood</h2>
          <span>{visibleVenues.length} demo results</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleVenues.map((venue) => (
            <article
              className={ui("sr-panel sr-consumer-venue !my-0")}
              key={venue.name}
            >
              <div className={ui("sr-panel-heading")}>
                <span className={ui("sr-icon-box")}>
                  <Heart size={20} />
                </span>
                <span className={ui("sr-status delivered")}>
                  {position ? "Distance sorted" : venue.distance}
                </span>
              </div>
              <h3>{venue.name}</h3>
              <p>{venue.meal}</p>
              <p className="mt-2 text-xs text-slate-600">{venue.description}</p>
              <span className="my-3 inline-block rounded-xl bg-slate-100 px-3 py-1 text-[10px] font-semibold">
                Served {venue.servingTemperature.replace("_", " ")}
              </span>
              {smart && (
                <p className="mb-3 text-xs text-samrita-teal">
                  {smart.matches.find((match) => match.id === venue.id)?.reason}
                </p>
              )}
              <small>
                <Clock size={13} />
                {venue.hours}
              </small>
              <small>{venue.address}</small>
              <a
                className={ui("sr-text-link")}
                href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}&travelmode=transit`}
                target="_blank"
                rel="noreferrer"
              >
                Transit directions <MapPin size={15} />
              </a>
            </article>
          ))}
        </div>
        {!visibleVenues.length && (
          <p
            role="status"
            className="my-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"
          >
            No sample meals match these preferences with the available
            information. Try changing your preferences; do not relax an allergy
            restriction to get more results.
          </p>
        )}
        <section className="my-8 rounded-2xl bg-samrita-charcoal p-6 text-white shadow-stacked shadow-samrita-iron">
          <h2 className="text-3xl">Already at a place?</h2>

          <Link
            to="/consumer/check-in"
            className={ui("sr-button !whitespace-normal")}
          >
            Already at a place? Check in
          </Link>
        </section>
      </main>
      <PublicFooter />
      <VoiceAssistant
        context={{
          page: "meals",
          allergens: avoid,
          preferences: diet,
          area,
          results: visibleVenues
            .slice(0, 20)
            .map(({ name, meal, address }) => ({ name, meal, address })),
        }}
        onApply={voiceAction}
      />
    </div>
  );
}
