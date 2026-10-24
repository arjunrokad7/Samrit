import { ui } from "./design";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  MapPin,
  ScanLine,
  Truck,
  Utensils,
  ShieldCheck,
  Heart,
  Building2,
} from "lucide-react";
import { Brand } from "./Auth";
import { useSession } from "./session";
import { REGION } from "./api";
export default function Landing() {
  const { user } = useSession();
  return (
    <div className={ui("sr-landing")}>
      <nav className={ui("sr-public-nav")}>
        <Brand />
        <div>
          <a href="#how">How it works</a>
          <Link to="/consumer">
            Find a meal <ArrowUpRight size={14} />
          </Link>
          <Link
            className={ui("sr-button sr-small")}
            to={user ? "/dashboard" : "/login"}
          >
            {user ? "Open workspace" : "Sign in"}
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>
      <main>
        <section className={ui("sr-hero")}>
          <div>
            <span className={ui("sr-eyebrow")}>
              <span className={ui("sr-live-dot")} /> FOOD RECOVERY, WITH
              FOLLOW-THROUGH
            </span>
            <h1>
              Good food.
              <br />A second chance.
              <br />
              <em>A shared table.</em>
            </h1>
            <p>
              We connect event organizers, volunteer drivers, and community
              kitchens to turn surplus into something that matters.
            </p>
            <div className={ui("sr-hero-actions")}>
              <Link
                className={ui("sr-button")}
                to={user ? "/dashboard" : "/register"}
              >
                Be part of the next meal
                <ArrowUpRight size={20} />
              </Link>
              <a className={ui("sr-text-link")} href="#how">
                See how it works <ArrowRight size={17} />
              </a>
            </div>
            <div className={ui("sr-region")}>
              <MapPin size={16} />
              Made for {REGION.city}
              <span>US · Eastern time · Miles</span>
            </div>
          </div>
          <div className={ui("sr-hero-visual")}>
            <div className={ui("sr-orbit sr-orbit-one")} />
            <div className={ui("sr-orbit sr-orbit-two")} />
            <div className={ui("sr-food-illustration")}>
              <img
                src="/brand/logoleaf.png"
                alt=""
                className={ui(
                  "absolute -top-16 h-[360px] w-auto -translate-x-5 rotate-6 sm:h-[400px]",
                )}
              />
            </div>
            <div className={ui("sr-floating sr-floating-one")}>
              <span className={ui("sr-icon-box")}>
                <Utensils size={20} />
              </span>
              <div>
                From an event<small>Fresh surplus, ready to share</small>
              </div>
              <span className={ui("sr-status pending")}>01</span>
            </div>
            <div className={ui("sr-floating sr-floating-two")}>
              <span className={ui("sr-icon-box coral")}>
                <Heart size={20} />
              </span>
              <div>
                To a community<small>Handled with care, all the way</small>
              </div>
              <ShieldCheck size={21} />
            </div>
            <span className={ui("sr-visual-caption")}>
              LESS WASTE. MORE WELCOME.
            </span>
          </div>
        </section>
        <section className={ui("sr-principles")}>
          <span>
            <Camera />
            Proof at every handoff
          </span>
          <span>
            <ScanLine />
            One batch, one tracking sticker
          </span>
          <span>
            <Building2 />
            The right kitchen for the food
          </span>
          <span>
            <ShieldCheck />
            Quality feedback stays private
          </span>
        </section>
        <section id="how" className={ui("sr-how")}>
          <div className={ui("sr-section-heading")}>
            <div>
              <span className={ui("sr-eyebrow")}>ONE CONNECTED JOURNEY</span>
              <h2>
                Four perspectives.
                <br />
                One shared purpose.
              </h2>
            </div>
            <p>
              Less coordination for the people giving.
              <br />
              More dignity for the people receiving.
            </p>
          </div>
          <div className={ui("sr-face-grid")}>
            {[
              [
                Utensils,
                "01 / EVENT ORGANIZERS",
                "Plan ahead. Share easily.",
                "Upload a menu, verify ingredients and allergens, then turn leftovers into trackable batches.",
                "/register",
              ],
              [
                Building2,
                "02 / COMMUNITY CENTERS",
                "A kitchen that fits.",
                "Register storage, staffing, hours, and capacity. Verify every arrival with a photo.",
                "/register",
              ],
              [
                Truck,
                "03 / DRIVERS & DISPATCH",
                "Every mile, accounted for.",
                "Match equipment and capacity. Scan, photograph, and track the food from pickup to arrival.",
                "/login",
              ],
              [
                Heart,
                "04 / OUR NEIGHBORS",
                "Find a welcoming table.",
                "Explore the consumer concept: dietary preferences, nearby centers, and transit directions.",
                "/consumer",
              ],
            ].map(([Icon, label, title, body, href]) => {
              const FaceIcon = Icon as typeof Heart;
              return (
                <Link
                  to={href as string}
                  className={ui("sr-face-card")}
                  key={label as string}
                >
                  <FaceIcon size={25} />
                  <span className={ui("sr-eyebrow")}>{label as string}</span>
                  <h3>{title as string}</h3>
                  <p>{body as string}</p>
                  <ArrowUpRight size={21} />
                </Link>
              );
            })}
          </div>
        </section>
        <section className={ui("sr-bottom-cta")}>
          <span className={ui("sr-eyebrow")}>FOOD IS A CONNECTION.</span>
          <h2>Let’s keep it moving.</h2>
          <Link className={ui("sr-button")} to="/register">
            Join the community <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className={ui("sr-footer")}>
        <Brand light />
        <span>From surplus to shared possibility.</span>
        <span>Samrit · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
