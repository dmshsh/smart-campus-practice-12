// Practice #12 — common contract shared by the code-based and the low-code solution.
// Input:  start time (HH:MM on the demo day, UTC), duration in minutes, blocked flag, fictional bookings.
// Output: { available: boolean, reasonCode: string, message: string, kind: 'decision' | 'validation' }.
//
// Layering: validateRequest() = input validation (AC1, AC2, AC6)
//           checkAvailability() in availability.js = booking rules (AC3, AC4) — reused unchanged
//           the UI (App.tsx) only displays the result (AC5).
import { checkAvailability, MAX_DURATION_MIN } from './availability.js';
import { parseHHMM } from './time.js';

const MINUTE = 60 * 1000;

export const MESSAGES = Object.freeze({
  OK: 'Available — the room is free for the whole requested interval.',
  INVALID_START: 'Enter a valid start time in HH:MM format (24-hour).',
  START_IN_PAST: 'Start time must be in the future (after 08:00 on the demo clock).',
  INVALID_DURATION: 'Enter the duration as a whole number of minutes.',
  DURATION_NOT_POSITIVE: 'Duration must be greater than 0 minutes.',
  DURATION_TOO_LONG: `Duration must be at most ${MAX_DURATION_MIN} minutes.`,
  ROOM_BLOCKED: 'Unavailable — the room is blocked.',
  OVERLAP: 'Unavailable — the requested interval overlaps an existing booking.',
  INTERNAL: 'Unavailable — the request could not be evaluated.',
});

function invalid(reasonCode) {
  return { ok: false, result: { available: false, reasonCode, message: MESSAGES[reasonCode], kind: 'validation' } };
}

function parseDuration(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value.trim() === '') return NaN;
  const t = value.trim();
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

/** Input validation only (AC1, AC2, AC6). Pure: does not look at bookings. */
export function validateRequest(input, { day, now }) {
  const startMs = parseHHMM(day, input.startTime);
  if (Number.isNaN(startMs)) return invalid('INVALID_START');
  if (startMs <= now) return invalid('START_IN_PAST');

  const duration = parseDuration(input.durationMin);
  if (!Number.isFinite(duration) || !Number.isInteger(duration)) return invalid('INVALID_DURATION');
  if (duration <= 0) return invalid('DURATION_NOT_POSITIVE');
  if (duration > MAX_DURATION_MIN) return invalid('DURATION_TOO_LONG');

  return { ok: true, startMs, endMs: startMs + duration * MINUTE };
}

/** Full check: validation, then the unchanged booking rules. Never mutates `bookings` (AC5). */
export function checkRoom(input, { room, bookings, day, now }) {
  const v = validateRequest(input, { day, now });
  if (!v.ok) return v.result;

  const roomState = { ...room, blocked: Boolean(input.blocked) };
  const r = checkAvailability(roomState, { start: v.startMs, end: v.endMs }, bookings, now);
  if (r.available) return { available: true, reasonCode: 'OK', message: MESSAGES.OK, kind: 'decision' };
  const code = r.reason === 'ROOM_BLOCKED' || r.reason === 'OVERLAP' ? r.reason : 'INTERNAL';
  return { available: false, reasonCode: code, message: MESSAGES[code], kind: 'decision' };
}
