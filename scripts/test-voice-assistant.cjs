// Small live provider test. No credentials or audio recordings are written to disk.
const assert = require("node:assert/strict");
const base = process.env.API_URL || "http://localhost:3000";
async function post(path, body) {
  const res = await fetch(base + "/api/consumer/voice/" + path, {
    method: "POST",
    signal: AbortSignal.timeout(60000),
    ...(body instanceof FormData
      ? { body }
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw Error(path + ": " + (error.message || error.error || res.status));
  }
  return res;
}
(async () => {
  const speech = await post("speak", {
    text: "I cannot eat cold food. Please avoid peanuts.",
  });
  assert.match(speech.headers.get("content-type"), /audio\/mpeg/);
  const bytes = await speech.arrayBuffer();
  assert.ok(bytes.byteLength > 1000);
  console.log("PASS ElevenLabs speech response");
  const form = new FormData();
  form.append(
    "audio",
    new Blob([bytes], { type: "audio/mpeg" }),
    "voice-test.mp3",
  );
  const transcript = (await (await post("transcribe", form)).json()).data.text;
  assert.match(transcript, /cold/i);
  assert.match(transcript, /peanut/i);
  console.log("PASS ElevenLabs transcription of generated fixture");
  const turn = (
    await (
      await post("turn", {
        message: transcript,
        source: "voice",
        history: [],
        context: {
          page: "meals",
          allergens: ["Milk"],
          preferences: "",
          area: "",
        },
      })
    ).json()
  ).data;
  assert.equal(turn.action?.type, "filters");
  assert.ok(turn.action.allergens.includes("Milk"));
  assert.ok(turn.action.allergens.includes("Peanuts"));
  assert.ok(turn.action.preferences.length > 1);
  assert.ok(turn.correctedTranscript?.length > 1);
  console.log("PASS Gemini filter proposal preserves existing allergens");
  const review = (
    await (
      await post("turn", {
        message:
          "My food was warm and staff were helpful. I had a good experience.",
        history: [],
        context: {
          page: "visit",
          checkedIn: true,
          finished: true,
          complete: false,
          sentiment: "",
          details: "",
        },
      })
    ).json()
  ).data;
  assert.equal(review.action?.type, "review");
  assert.equal(review.action.sentiment, "positive");
  console.log("PASS Gemini drafts review without submitting");
  const direct = (
    await (
      await post("turn", {
        message: "I want to leave a review",
        history: [],
        context: {
          page: "visit",
          checkedIn: true,
          finished: false,
          complete: false,
        },
      })
    ).json()
  ).data;
  assert.equal(direct.action?.type, "start_review");
  assert.equal(direct.action.sentiment, null);
  console.log("PASS direct review intent prepares finish-then-review");
  const ready = { page: 'visit', checkedIn: true, finished: true, sentiment: 'positive', complete: false };
  const submit = (await (await post('turn', { message: 'Submit my review', context: ready })).json()).data;
  assert.equal(submit.action?.type, 'submit_review');
  const accepted = (await (await post('turn', { message: 'yes please', context: ready, history: [{ role: 'assistant', text: 'Would you like me to submit your review?' }] })).json()).data;
  assert.equal(accepted.action?.type, 'submit_review');
  const repeated = (await (await post('turn', { message: 'Submit my review', context: { ...ready, complete: true } })).json()).data;
  assert.equal(repeated.action, null);
  assert.match(repeated.reply, /already been submitted/);
  console.log('PASS direct authorization and repeated submission acknowledgement (no review is written)');
  for (const context of [
    { page: "meals" },
    { page: "visit", checkedIn: true, finished: false },
  ]) {
    const unrelated = (
      await (
        await post("turn", {
          message: "Write a Java program to calculate mortgage payments.",
          history: [],
          context,
        })
      ).json()
    ).data;
    assert.equal(unrelated.action, null);
    assert.match(unrelated.reply, /Sorry, I can’t help with that/);
    assert.ok(
      unrelated.reply.includes(
        context.page === "meals"
          ? "select allergens"
          : "leave a private review",
      ),
    );
  }
  console.log(
    "PASS unrelated requests receive page-specific available options",
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
