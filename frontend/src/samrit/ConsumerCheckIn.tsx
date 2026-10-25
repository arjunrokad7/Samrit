import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Brand } from "./Auth";
import { ScanField } from "./components";
import { PublicFooter, TermsNotice } from "./PublicLinks";
import { ui } from "./design";
import VoiceAssistant from "./VoiceAssistant";
import { DEMO_LOCATION_MODE, demoCoordinates } from "./location";
import type { VoiceAction } from "../../../shared/types/voice-assistant";
type Coordinates = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};
type Visit = {
  visitId: string;
  secret: string;
  venueId: string;
  recordedAt: string;
  location: Coordinates | null;
};
async function api(path: string, body: unknown) {
  const response = await fetch(
    (import.meta.env.VITE_API_URL || "http://localhost:3000") +
      "/api/consumer/visits/" +
      path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const result = await response.json();
  if (!response.ok)
    throw Error(result.message || result.error || "Please try again.");
  return result.data;
}
async function location(): Promise<Coordinates | null> {
  if (DEMO_LOCATION_MODE) {
    const { lat, lng } = demoCoordinates();
    return { latitude: lat, longitude: lng, accuracyMeters: 100000 };
  }
  if (!navigator.geolocation) return null;
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    ),
  );
}
export default function ConsumerCheckIn() {
  const navigate = useNavigate();
  const [scanRequest, setScanRequest] = useState(0);
  const [visit, setVisit] = useState<Visit | null>(null),
    [code, setCode] = useState(""),
    [finishedAt, setFinishedAt] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sentiment, setSentiment] = useState(""),
    [details, setDetails] = useState(""),
    [complete, setComplete] = useState(false);
  async function checkIn(value: string, method: "manual" | "camera") {
    if (busy || visit) return;
    setBusy(true);
    setError("");
    try {
      const coordinates = await location();
      const data = await api("scan", {
        code: value.trim(),
        phase: "entry",
        method,
        deviceRecordedAt: new Date().toISOString(),
        location: coordinates,
      });
      setVisit({ ...data, location: coordinates });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (!visit || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api("finish", {
        visitId: visit.visitId,
        secret: visit.secret,
      });
      setFinishedAt(data.finishedAt);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish visit.");
    } finally {
      setBusy(false);
    }
    return false;
  }
  async function submit() {
    if (!visit || !finishedAt || busy) return;
    setBusy(true);
    setError("");
    try {
      await api("review", {
        visitId: visit.visitId,
        secret: visit.secret,
        sentiment,
        rawText: details,
      });
      setComplete(true);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Review could not be submitted.",
      );
    } finally {
      setBusy(false);
    }
    return false;
  }
  async function voiceAction(action: VoiceAction) {
    if (action.type === "back_meals") {
      navigate("/consumer");
      return "Find a Meal opened.";
    }
    if (busy)
      throw Error("Please wait for the current visit action to finish.");
    if (action.type === "scan" && !visit) {
      setScanRequest((n) => n + 1);
      return "Camera opened. Point it at the venue check-in QR, or enter its printed ID on the page.";
    }
    if (action.type === "finish" && visit && !finishedAt) {
      if (!(await finish()))
        throw Error(
          "Visit could not be finished. Check the page error and retry.",
        );
      return "Visit finished. You can now draft your private review.";
    }
    if (action.type === "start_review" && visit && !complete) {
      if (!finishedAt && !(await finish()))
        throw Error(
          "Visit could not be finished. Please retry before leaving feedback.",
        );
      if (action.sentiment) setSentiment(action.sentiment);
      if (action.details) setDetails(action.details);
      return action.sentiment
        ? "Your review is drafted. Say ‘submit my review’ to send it, or tell me what to change."
        : "Your review form is open. How was your visit: a good experience, or something that needs attention?";
    }
    if (action.type === "review" && finishedAt && !complete) {
      setSentiment(action.sentiment);
      setDetails(action.details);
      return "Review drafted on the page. It has not been submitted.";
    }
    if (
      action.type === "submit_review" &&
      finishedAt &&
      sentiment &&
      !complete
    ) {
      if (!(await submit()))
        throw Error(
          "Your review was not submitted. Check the page error and retry.",
        );
      return "Your private review was received by the central NGO.";
    }
    throw Error(
      "That action is unavailable at this stage. Check in, finish your visit, then draft and submit your review.",
    );
  }
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-samrita-charcoal">
      <nav className={`${ui("sr-public-nav")} w-full shrink-0`}>
        <Brand />
        <Link to="/consumer">Back to meals</Link>
      </nav>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <span className={ui("sr-eyebrow")}>YOUR VISIT, YOUR VOICE</span>
        <h1 className="mt-4 text-4xl">A warm welcome starts here.</h1>

        <TermsNotice />
        <aside className="my-6 rounded-2xl border border-samrita-teal/30 bg-white p-5 text-sm">
          Private to the central NGO. Arrival GPS is optional; no exit GPS.
          Visit timing is approximate. Gemini receives your review and visit
          evidence. Precise times and location may identify a visit. Keep this
          page open until you finish.
        </aside>
        <section className={ui("sr-panel")}>
          <h2 className="text-2xl">1. Scan the venue check-in QR</h2>
          {!visit ? (
            <>
              <ScanField
                openRequest={scanRequest}
                label="Venue check-in QR code"
                value={code}
                onChange={setCode}
                onScan={(value) => void checkIn(value, "camera")}
              />
              <button
                className={ui("sr-button")}
                disabled={busy || !code.trim()}
                onClick={() => void checkIn(code, "manual")}
              >
                Check in
              </button>
            </>
          ) : (
            <div role="status" className="mt-3 text-sm">
              <p>You're checked in.</p>
              <p>
                Arrival recorded:{" "}
                {new Date(visit.recordedAt).toLocaleTimeString("en-US", {
                  timeZone: "America/New_York",
                })}{" "}
                Eastern.
              </p>
              <p>
                {DEMO_LOCATION_MODE
                  ? "Demo location recorded; GPS proximity is not verified."
                  : visit.location
                    ? `Location accuracy: +/-${Math.round(visit.location.accuracyMeters)} m.`
                    : "Location unavailable; this visit can still be reviewed."}
              </p>
            </div>
          )}
        </section>
        {visit && (
          <section className={ui("sr-panel")}>
            <h2 className="text-2xl">2. After your visit</h2>
            {!finishedAt ? (
              <>
                <button
                  className={ui("sr-button !whitespace-normal")}
                  disabled={busy}
                  onClick={() => void finish()}
                >
                  Finish visit and leave a review
                </button>
              </>
            ) : (
              <>
                <p role="status" className="my-4 text-sm">
                  Visit finished. Approximate time since check-in:{" "}
                  {Math.max(
                    0,
                    Math.floor(
                      (Date.parse(finishedAt) - Date.parse(visit.recordedAt)) /
                        60000,
                    ),
                  )}{" "}
                  minutes. This records when you pressed Finish, not a verified
                  departure or queue time.
                </p>
                <fieldset disabled={complete || busy}>
                  <legend className="mb-3 font-semibold">
                    Leave a private anonymous review
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className={ui(
                        `sr-button ${sentiment === "positive" ? "" : "sr-secondary"}`,
                      )}
                      aria-pressed={sentiment === "positive"}
                      onClick={() => setSentiment("positive")}
                    >
                      <ThumbsUp size={18} />
                      Good experience
                    </button>
                    <button
                      className={ui(
                        `sr-button ${sentiment === "negative" ? "" : "sr-secondary"}`,
                      )}
                      aria-pressed={sentiment === "negative"}
                      onClick={() => setSentiment("negative")}
                    >
                      <ThumbsDown size={18} />
                      Needs attention
                    </button>
                  </div>
                  <label>
                    Optional details
                    <textarea
                      maxLength={3000}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Tell us about your visit. Please avoid names or identifying details."
                    />
                  </label>
                  <p className="mb-4 text-xs text-slate-600">
                    Private central NGO review, never public ratings. No name or
                    account is required.
                  </p>
                  <button
                    className={ui("sr-button")}
                    disabled={!sentiment || busy}
                    onClick={() => void submit()}
                  >
                    Submit private review
                  </button>
                </fieldset>
              </>
            )}
            {complete && (
              <p role="status" className="mt-4 text-sm">
                Your private review was received for central NGO review.
              </p>
            )}
          </section>
        )}
        {busy && (
          <p role="status" className="my-4 text-sm">
            Saving your visit...
          </p>
        )}
        {error && (
          <p role="alert" className="my-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {visit && (
          <button
            className={`${ui("sr-text-link")} my-5`}
            disabled={busy}
            onClick={() => {
              setVisit(null);
              setFinishedAt("");
              setCode("");
              setSentiment("");
              setDetails("");
              setComplete(false);
              setError("");
            }}
          >
            Start another visit
          </button>
        )}
      </main>
      <PublicFooter />
      <VoiceAssistant
        context={{
          page: "visit",
          checkedIn: !!visit,
          finished: !!finishedAt,
          complete,
          sentiment,
          details,
        }}
        onApply={voiceAction}
      />
    </div>
  );
}
