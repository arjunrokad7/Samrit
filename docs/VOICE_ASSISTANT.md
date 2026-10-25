# Optional meal voice assistant

Find a Meal and venue check-in have a floating **Meal assistant**. All existing manual controls remain available. Open the assistant, review the provider notice and choose **Enable assistant**. Choose **Record**, speak, then **Stop recording**: the recording is transcribed and sent automatically. Gemini lightly corrects spelling/punctuation while preserving meaning, negation, allergens and sentiment, then interprets the request in the same response. Corrected wording appears in the chat. Text-only chat still uses **Send**; mute spoken replies at any time.

## Supported tasks

- “Avoid peanuts and find hot meals in East Village”: proposes a full allergen, preference and area filter. Confirm before applying. Existing Gemini meal matching is reused; failed AI matching is reported and never presented as successful.
- “Find meals near me”: proposes device GPS access and sorts sample meal cards nearest first. Device coordinates stay in the browser; only the displayed result names/addresses enter assistant context.
- “I want to check in”: opens the existing check-in page. Open its assistant to continue; chat history does not cross page navigation.
- “Scan the venue QR”: opens the existing camera. Point it at the actual code. Camera scanning performs the existing arrival check-in, with optional arrival GPS. Printed-code entry remains available. No exit QR is needed.
- “Finish my visit”: records visit completion, then unlocks feedback.
- “I want to leave a review”: after check-in, automatically finishes the visit and opens feedback. The user does not need to name or press the Finish button first. If the request includes feedback, it is drafted in the form; otherwise the assistant asks how the visit went. A failed finish request prevents drafting.
- “The meal was warm and staff were helpful”: drafts the actual feedback. Review/edit sentiment and wording on the page. Say “Submit my review” to send it privately to the central NGO directly, without another question or chat button. A clear “yes” to a submission invitation also submits. Already submitted visits receive an acknowledgement rather than a second submission.
- Unrelated requests receive “Sorry, I can’t help with that” and a list of available operations for the current page and visit stage.

Navigation, scanner opening, visit completion and review drafting execute from the user's request. Allergen/preference filter changes and device location retain explicit confirmation. A request to submit is sufficient authorization for a ready review; a draft alone is never submitted. Missing sentiment prompts only for that information. A change to page selections invalidates an older suggestion. Recording is push-to-talk, capped at 30 seconds and 5 MB; it does not continuously listen. Close stops recording, audio playback and pending provider requests. Microphone/camera access needs HTTPS or localhost. Browser denial leaves typed/manual paths available.

## Configuration and architecture

Set `ELEVENLABS_API_KEY` in the private backend environment and optionally `ELEVENLABS_VOICE_ID`. The supplied default voice is `JBFqnCBsd6RMkjVDRZzb`. Existing `GEMINI_API_KEY` and `GEMINI_MODEL` power dialogue and meal matching. Restart the backend after changing configuration and apply migration `005_voice_assistant.sql` using `npm run db:migrate`. No new package is required.

Browser MediaRecorder → backend `/api/consumer/voice/transcribe` → ElevenLabs Scribe v2 → automatic `/api/consumer/voice/turn` → Gemini transcript correction, scope check and validated action → existing page operation (with confirmation where required). `/api/consumer/voice/speak` uses ElevenLabs multilingual v2 to speak the assistant reply. Compound review preparation follows finish → open feedback → draft; actual submission remains separate.

Public voice routes validate input, cap upload/message/history size, limit provider concurrency and rate-limit requests by IP. They never execute arbitrary model-generated code, URLs or database commands. API keys stay server-side. The assistant context excludes visit secrets, visit IDs, QR values and raw GPS. Review text and food preferences do reach Gemini; spoken replies and recorded audio reach ElevenLabs. The app does not save recordings or transcripts. Gemini job audits retain an input hash and proposed action type rather than conversation content. Provider-side retention is governed by the provider account settings; this integration does not claim zero retention.

The location text field matches listed names/addresses, not an external geocoder. Meal results remain fictional demo offers, and public NYC directory entries remain unverified. Voice does not connect delivery intake to public meal publication, verify food safety, or infer nutritional facts absent from meal metadata. Phone users still need to position the camera physically for QR scans.

## Validation

Automated backend tests cover schema rejection, no arbitrary tools or visit secrets, provider request format, provider failures, rate limits, direct submission intent, missing sentiment and repeat requests after completion. Frontend tests cover opt-in, filter confirmation, stale filter proposals, submission without an extra click and recording fallback. Existing search and single-QR visit tests remain applicable.

With the app running, `npm run test:voice:ui` checks desktop/mobile layouts in both themes and confirmed filtering/review operations using deterministic browser fixtures. `npm run test:voice:live` exercises real speech synthesis → transcription → Gemini filter and review proposals; it uses provider credits, writes no audio to disk and submits no visit reviews.

Provider references: [ElevenLabs transcription](https://elevenlabs.io/docs/api-reference/speech-to-text/convert) and [speech generation](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).
