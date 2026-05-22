# AGENTS.md — packages/consent

1. **Necessary category is read-only.** Never grant a consent flow that lets the user reject `necessary`.
2. **`hasConsent` is a static function** — do not require React to check consent.
3. **No silent re-fires** — if a user changes consent, the store updates; consumers re-render via `useConsent` hook.
