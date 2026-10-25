import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, Square, Volume2, VolumeX, X } from "lucide-react";
import type {
  VoiceAction,
  VoiceContext,
  VoiceReply,
} from "../../../shared/types/voice-assistant";
import { availableVoiceOptions } from "../../../shared/types/voice-assistant";
import { ui } from "./design";
import { DEMO_LOCATION_MODE } from './location';

const base =
  (import.meta.env.VITE_API_URL || "http://localhost:3000") +
  "/api/consumer/voice/";
export default function VoiceAssistant({
  context,
  onApply,
}: {
  context: VoiceContext;
  onApply: (action: VoiceAction) => Promise<string> | string;
}) {
  const [open, setOpen] = useState(false),
    [consent, setConsent] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [text, setText] = useState(""),
    [pending, setPending] = useState<VoiceAction | null>(null);
  const [busy, setBusy] = useState(false),
    [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false),
    [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null),
    audioUrl = useRef("");
  const request = useRef<AbortController | null>(null),
    timer = useRef<ReturnType<typeof setTimeout>>();
  const generation = useRef(0),
    bottom = useRef<HTMLDivElement>(null);
  const proposedContext = useRef("");
  const mutedRef = useRef(muted);
  const live = useRef({ context, onApply, messages });
  useEffect(() => {
    live.current = { context, onApply, messages };
  }, [context, onApply, messages]);
  const stopAudio = useCallback(() => {
    audio.current?.pause();
    audio.current = null;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = "";
  }, []);
  const cleanup = useCallback(() => {
    generation.current++;
    request.current?.abort();
    if (recorder.current?.state === "recording") {
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    stream.current?.getTracks().forEach((track) => track.stop());
    clearTimeout(timer.current);
    stopAudio();
  }, [stopAudio]);
  useEffect(() => () => cleanup(), [cleanup]);
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages, pending, error]);
  function close() {
    cleanup();
    setOpen(false);
    setBusy(false);
    setRecording(false);
  }
  async function post(path: string, body: unknown, signal: AbortSignal) {
    const res = await fetch(base + path, {
      method: "POST",
      signal,
      ...(body instanceof FormData
        ? { body }
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw Error(
        result.message ||
          result.error ||
          "The assistant is unavailable. Use the page controls or try again.",
      );
    }
    return res;
  }
  async function speak(reply: string, signal: AbortSignal, epoch: number) {
    if (mutedRef.current) return;
    try {
      const res = await post("speak", { text: reply }, signal);
      const blob = await res.blob();
      if (epoch !== generation.current || mutedRef.current) return;
      stopAudio();
      audioUrl.current = URL.createObjectURL(blob);
      audio.current = new Audio(audioUrl.current);
      await audio.current.play();
    } catch {
      if (!signal.aborted)
        setError("Spoken reply unavailable. The text reply is shown above.");
    }
  }
  async function confirm() {
    if (!pending || busy || recording) return;
    if (proposedContext.current !== JSON.stringify(context)) {
      setPending(null);
      setError(
        "The page changed since this suggestion. Ask again using the current selections.",
      );
      return;
    }
    const action = pending;
    setPending(null);
    setBusy(true);
    setError("");
    stopAudio();
    try {
      const reply = await onApply(action);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply this action.");
    } finally {
      setBusy(false);
    }
  }
  async function sendMessage(message: string, source: "text" | "voice") {
    setBusy(true);
    setError("");
    setPending(null);
    stopAudio();
    setText("");
    const snapshot = live.current.context;
    const history = live.current.messages.slice(-10);
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    const controller = new AbortController();
    request.current = controller;
    const epoch = generation.current;
    try {
      const data: VoiceReply = (
        await (
          await post(
            "turn",
            { message, source, history, context: snapshot },
            controller.signal,
          )
        ).json()
      ).data;
      if (epoch !== generation.current) return;
      if (JSON.stringify(snapshot) !== JSON.stringify(live.current.context))
        throw Error(
          "The page changed while I was listening. Please repeat your request.",
        );
      let reply = data.reply;
      const automatic =
        data.action &&
        [
          "check_in",
          "back_meals",
          "scan",
          "finish",
          "start_review",
          "review",
          "submit_review",
        ].includes(data.action.type);
      if (automatic && data.action)
        reply = await live.current.onApply(data.action);
      if (epoch !== generation.current) return;
      setMessages((prev) => {
        const next = [...prev];
        if (
          source === "voice" &&
          data.correctedTranscript?.trim() &&
          next[next.length - 1]?.role === "user"
        )
          next[next.length - 1] = {
            role: "user",
            text: data.correctedTranscript,
          };
        return [...next, { role: "assistant", text: reply }];
      });
      proposedContext.current = JSON.stringify(snapshot);
      setPending(automatic ? null : data.action);
      await speak(reply, controller.signal, epoch);
    } catch (e) {
      if (!controller.signal.aborted) {
        setText(message);
        setError(e instanceof Error ? e.message : "Could not send message.");
      }
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  }
  async function send() {
    if (!text.trim() || busy || recording || !consent) return;
    await sendMessage(text.trim(), "text");
  }
  async function record() {
    if (busy || !consent) return;
    if (recording) {
      recorder.current?.stop();
      return;
    }
    setError("");
    stopAudio();
    const epoch = generation.current;
    setBusy(true);
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw Error(
          "Recording needs a supported browser on HTTPS or localhost. You can type instead.",
        );
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (epoch !== generation.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const rec = new MediaRecorder(
        media,
        mime ? { mimeType: mime } : undefined,
      );
      recorder.current = rec;
      const chunks: BlobPart[] = [];
      let size = 0;
      rec.ondataavailable = (event) => {
        chunks.push(event.data);
        size += event.data.size;
        if (size > 4 * 1024 * 1024 && rec.state === "recording") rec.stop();
      };
      rec.onstop = async () => {
        clearTimeout(timer.current);
        media.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setBusy(true);
        const controller = new AbortController();
        request.current = controller;
        try {
          const form = new FormData();
          const type = rec.mimeType.split(";")[0] || "audio/webm";
          form.append("audio", new Blob(chunks, { type }), "recording");
          const data = (
            await (await post("transcribe", form, controller.signal)).json()
          ).data;
          if (epoch === generation.current)
            await sendMessage(data.text, "voice");
        } catch (e) {
          if (!controller.signal.aborted)
            setError(e instanceof Error ? e.message : "Transcription failed.");
        } finally {
          if (epoch === generation.current) setBusy(false);
        }
      };
      rec.start(1000);
      setRecording(true);
      timer.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 30000);
    } catch (e) {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (epoch === generation.current)
        setError(
          e instanceof Error
            ? e.message
            : "Microphone permission was denied. You can type instead.",
        );
    } finally {
      if (epoch === generation.current) setBusy(false);
    }
  }
  return (
    <>
      {!open && (
        <button
          className={`${ui("sr-button")} fixed bottom-20 right-5 z-[1200] !rounded-full shadow-lg`}
          onClick={() => setOpen(true)}
          aria-label="Open meal voice assistant"
        >
          <MessageCircle size={20} />
          Meal assistant
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-label="Meal voice assistant"
          className="fixed bottom-20 right-3 z-[1250] flex max-h-[min(640px,75dvh)] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white text-samrita-charcoal shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-slate-200 p-4">
            <strong>Meal assistant</strong>
            <div className="flex gap-2">
              <button
                aria-label={
                  muted ? "Enable spoken replies" : "Mute spoken replies"
                }
                onClick={() => {
                  stopAudio();
                  mutedRef.current = !muted;
                  setMuted(!muted);
                }}
                className="rounded-lg p-2 text-slate-600"
              >
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button
                aria-label="Close meal assistant"
                onClick={close}
                className="rounded-lg p-2 text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
          </header>
          {!consent ? (
            <div className="space-y-4 p-4 text-sm">
              <p>
                Optional voice and text help for meals, preferences, check-in
                and private reviews.
              </p>
              <p>
                Recordings go to ElevenLabs for transcription. Chat, page
                filters and review drafts go to Gemini; replies go to ElevenLabs
                for speech. Avoid names and medical details. Your device
                permissions stay under your control. Stopping a recording sends
                it automatically. Gemini lightly corrects transcription errors
                before interpreting your request.
              </p>
              <button
                className={ui("sr-button")}
                onClick={() => setConsent(true)}
              >
                Enable assistant
              </button>
              <button className={`${ui("sr-text-link")} block`} onClick={close}>
                Keep using page controls
              </button>
            </div>
          ) : (
            <>
              <div
                className="min-h-0 flex-1 overflow-y-auto p-4 text-sm"
                role="log"
                aria-live="polite"
              >
                <p className="mb-3 text-xs">
                  Available here: {availableVoiceOptions(context).join(", ")}.
                </p>
                {!messages.length && (
                  <p>
                    How can I help? Try “Avoid peanuts and find hot meals in
                    East Village” or “I’m at a venue and want to check in.”
                  </p>
                )}
                {messages.map((message, i) => (
                  <p
                    key={i}
                    className={`my-3 whitespace-pre-wrap break-words rounded-xl p-3 ${message.role === "user" ? "bg-samrita-teal/10" : "bg-slate-50"}`}
                  >
                    <strong>
                      {message.role === "user" ? "You" : "Samrit"}:{" "}
                    </strong>
                    {message.text}
                  </p>
                ))}
                {pending && (
                  <div className="rounded-xl border border-samrita-teal p-3">
                    <strong>Review proposed action</strong>
                    {pending.type === "filters" && (
                      <p className="my-2">
                        Avoid:{" "}
                        {pending.allergens.join(", ") ||
                          "No allergens selected"}
                        <br />
                        Preferences: {pending.preferences || "None"}
                        <br />
                        Area: {pending.area || "All listed areas"}
                      </p>
                    )}
                    {pending.type === "review" && (
                      <p className="my-2">
                        {pending.sentiment === "positive"
                          ? "Good experience"
                          : "Needs attention"}
                        : {pending.details}
                      </p>
                    )}
                    {!["filters", "review"].includes(pending.type) && (
                      <p className="my-2">
                        {
                          (
                            {
                              location:
                                DEMO_LOCATION_MODE ? "Use sample NYC coordinates to sort meals. GPS is simulated." : "Use your device location to sort meals by distance.",
                              check_in: "Open venue check-in.",
                              scan: "Open the camera to scan the venue QR. Scanning checks you in and may request optional arrival location.",
                              finish: "Record the end of this visit.",
                              submit_review:
                                "Submit your current review privately to the central NGO.",
                            } as Record<string, string>
                          )[pending.type]
                        }
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        disabled={busy || recording}
                        onClick={() => void confirm()}
                        className={ui("sr-button sr-small")}
                      >
                        Confirm action
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setPending(null)}
                        className={ui("sr-text-link")}
                      >
                        Cancel action
                      </button>
                    </div>
                  </div>
                )}
                {busy && <p role="status">Working…</p>}
                {error && (
                  <p role="alert" className="my-3 text-red-700">
                    {error}
                  </p>
                )}
                <div ref={bottom} />
              </div>
              <form
                className="border-t border-slate-200 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <label className="text-xs">
                  Message or editable transcript
                  <textarea
                    aria-label="Assistant message"
                    rows={2}
                    maxLength={3000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm"
                  />
                </label>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    aria-pressed={recording}
                    className={ui("sr-button sr-secondary sr-small")}
                    onClick={() => void record()}
                  >
                    {recording ? <Square size={16} /> : <Mic size={16} />}
                    {recording ? "Stop recording" : "Record"}
                  </button>
                  <button
                    disabled={busy || recording || !text.trim()}
                    className={ui("sr-button sr-small")}
                  >
                    Send
                  </button>
                </div>
                <p className="mt-2 text-xs">
                  {recording
                    ? "Recording · stops after 30 seconds"
                    : "Stop recording to send automatically. Say “submit my review” when ready; filter changes require confirmation."}
                </p>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}
