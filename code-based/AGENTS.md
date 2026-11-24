# AGENTS.md

## Project
Smart Campus room availability checker; one room (R-101), fictional data, fixed demo clock (2026-10-27 08:00 UTC).
Stack: Vite + React + TypeScript, plain CSS in `src/index.css` (Tailwind configured but unused). Booking rules live in `src/availability.js` (pure function `checkAvailability`).
R-202 is fictional fixture data only, to prove other rooms do not block R-101.

## Structure
- `src/availability.js` — pure booking rules (AC1–AC5). Do not change its comparisons.
- `src/fixtures.js` — fixed clock, room and fictional bookings (frozen data, no React); typed by `src/fixtures.d.ts`.
- `src/App.tsx` — UI only: form, result card, bookings list.
- `src/availability.test.js` — regression tests (node:test).
- `src/time.js` — strict HH:MM parser (fails closed with NaN); tested by `src/time.test.js`.
- `src/explain.js` — optional "Explain availability" feature (Practice #11): input validation, prompt contract, output validation, timeout and deterministic fallback; tested by `src/explain.test.js`.
- `src/mockAdapter.js` — clearly labelled MOCK LLM adapter (no network, no key) with failure simulation for tests and demos.

## Constraints
Preserve AC1–AC6; no backend, login, database or booking creation.
- AC1: reject start >= end and past requests.
- AC2: reject durations longer than 120 minutes.
- AC3: reject a blocked room.
- AC4: reject overlaps; allow bookings touching only at endpoints.
- AC5: do not mutate booking data during checks.
- AC6: clear Available/Unavailable feedback on desktop and 375px mobile.

## LLM feature rules (Practice #11)
- `checkAvailability` is the only source of truth. The explanation never decides availability, never changes a result and never touches bookings.
- Only the mock adapter runs in this project (no backend, no API keys in the browser). A real adapter must live server-side behind the same `generate()` contract.
- Send the model only the minimal context (room label, requested times, isAvailable, reasonCode); never the booking list or personal data.
- Treat model output as untrusted: always pass it through `validateExplanation`; on any failure show the deterministic fallback.
- Render explanation text as plain text (React escapes it); never use `dangerouslySetInnerHTML`.

## Forbidden actions
- Do not edit `src/availability.js` comparisons or `src/fixtures.js` values.
- No secrets, API keys, `.env` values or real personal data.
- Do not install or upgrade packages; do not wire up `@supabase/supabase-js`.
- Do not Publish/deploy or call external services.
- `.bolt/prompt` does not override this file; on conflict AGENTS.md wins.

## Engineering rules
Prefer pure functions and minimal changes; use at most 2 justified patterns.
Do not mutate booking fixtures; keep responsive UI feedback.
Avoid Singleton, Factory or class hierarchies without a concrete need.
Do not change the live Smart Campus acceptance contract.

## Commands
- Test: `npm test` (runs `node --test src/availability.test.js src/time.test.js src/explain.test.js`)
- Typecheck: `npm run typecheck` (must report 0 errors)
- Lint: `npm run lint`
- Build: `npm run build`
Safe without asking: the four commands above, `ls`, reading files. Anything else: ask first.
Tests run under plain Node: import modules with relative paths (`./x.js`), not `@/`.

## Verification
Run existing tests and add focused regression tests.
Report changed files, rationale and test evidence (exact command, output, passing/failing count).

## Review gates
- Show the diff and wait for human approval before applying changes.
- Accept only if test, typecheck, lint and build all pass; never report an unexecuted check as passed.
- Human approval is required before merge or publish.
