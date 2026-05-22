# AGENTS.md — packages/tracking

1. **Every event is consent-gated.** Never bypass `hasConsent`.
2. **No PII in event props.** No email, phone, name. Use stable opaque IDs.
3. **No third-party tracker SDKs.** GA, Segment, Mixpanel etc. are out of scope. Umami + CF Web Analytics are it.
4. **No queue without consent.** If consent is missing, drop. Don't buffer waiting for consent.
