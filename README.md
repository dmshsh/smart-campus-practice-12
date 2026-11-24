# Practice #12 — Code-based vs Low-code: Smart Campus Room Availability Checker

**Student:** Amangeldy Dinmukhammed (24B031640)
**Course:** AI-Driven Software Engineering, KBTU — class on Tuesday, 16:00
**Date:** 24 November 2026
**AI tool:** Claude (Anthropic), model Claude Opus 5.5, used in the Claude desktop app with browser control

## Links

| What | Link |
|---|---|
| Code-based live demo (Bolt publish) | https://smart-campus-room-av-8z3b.bolt.host |
| Code-based source (Bolt project) | https://bolt.new/~/sb1-nnrnvsjg |
| Low-code live demo (Appsmith, public) | https://app.appsmith.com/app/smart-campus-availability-low-code/page1-6b05ae43b238dbe867c4a107 |
| Low-code export | `low-code/Smart Campus Availability Low-code.json` (Appsmith export file) |
| This repository | full Bolt source in `code-based/`, low-code export and JS in `low-code/`, screenshots in `screenshots/` |

## Repository layout

```
code-based/            full Bolt project (Vite + React + TypeScript)
  src/contract.js      NEW: common contract (validation + call into the booking rules)
  src/contract.test.js NEW: T1–T8 + 10 edge cases
  src/App.tsx          UI only (start time + duration + blocked flag)
  src/availability.js  booking rules from earlier practices — NOT changed
  src/fixtures.js      fixed demo clock and fictional bookings — NOT changed
  docs/evidence12/     raw output of tests, typecheck, lint, build, npm audit
low-code/
  Smart Campus Availability Low-code.json   Appsmith export
  Availability.jsobject.js                  the JS Object used inside Appsmith (copy)
  widgets.md                                widget list and bindings
screenshots/           all screenshots referenced below
```

---

## Task 01 — Baseline (frozen before any change)

- Project: Bolt project `sb1-nnrnvsjg`, version 7 ("Publish application", 17 Nov 2026 21:07).
- Demo clock: `NOW = 2026-10-27 08:00 UTC`, day `2026-10-27`, room `R-101`.
- Fictional bookings (order kept, not sorted):

| # | Room | Start | End |
|---|---|---|---|
| 1 | R-101 | 13:00 | 14:00 |
| 2 | R-101 | 10:00 | 11:00 |
| 3 | R-202 | 15:00 | 16:00 |

- Baseline checks: `npm test` 66/66 pass, `npm run typecheck` 0 errors, `npm run lint` 0 problems, `npm run build` OK (files in `code-based/docs/evidence12/01-baseline-*.txt`).
- Baseline UI used start + **end** time. The new contract needs start + **duration**, so only the input layer changes. `availability.js` and `fixtures.js` were not modified (sha256 checked before and after: `7ff7fd75…` and `0f124cc7…`).

Screenshots: `01-baseline-tests-66of66.jpg`, `02-baseline-live-app.jpg`.

## Task 02 — Common contract (same for both solutions)

**User story.** As a student, I want to choose a future start time and a duration for Room R-101 and see right away whether the room is available and why, so I can plan a booking without changing existing bookings.

**Acceptance criteria**

| ID | Criterion |
|---|---|
| AC1 | Start time must be in the future (strictly after NOW = 08:00). |
| AC2 | Duration must be greater than 0 and at most 120 minutes (whole minutes). |
| AC3 | A request that overlaps an existing booking of the same room is Unavailable. Touching end points (end = next start) is not an overlap. |
| AC4 | A blocked room is Unavailable. |
| AC5 | The decision is only displayed; existing bookings never change. |
| AC6 | Invalid input gets an understandable message and is not checked against bookings. |

**Inputs:** start time `HH:MM` (UTC, demo day), duration in minutes, blocked flag (on/off), fictional bookings (fixed list above).

**Outputs:** `available` (boolean), `reasonCode` (string), visible message.

| reasonCode | Kind | Message |
|---|---|---|
| OK | decision | Available — the room is free for the whole requested interval. |
| OVERLAP | decision | Unavailable — the requested interval overlaps an existing booking. |
| ROOM_BLOCKED | decision | Unavailable — the room is blocked. |
| START_IN_PAST | validation | Start time must be in the future (after 08:00 on the demo clock). |
| INVALID_START | validation | Enter a valid start time in HH:MM format (24-hour). |
| INVALID_DURATION | validation | Enter the duration as a whole number of minutes. |
| DURATION_NOT_POSITIVE | validation | Duration must be greater than 0 minutes. |
| DURATION_TOO_LONG | validation | Duration must be at most 120 minutes. |

Order of checks (both solutions): start format → start in future → duration format → duration > 0 → duration ≤ 120 → blocked → overlap → OK.

**Test inputs prepared before implementation**

| ID | Start | Duration | Blocked | Expected |
|---|---|---|---|---|
| T1 | 09:00 | 30 | off | Available, OK |
| T2 | 10:30 | 30 | off | Unavailable, OVERLAP (with 10:00–11:00) |
| T3 | 09:00 | 30 | on | Unavailable, ROOM_BLOCKED |
| T4 | 09:00 | 0 | off | Validation error, DURATION_NOT_POSITIVE |
| T5 | 09:00 | 121 | off | Validation error, DURATION_TOO_LONG |
| T6 | 07:00 | 30 | off | Validation error, START_IN_PAST |
| T7 | 11:00 | 120 | off | Available, OK (touches 11:00 end and 13:00 start) |
| T8 | — | — | — | Booking list identical after T1–T7 |

## Task 03 — Code-based solution

Layers are separated:

- **Validation** — `validateRequest()` in `src/contract.js` (AC1, AC2, AC6).
- **Availability calculation** — `checkAvailability()` in `src/availability.js`, reused without changes (AC3, AC4). `checkRoom()` in `contract.js` builds `end = start + duration` and calls it.
- **UI** — `src/App.tsx` only reads inputs and shows the result. The form uses `noValidate`, so invalid values reach the contract and get our own messages instead of browser tooltips. Duration is a text field with `inputMode="numeric"` so 0, 121 or text can be tested.
- Narrow screens: the existing CSS grid switches to one column below 600 px. Checked in Bolt's device preview at 402 px (`12-code-mobile-402px.jpg`).
- One small fix during debugging: the new duration field had no styling because the CSS only targeted `input[type="time"]`; added `input[type="text"]` to the same rule in `src/index.css`.

Checks after the change: `npm test` **84/84** (66 old + 18 new), typecheck 0 errors, lint 0 problems, build OK. Republished to the same bolt.host URL.

Screenshots: `03-code-T1-T8-tests.jpg`, `04-code-full-suite-84of84-typecheck-lint.jpg`, `05`–`11` (UI runs of T1–T7), `12-code-mobile-402px.jpg`, `13-code-live-published-site.jpg`.

## Task 04 — Low-code solution (Appsmith, free cloud plan)

Widgets: `StartInput` (Input, text, default 09:00), `DurationInput` (Input, text, default 30), `BlockedSwitch` (Switch, default off), `CheckButton` (Button, onClick `{{Availability.run()}}`), `ResultText` (Text bound to `appsmith.store.lastResult`), `BookingsTable` (Table bound to `{{Availability.BOOKINGS}}`), `InfoText` (title and demo clock).

Logic: one JS Object `Availability` with the same fictional bookings, the same fixed clock and the same rule order as the code-based contract. `run()` reads the widgets, calls `check()`, compares the bookings before and after, and saves the result with `storeValue` (not persisted).

**Requirements the platform could not do without a script (recorded as asked):**

1. No time-only picker. The DatePicker widget is date/time oriented, so start time is a text Input and the HH:MM check is in JS.
2. The overlap rule (loop over bookings, interval comparison) cannot be built with visual settings only. A JS Object was needed. Input widget validation (regex, min/max) can show red borders, but it does not block the button or give a reason code, so all validation stayed in the JS Object to keep the same contract.
3. No built-in unit test runner on the free plan. T1–T8 were run **manually** in the deployed app. As an extra (off-platform) check, the same JS Object was run in Node.js with mocked widgets: 14/14 cases passed. This is labelled as simulated and is not counted in the 8/8.
4. Small layout limits: the switch label is far from the toggle (grid snapping). Cosmetic only.

Nothing in the low-code result is simulated: all 8 results in the table below were observed in the deployed Appsmith app.

Screenshots: `20`–`26` (T1–T8), `28-lowcode-editor-widgets.jpg`, `29-lowcode-js-object.jpg`, `30-lowcode-public-sharing.jpg`.

## Task 05 — Identical tests: expected vs observed

| ID | Input | Expected | Code-based observed | Low-code observed |
|---|---|---|---|---|
| T1 | 09:00, 30, off | Available / OK | Available / OK ✅ | Available / OK ✅ |
| T2 | 10:30, 30, off | Unavailable / OVERLAP | Unavailable / OVERLAP ✅ | Unavailable / OVERLAP ✅ |
| T3 | 09:00, 30, on | Unavailable / ROOM_BLOCKED | Unavailable / ROOM_BLOCKED ✅ | Unavailable / ROOM_BLOCKED ✅ |
| T4 | 09:00, 0, off | Invalid / DURATION_NOT_POSITIVE | Invalid input / DURATION_NOT_POSITIVE ✅ | Invalid input / DURATION_NOT_POSITIVE ✅ |
| T5 | 09:00, 121, off | Invalid / DURATION_TOO_LONG | Invalid input / DURATION_TOO_LONG ✅ | Invalid input / DURATION_TOO_LONG ✅ |
| T6 | 07:00, 30, off | Invalid / START_IN_PAST | Invalid input / START_IN_PAST ✅ | Invalid input / START_IN_PAST ✅ |
| T7 | 11:00, 120, off | Available / OK | Available / OK ✅ | Available / OK ✅ |
| T8 | after T1–T7 | Bookings unchanged | Unchanged: list same, unit test T8 passes, data frozen ✅ | Unchanged: table same, `bookingsUnchanged: true` on every run ✅ |
| **Total** | | | **8 / 8** (UI + automated) | **8 / 8** (UI, manual) |

## Task 06 — Engineering effort

Times come from the timestamps of the screenshots and terminal output. **Important:** the work was done by an AI agent (Claude) driving the browser, so absolute minutes are much lower than for a person. They are only useful for comparing the two tracks.

| Activity | Code-based | Low-code |
|---|---|---|
| Setup (open project / create app) | 4 min (open Bolt, record baseline, run checks) | 1 min (account login done by me, create app) |
| Implementation | 4 min (contract.js, tests, App.tsx) | 9 min (JS Object 2 min + 7 widgets and bindings 7 min) |
| Debugging / repair | 1 min (CSS for the new text input) | 3 min (JS Object edit lost after rename and re-entered; drag-and-drop failed with automation; table did not fit and was placed again) |
| Testing | 5 min (84 automated + 7 manual UI runs) | 4 min (8 manual UI runs) |
| **Build + repair** | **5 min** | **12 min** |
| Acceptance tests passed | 8 / 8 | 8 / 8 |
| Unresolved defects | 0 functional; 1 SCA finding (see Task 07) | 0 functional; 1 cosmetic layout issue (switch label) |
| Review / versioning | Code diff visible in Bolt; files can go to Git; tests, typecheck and lint run on every change | No Git connected (possible, not set up); changes reviewed only visually; versioning = manual JSON export |

**Measured vs impression.** Measured: test counts, times above, audit counts. Impression (not measured): the low-code UI looked "done" faster for the layout part, but every rule still had to be written in JavaScript, so most of the real work was the same code in a less convenient editor.

## Task 07 — Security review (Lecture #12)

| Area | Code-based | Low-code (Appsmith) |
|---|---|---|
| Input validation | Strict regex `HH:MM`, integer duration, fail-closed; unit tests E4/E5 cover empty, `<script>`, text, decimals, NaN, Infinity | Same regex and integer checks in the JS Object; probe `<b>09:00</b>` → INVALID_START (`27-lowcode-security-html-probe.jpg`) |
| Output handling / XSS | React escapes text; no `dangerouslySetInnerHTML`; messages are fixed constants | `ResultText` uses HTML formatting, but only with fixed constants (status, reasonCode, message). User input is never put into HTML. **Risk to keep in mind:** if someone later puts `StartInput.text` into this Text widget, Appsmith's sanitising would need to be checked |
| Injection (SQL etc.) | No backend, no database, no queries | No datasource or query; logic runs in the browser only |
| Secrets | None in the code; no `.env`; no API keys | None; no connectors or datasources |
| Permissions / sharing | bolt.host site is public (free plan has no private sharing); the Bolt project is edited only from my account | App made public for the demo (view only). Workspace has one admin (me). Editing needs login |
| Connector / account access | No third-party connector was authorised (Bolt's GitHub connect was not used) | No datasource connectors; login with my own account only |
| SCA (dependencies) | `npm audit`: 14 findings (1 low, 4 moderate, 9 high), 13 of them in dev tools only. **Production:** 1 high in `ws`, which comes from `@supabase/supabase-js` — a dependency the app does not use. Fix: remove `@supabase/supabase-js` and run `npm audit fix` for dev tools. Not applied yet (kept the frozen baseline), recorded as an open item | Platform dependencies are managed by Appsmith (cloud). I cannot run SCA on them; updates are the vendor's responsibility. My part: keep the app simple and avoid custom/third-party widgets |
| DAST (safe manual runtime checks) | Ran T1–T7 and invalid-input cases on my own app only; no scanners used | Same manual checks on my own deployed app only; no scanning of Appsmith or Bolt infrastructure |
| Data | Fictional bookings only, no personal data | Same |

## Comparison matrix

| Criterion | Code-based | Low-code |
|---|---|---|
| Functional tests | **8 / 8** | **8 / 8** |
| Build and repair time | **5 min** | **12 min** |
| Customization | Full control of UI and logic; responsive layout through CSS | Limited to widget properties and grid; HTML only inside Text widget; rules still need JS |
| Security controls | Automated tests, typecheck, lint, npm audit in my hands; one open SCA item | Platform-managed hosting and updates; no SAST/SCA available to me; access control by workspace/public toggle |
| Versioning / portability | Plain source files, works with Git and any host | Appsmith-specific JSON export; Git connect exists but not configured; moving to another platform means rebuilding |
| Ongoing cost | $0 (Bolt free plan, "Made in Bolt" badge) | $0 (Appsmith free cloud plan) |

**Recommendation.** For this feature I would keep the **code-based** version as the main one. Both passed 8/8, but the booking rules had to be written in JavaScript in both cases, and only the code-based version gives automated regression tests, normal version control and dependency checks. Appsmith is a good choice for a quick internal admin screen around this logic (for example a staff page that lists bookings), not as the place where the rules live.

## AI-use reflection

I used Claude (Anthropic, Claude Opus 5.5) as an agent that controlled the browser: it read the existing Bolt project, wrote `contract.js`, tests and the new UI, built the Appsmith app, ran the tests and took screenshots. The suggested prompts from the slides were used in adapted form (implement the contract without changing the six ACs, use fictional data only, separate rules from presentation, do not invent test results; and for the comparison — do not treat a platform as secure just because it is low-code).

What I checked myself: that `availability.js` and `fixtures.js` hashes did not change, that every row in the test table has a screenshot, and that the low-code results are from the deployed app, not from the Node.js simulation. The AI also found the unused Supabase dependency during the audit, which I would not have noticed. The main limitation: the time measurements reflect an AI agent's speed, not a student's, so they show relative effort only.
