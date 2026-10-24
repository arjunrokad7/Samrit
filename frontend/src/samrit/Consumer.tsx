import { ui } from "./design";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import AllergenSelect from './AllergenSelect';
import { Brand } from "./Auth";
import { PublicFooter, TermsNotice } from './PublicLinks';
const venues = [
  {
    name: "East Village Community Table",
    address: "Demo location · East Village, New York, NY",
    lat: 40.7265,
    lng: -73.9815,
    meal: "Vegetable soup & bread",
    allergens: ["Wheat"],
    distance: "0.6 mi",
    hours: "Today · 11 AM – 2 PM",
  },
  {
    name: "Lower East Side Welcome Kitchen",
    address: "Demo location · Lower East Side, New York, NY",
    lat: 40.7182,
    lng: -73.9874,
    meal: "Rice bowls & seasonal vegetables",
    allergens: ["Soybeans", "Sesame"],
    distance: "1.1 mi",
    hours: "Today · Noon – 3 PM",
  },
  {
    name: "Union Square Shared Table",
    address: "Demo location · Union Square, New York, NY",
    lat: 40.7359,
    lng: -73.9911,
    meal: "Lentil stew & fruit",
    allergens: [],
    distance: "0.8 mi",
    hours: "Today · 10 AM – 1 PM",
  },
];
export default function Consumer() {
  const [avoid, setAvoid] = useState<string[]>([]);
  const [diet, setDiet] = useState("");
  return (
    <div className={ui("sr-consumer")}>
      <nav className={ui("sr-public-nav")}>
        <Brand />
        <div className="max-sm:flex-col max-sm:!gap-2">
        <Link to="/" className="!inline-flex whitespace-nowrap">
          <ArrowLeft size={16} />
          Back home
        </Link>
        <Link to="/consumer/check-in" className={ui('sr-button sr-small !inline-flex')}>Check in here</Link>
        </div>
      </nav>
      <main>
        <div className={ui("sr-demo-label")}>
          CONSUMER CONCEPT · FICTIONAL LOCATIONS · NO LIVE AVAILABILITY
        </div>
        <span className={ui("sr-eyebrow")}>THERE’S A PLACE FOR YOU HERE</span>
        <h1>
          A good meal.
          <br />A warm welcome.
        </h1>
        <p>Explore what a dignified community meal finder could look like.</p>
        <TermsNotice className="mb-6 mt-3" />
        <h2 className="mb-6 mt-10 text-3xl md:text-4xl">Find a place that works for you.</h2>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={ui("sr-panel")}>
          <div className={ui("sr-panel-heading")}>
            <h3>Your preferences</h3>
            <SlidersHorizontal size={20} />
          </div>
          <AllergenSelect value={avoid} onChange={setAvoid} />
          <label>
            Any other preferences or dietary restrictions?
            <input
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              placeholder="For example, I prefer lower sodium meals"
            />
          </label>
          <small>
            Allergen selection filters sample dishes only. Custom notes are a
            concept preview and do not apply a filter. Confirm ingredients and
            cross-contact with center staff.
          </small>
        </section>
        <div className={ui("sr-consumer-map !my-0 lg:!h-[360px]")}>
          <MapPin size={33} />
          <strong>New York City</strong>
          <span>Illustrative neighborhood view</span>
          <div className={ui("sr-demo-pin p1")}>
            <Heart size={16} />
          </div>
          <div className={ui("sr-demo-pin p2")}>
            <Heart size={16} />
          </div>
          <div className={ui("sr-demo-pin p3")}>
            <Heart size={16} />
          </div>
        </div>
        </div>
        <div className={ui("sr-panel-heading")}>
          <h2>Around your neighborhood</h2>
          <span>Demo results</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {venues
          .filter((venue) => !avoid.some((allergen) => venue.allergens.includes(allergen)))
          .map((venue) => (
            <article
              className={ui("sr-panel sr-consumer-venue !my-0")}
              key={venue.name}
            >
              <div className={ui("sr-panel-heading")}>
                <span className={ui("sr-icon-box")}>
                  <Heart size={20} />
                </span>
                <span className={ui("sr-status delivered")}>
                  {venue.distance}
                </span>
              </div>
              <h3>{venue.name}</h3>
              <p>{venue.meal}</p>
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
                Preview transit directions <MapPin size={15} />
              </a>
            </article>
          ))}
        </div>
        <section className="my-8 rounded-2xl bg-samrita-charcoal p-6 text-white shadow-stacked shadow-samrita-iron">
          <h2 className="text-3xl">Already at a place?</h2>
          <p className="my-4 text-sm">Check in when you arrive. After your visit, share a private, anonymous review.</p>
          <Link to="/consumer/check-in" className={ui('sr-button !whitespace-normal')}>Already at a place? Check in</Link>
          <p className="mt-4 text-xs text-white/80">Preview workflow only. Nothing is sent to a venue or NGO.</p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
