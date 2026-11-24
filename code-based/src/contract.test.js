// Practice #12 — the eight shared test cases (T1–T8) plus edge cases for the common contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRoom, validateRequest } from './contract.js';
import { NOW, DAY, ROOM, BOOKINGS } from './fixtures.js';

const ctx = { room: ROOM, bookings: BOOKINGS, day: DAY, now: NOW };
const snapshot = JSON.stringify(BOOKINGS);
const run = (startTime, durationMin, blocked = false) => checkRoom({ startTime, durationMin, blocked }, ctx);

test('T1 valid free interval 09:00 + 30 min -> Available', () => {
  assert.deepEqual(run('09:00', 30), {
    available: true, reasonCode: 'OK', kind: 'decision',
    message: 'Available — the room is free for the whole requested interval.',
  });
});

test('T2 overlap 10:30 + 30 min (booking 10:00–11:00) -> Unavailable OVERLAP', () => {
  const r = run('10:30', 30);
  assert.equal(r.available, false);
  assert.equal(r.reasonCode, 'OVERLAP');
  assert.equal(r.kind, 'decision');
});

test('T3 blocked room 09:00 + 30 min -> Unavailable ROOM_BLOCKED', () => {
  const r = run('09:00', 30, true);
  assert.equal(r.available, false);
  assert.equal(r.reasonCode, 'ROOM_BLOCKED');
});

test('T4 duration 0 -> validation error DURATION_NOT_POSITIVE', () => {
  const r = run('09:00', 0);
  assert.equal(r.kind, 'validation');
  assert.equal(r.reasonCode, 'DURATION_NOT_POSITIVE');
  assert.equal(r.available, false);
});

test('T5 duration 121 -> validation error DURATION_TOO_LONG', () => {
  const r = run('09:00', 121);
  assert.equal(r.kind, 'validation');
  assert.equal(r.reasonCode, 'DURATION_TOO_LONG');
});

test('T6 past start 07:00 (NOW 08:00) -> validation error START_IN_PAST', () => {
  const r = run('07:00', 30);
  assert.equal(r.kind, 'validation');
  assert.equal(r.reasonCode, 'START_IN_PAST');
});

test('T7 adjacent 11:00 + 120 min (touches 11:00 end and 13:00 start) -> Available', () => {
  assert.equal(run('11:00', 120).reasonCode, 'OK');
});

test('T8 booking data unchanged after T1–T7', () => {
  assert.equal(JSON.stringify(BOOKINGS), snapshot);
  assert.equal(BOOKINGS.length, 3);
  assert.ok(Object.isFrozen(BOOKINGS));
});

// ---- edge cases (not part of the shared 8, kept as regression guards) ----
test('E1 duration 120 is accepted (upper boundary)', () => {
  assert.equal(run('11:00', 120).available, true);
});
test('E2 duration 1 is accepted (lower boundary)', () => {
  assert.equal(run('09:00', 1).available, true);
});
test('E3 start exactly at NOW (08:00) is not in the future', () => {
  assert.equal(run('08:00', 30).reasonCode, 'START_IN_PAST');
});
test('E4 malformed / empty start time fails closed', () => {
  for (const s of ['', '9', '24:00', '09:60', 'abc', undefined, '<script>']) {
    assert.equal(run(s, 30).reasonCode, 'INVALID_START', String(s));
  }
});
test('E5 non-integer / empty / text duration -> INVALID_DURATION', () => {
  for (const d of ['', ' ', '1.5', 'abc', NaN, Infinity, null, undefined, '30min']) {
    assert.equal(run('09:00', d).reasonCode, 'INVALID_DURATION', String(d));
  }
});
test('E6 negative duration -> DURATION_NOT_POSITIVE; numeric string accepted', () => {
  assert.equal(run('09:00', -5).reasonCode, 'DURATION_NOT_POSITIVE');
  assert.equal(run('09:00', '30').reasonCode, 'OK');
});
test('E7 overlap that only partly covers a booking (12:30 + 60 -> 13:30)', () => {
  assert.equal(run('12:30', 60).reasonCode, 'OVERLAP');
});
test('E8 R-202 booking does not affect R-101 (15:00 + 60)', () => {
  assert.equal(run('15:00', 60).reasonCode, 'OK');
});
test('E9 validation runs before blocked flag (invalid input reported first)', () => {
  assert.equal(run('09:00', 0, true).reasonCode, 'DURATION_NOT_POSITIVE');
});
test('E10 validateRequest computes end = start + duration', () => {
  const v = validateRequest({ startTime: '09:00', durationMin: 45 }, { day: DAY, now: NOW });
  assert.equal(v.ok, true);
  assert.equal(v.endMs - v.startMs, 45 * 60 * 1000);
});
