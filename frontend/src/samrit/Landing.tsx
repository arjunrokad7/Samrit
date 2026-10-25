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
import { PublicFooter, TermsNotice } from './PublicLinks';
export default function Landing() {
  const { user } = useSession();
  return (
    <div className={ui("sr-landing")}>
      <nav className={ui("sr-public-nav")}>
        <Brand />
        <div className="max-sm:shrink-0 max-sm:flex-col max-sm:!items-center max-sm:!gap-3">
          <a href="#how">How it works</a>
          <Link to="/consumer" className={ui('sr-button sr-small !bg-samrita-charcoal !shadow-samrita-iron')}>
            Find a meal <ArrowUpRight size={14} />
          </Link>
          <Link
            className={ui("sr-text-link whitespace-nowrap max-sm:w-full max-sm:justify-center max-sm:border-t max-sm:border-samrita-charcoal/20 max-sm:pt-3")}
            to={user ? "/dashboard" : "/login"}
          >
            {user ? "Open workspace" : "Sign in"}
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>
      <main>
        <section className={ui("sr-hero")} aria-labelledby="meal-first-heading">
          <div>
            <span className={ui("sr-eyebrow")}>
              <span className={ui("sr-live-dot")} /> A PLACE AT THE TABLE, FOR YOU
            </span>
            <h1 id="meal-first-heading">
              Good food.
              <br />A place for you.
              <br />
              <em>A shared table.</em>
            </h1>
            <p>
              Looking for a meal in New York City? Start here. Explore community
              kitchens and dietary preferences, or help make the next meal possible.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-samrita-teal">Looking for food?</p>
                <Link to="/consumer" className={ui('sr-button !min-h-[76px] !w-full !whitespace-normal !bg-samrita-charcoal !px-4 !text-base !shadow-samrita-iron')}>
                  <Utensils size={22} /><span>Find a meal</span><ArrowUpRight size={20} />
                </Link>
                <p className="mb-2 mt-4 text-xs text-slate-600">Explore the meal finder. No account needed.</p>
                <TermsNotice />
              </div>
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-samrita-teal">Want to make it happen?</p>
                <Link to={user ? '/dashboard' : '/register'} className={ui('sr-button sr-secondary !min-h-[76px] !w-full !whitespace-normal !border-2 !border-samrita-teal !px-4 !text-sm !shadow-samrita-teal')}>
                  <Heart size={22} /><span>Be a part of the solution</span><ArrowUpRight size={20} />
                </Link>
                <p className="mt-4 text-xs text-slate-600">Share food, open your kitchen, or support your community.</p>
              </div>
            </div>
            <p className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600"><strong className="font-semibold text-samrita-charcoal">Meal-finder preview:</strong> sample listings only, not live food availability. Confirm with a provider before visiting.</p>
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
                A meal starts with you.
                <br />
                A community makes it happen.
              </h2>
            </div>
            <p>
              Find support first.
              <br />
              Meet the people behind each handoff.
            </p>
          </div>
          <div className={ui("sr-face-grid")}>
            {[
              [
                Heart,
                '01 / OUR NEIGHBORS',
                'A welcoming table.',
                'Start with dietary preferences and transit directions in our meal-finder preview.',
                '/consumer',
              ],
              [
                Utensils,
                "02 / EVENT ORGANIZERS",
                "Plan ahead. Share easily.",
                "Upload a menu, verify ingredients and allergens, then turn leftovers into trackable batches.",
                "/register",
              ],
              [
                Building2,
                "03 / COMMUNITY CENTERS",
                "A kitchen that fits.",
                "Register storage, staffing, hours, and capacity. Verify every arrival with a photo.",
                "/register",
              ],
              [
                Truck,
                "04 / NGO DRIVERS & DISPATCH",
                "Every mile, accounted for.",
                "Your NGO assigns the truck and route. Sign in with issued credentials to record each pickup and delivery.",
                "/login",
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
          <span className={ui("sr-eyebrow")}>YOU BELONG AT THE TABLE.</span>
          <h2>Find a meal. Or help make one.</h2>
          <div className="mt-7 flex flex-wrap gap-4"><Link className={ui('sr-button !bg-white !text-samrita-charcoal !shadow-samrita-charcoal')} to="/consumer">Find a meal <Utensils size={18} /></Link><Link className={ui('sr-button !border-white !bg-transparent !text-white !shadow-samrita-iron')} to={user ? '/dashboard' : '/register'}>Be a part of the solution <ArrowRight size={18} /></Link></div>
        </section>
      </main>
      <PublicFooter showResources />
    </div>
  );
}
