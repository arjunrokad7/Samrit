import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { Brand } from './Auth';
import { ScanField } from './components';
import { PublicFooter, TermsNotice } from './PublicLinks';
import { ui } from './design';

type VisitScan = {
  venueId: string;
  phase: 'entry' | 'exit';
  recordedAt: string;
  method: 'camera' | 'manual';
  location: { latitude: number; longitude: number; accuracyMeters: number; observedAt: string } | null;
  locationStatus: 'captured' | 'unavailable';
};

export function parseVisitCode(value: string, phase: 'entry' | 'exit', venueId?: string) {
  const match = /^samrit:visit:([a-z0-9-]{1,80}):(entry|exit)$/.exec(value.trim());
  if (!match || match[2] !== phase) throw new Error(`Use a valid ${phase} venue code.`);
  if (venueId && match[1] !== venueId) throw new Error('Scan the exit code for the same venue where you checked in.');
  return match[1];
}

async function captureLocation(): Promise<VisitScan['location']> {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => navigator.geolocation.getCurrentPosition(
    ({ coords, timestamp }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracyMeters: coords.accuracy, observedAt: new Date(timestamp).toISOString() }),
    () => resolve(null),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
  ));
}

export default function ConsumerCheckIn() {
  const [entry, setEntry] = useState<VisitScan | null>(null);
  const [exit, setExit] = useState<VisitScan | null>(null);
  const [code, setCode] = useState('');
  const [exitCode, setExitCode] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [details, setDetails] = useState('');
  const [complete, setComplete] = useState(false);
  const [preview, setPreview] = useState<object | null>(null);

  async function record(value: string, phase: 'entry' | 'exit', method: VisitScan['method']) {
    if (busy || (phase === 'entry' ? entry : exit)) return;
    setError('');
    try {
      const venueId = parseVisitCode(value, phase, entry?.venueId);
      const recordedAt = new Date().toISOString();
      if (entry && Date.parse(recordedAt) < Date.parse(entry.recordedAt)) throw new Error('Your device clock changed. Start a new visit.');
      setBusy(true);
      const location = await captureLocation();
      const scan: VisitScan = { venueId, phase, recordedAt, method, location, locationStatus: location ? 'captured' : 'unavailable' };
      if (phase === 'entry') setEntry(scan); else setExit(scan);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not record this code. Please try again.'); }
    finally { setBusy(false); }
  }

  const elapsed = entry && exit ? Math.max(0, Date.parse(exit.recordedAt) - Date.parse(entry.recordedAt)) : null;
  return <div className="min-h-screen bg-slate-50 text-samrita-charcoal">
    <nav className={ui('sr-public-nav')}><Brand /><Link to="/consumer">Back to meals</Link></nav>
    <main className="mx-auto max-w-2xl px-6 py-10">
      <span className={ui('sr-eyebrow')}>YOUR VISIT, YOUR VOICE</span>
      <h1 className="mt-4 text-4xl">A warm welcome starts here.</h1>
      <p className="my-5 text-sm leading-relaxed">Check in at the entrance. After your meal or visit, scan the exit code to unlock your private, anonymous review. You can review a visit even if you did not receive food.</p>
      <TermsNotice />
      <aside className="my-6 rounded-2xl border border-samrita-teal/30 bg-white p-5 text-sm">Frontend preview: codes are not authenticated and no review is saved or sent. Your visit stays in memory until you leave or reload this page. Location is requested at each scan; declining it does not prevent a review. A future submission would include precise location and visit times, which may identify a visit even without a name.</aside>
      <section className={ui('sr-panel')}>
        <h2 className="text-2xl">1. Scan your entry QR</h2>
        {!entry ? <>
          <p className="mt-3 text-sm">Use the venue’s entry QR or enter its printed code.</p>
          <ScanField label="Entry QR code" value={code} onChange={setCode} onScan={(value) => void record(value, 'entry', 'camera')} />
          <button className={ui('sr-button')} disabled={busy || !code.trim()} onClick={() => void record(code, 'entry', 'manual')}>Record entry code</button>
          <details className="mt-4 text-xs"><summary className="cursor-pointer text-samrita-teal">Try a fictional demo visit</summary><p className="my-3">Entry: samrit:visit:east-village:entry<br />Exit: samrit:visit:east-village:exit</p><button className={ui('sr-text-link')} disabled={busy} onClick={() => setCode('samrit:visit:east-village:entry')}>Fill demo entry code</button></details>
        </> : <div role="status" className="mt-3 text-sm"><p>Checked in at {entry.venueId}.</p><p>Entry recorded: {new Date(entry.recordedAt).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} Eastern.</p><p>{entry.location ? `Location accuracy: ±${Math.round(entry.location.accuracyMeters)} m.` : 'Location unavailable; this visit can still be reviewed.'}</p></div>}
      </section>
      {entry && <section className={ui('sr-panel')}>
        <h2 className="text-2xl">2. After your visit</h2>
        <button className={`${ui('sr-button')} mt-5 !whitespace-normal`} aria-expanded={expanded} aria-controls="private-review" onClick={() => setExpanded(!expanded)}>Leave a private anonymous review</button>
        {expanded && <div id="private-review" className="mt-6 border-t border-slate-200 pt-5">
          {!exit ? <><h3 className="text-xl">Scan the venue’s exit QR</h3><ScanField label="Exit QR code" value={exitCode} onChange={setExitCode} onScan={(value) => void record(value, 'exit', 'camera')} /><button className={ui('sr-button')} disabled={busy || !exitCode.trim()} onClick={() => void record(exitCode, 'exit', 'manual')}>Record exit code</button></> : <>
            <p role="status" className="mb-4 text-sm">Exit recorded. Visit duration: {Math.floor((elapsed ?? 0) / 60000)} minutes. {exit.location ? `Exit location accuracy: ±${Math.round(exit.location.accuracyMeters)} m.` : 'Exit location unavailable.'}</p>
            <p className="mb-4 text-xs text-slate-600">Timing measures your recorded visit, not queue time or review reliability. No confidence score is calculated here.</p>
            <fieldset disabled={complete}><legend className="mb-3 font-semibold">How was your experience?</legend><div className="flex flex-wrap gap-3">
              <button className={ui(`sr-button ${sentiment === 'positive' ? '' : 'sr-secondary'}`)} aria-pressed={sentiment === 'positive'} onClick={() => setSentiment('positive')}><ThumbsUp size={18} />Good experience</button>
              <button className={ui(`sr-button ${sentiment === 'negative' ? '' : 'sr-secondary'}`)} aria-pressed={sentiment === 'negative'} onClick={() => setSentiment('negative')}><ThumbsDown size={18} />Needs attention</button>
            </div><label>Optional details<textarea maxLength={3000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tell us about your visit. Please avoid names or identifying details." /></label>
            <p className="mb-4 text-xs text-slate-600">Intended for private central NGO review, never public ratings. This preview does not collect your name or account.</p>
            <button className={ui('sr-button')} disabled={!sentiment} onClick={() => { setPreview({ schemaVersion: 1, entry, exit, elapsedMilliseconds: elapsed, sentiment, details, verification: 'unverified-frontend-preview' }); setComplete(true); }}>Preview private review</button></fieldset>
            {complete && <p role="status" className="mt-4 text-sm">Review preview complete. Nothing has been saved or sent.</p>}
            {preview && <details className="mt-4 text-xs"><summary className="cursor-pointer text-samrita-teal">Preview captured visit data</summary><pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-slate-100 p-4">{JSON.stringify(preview, null, 2)}</pre></details>}
          </>}
        </div>}
      </section>}
      {busy && <p role="status" className="my-4 text-sm">Recording your visit and requesting location…</p>}
      {error && <p role="alert" className="my-4 text-sm text-red-700">{error}</p>}
      {entry && <button className={`${ui('sr-text-link')} my-5`} disabled={busy} onClick={() => { setEntry(null); setExit(null); setCode(''); setExitCode(''); setExpanded(false); setSentiment(''); setDetails(''); setComplete(false); setPreview(null); setError(''); }}>Clear visit and start again</button>}
    </main><PublicFooter />
  </div>;
}
