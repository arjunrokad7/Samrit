# Recipient visit preview

Route: `/consumer/check-in`, accessible without signing in. No backend submission or persistence is implemented; leaving or refreshing clears the visit.

QR payload format for this prototype:

```
samrit:visit:east-village:entry
samrit:visit:east-village:exit
```

Venue IDs are lowercase letters, digits and hyphens, 1–80 characters. Entry must precede exit; both must name the same venue. Camera detection records immediately. Printed-code entry records when confirmed and is marked `manual`. This format is not compatible with batch custody QR codes and is not authenticated. The entry panel includes sample codes for a fictional visit.

Each record includes venue ID, phase, client timestamp, capture method and, when permission is granted, browser latitude, longitude, reported accuracy in meters and location observation timestamp. Location denial or failure records an unavailable status rather than blocking review. The review preview includes both records, elapsed milliseconds, sentiment and optional text. No name/account identifier is attached. Precise location and timing can still identify a visit; do not promise irreversible anonymity.

Future server integration must validate signed, phase-specific venue tokens, prevent replay/duplicate submissions, use trustworthy timing and venue-location checks, define consent, access controls, retention and anonymization, and deliver reviews privately to the central NGO. Browser coordinates and clocks are untrusted. A 45-minute duration is context, not proof of queue length, receipt of food, or truthfulness. No LLM or confidence scoring is implemented here. Test eligibility rules for visitors who leave without food as well as visitors who finish a meal.
