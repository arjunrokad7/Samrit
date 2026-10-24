import { Sheet } from "./Sheet";
import { ui } from "./design";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MapPin,
  ThumbsDown,
  ThumbsUp,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { ALLERGENS } from "./api";
import { Brand } from "./Auth";
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
  const [avoid, setAvoid] = useState("");
  const [diet, setDiet] = useState("");
  const [review, setReview] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [sent, setSent] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  return (
    <div className={ui("sr-consumer")}>
      <nav className={ui("sr-public-nav")}>
        <Brand />
        <Link to="/">
          <ArrowLeft size={16} />
          Back home
        </Link>
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
        <section className={ui("sr-panel")}>
          <div className={ui("sr-panel-heading")}>
            <h3>Your preferences</h3>
            <SlidersHorizontal size={20} />
          </div>
          <label>
            Avoid a major allergen
            <select value={avoid} onChange={(e) => setAvoid(e.target.value)}>
              <option value="">Show all demo meals</option>
              {ALLERGENS.map((allergen) => (
                <option key={allergen}>{allergen}</option>
              ))}
            </select>
          </label>
          <label>
            Anything else we should know?
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
        <div className={ui("sr-consumer-map")}>
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
        <div className={ui("sr-panel-heading")}>
          <h2>Around your neighborhood</h2>
          <span>Demo results</span>
        </div>
        {venues
          .filter((venue) => !avoid || !venue.allergens.includes(avoid))
          .map((venue) => (
            <article
              className={ui("sr-panel sr-consumer-venue")}
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
        <section className={ui("sr-panel")}>
          <span className={ui("sr-eyebrow")}>YOUR EXPERIENCE MATTERS</span>
          <h3>Tell us about your visit.</h3>
          <p>Feedback would go privately to the central NGO.</p>
          <button
            type="button"
            className={ui("sr-button")}
            onClick={() => setFeedbackOpen(true)}
          >
            Leave feedback
          </button>
          {feedbackOpen && (
            <Sheet
              title="Tell us about your visit"
              onClose={() => setFeedbackOpen(false)}
            >
              <div className={ui("sr-choice-row")}>
                <button
                  className={ui(
                    `sr-button ${sentiment === "positive" ? "" : "sr-secondary"}`,
                  )}
                  onClick={() => setSentiment("positive")}
                  aria-pressed={sentiment === "positive"}
                >
                  <ThumbsUp size={18} />
                  Good experience
                </button>
                <button
                  className={ui(
                    `sr-button ${sentiment === "negative" ? "" : "sr-secondary"}`,
                  )}
                  onClick={() => setSentiment("negative")}
                  aria-pressed={sentiment === "negative"}
                >
                  <ThumbsDown size={18} />
                  Needs attention
                </button>
              </div>
              <label>
                Optional details
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
              </label>
              <button
                className={ui("sr-button")}
                disabled={!sentiment}
                onClick={() => setSent(true)}
              >
                Preview private feedback
              </button>
              {sent && (
                <p role="status" className={ui("sr-success")}>
                  Preview complete. This concept does not save or send reviews.
                </p>
              )}
            </Sheet>
          )}
        </section>
      </main>
      <footer className={ui("sr-footer")}>Samrit · Consumer concept</footer>
    </div>
  );
}
