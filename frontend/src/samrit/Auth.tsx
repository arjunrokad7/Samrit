import { ui } from "./design";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { errorMessage, REGION } from "./api";
import type { SessionUser } from "./api";
import { AuthContext, useSession } from "./session";
import { useTheme } from "./Theme";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem("token"));
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      return;
    }
    api
      .get("/auth/profile")
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: (next, token) => {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(next));
          setUser(next);
        },
        signOut: () => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function Brand({ light = false }: { light?: boolean }) {
  const { theme } = useTheme();
  return (
    <Link to="/" className={ui("sr-brand")} aria-label="Samrit home">
      <img
        src={
          light || theme === "dark"
            ? "/brand/samrit-light.png"
            : "/brand/samrit-dark.png"
        }
        alt="Samrit"
        draggable={false}
      />
    </Link>
  );
}
export function AuthPage({ register = false }: { register?: boolean }) {
  const { user, signIn } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api.post(
        register ? "/auth/register" : "/auth/login",
        data,
      );
      signIn(result.data.data.user, result.data.data.token);
      navigate("/dashboard");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={ui("sr-auth")}>
      <aside className={ui("sr-auth-story")}>
        <Brand light />
        <span className={ui("sr-eyebrow")}>
          GOOD FOOD. BETTER DESTINATIONS.
        </span>
        <h1>
          A little surplus.
          <br />A lot of possibility.
        </h1>
        <p>
          From the event floor to a community meal. One accountable handoff at a
          time.
        </p>
        <div className={ui("sr-auth-proof")}>
          <ShieldCheck />
          <div>Every handoff has a story.</div>
        </div>
        <span className={ui("sr-muted")}>
          Serving {REGION.city} · United States
        </span>
      </aside>
      <main className={ui("sr-auth-main")}>
        <Link to="/" className={ui("sr-back")}>
          ← Back to Samrit
        </Link>
        <div className={ui("sr-auth-form")}>
          <span className={ui("sr-eyebrow")}>YOUR NEXT GOOD THING</span>
          {register && null}
          <h2>{register ? "Join the rescue." : "Welcome back."}</h2>

          <form onSubmit={submit}>
            {register && (
              <>
                <label>
                  Full name or organization
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Green Kitchen NYC"
                  />
                </label>
                <label>
                  Your role
                  <select name="role">
                    <option value="DONOR">Event organizer / donor</option>
                    <option value="NGO">Distribution center</option>
                  </select>
                </label>
                <label>
                  US phone number
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+1 (212) 555-0100"
                    autoComplete="tel"
                  />
                </label>
              </>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                minLength={6}
                required
                autoComplete={register ? "new-password" : "current-password"}
              />
            </label>
            {error && (
              <div className={ui("sr-error")} role="alert">
                {error}
              </div>
            )}
            <button className={ui("sr-button sr-wide")} disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p>
            {register ? "Already part of Samrit?" : "New to the community?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}{" "}
              <ArrowUpRight size={14} />
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
