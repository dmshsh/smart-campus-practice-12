import { checkAvailability } from './availability.js';
import { NOW, ROOM, BOOKINGS } from './fixtures.js';

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Helper: epoch ms for HH:MM on the fixed demo day (2026-10-27, UTC).
const at = (h, m = 0) => Date.UTC(2026, 9, 27, h, m, 0);
const req = (s, e) => ({ start: s, end: e });
const R101 = ROOM; // bookings on R-101: 10:00-11:00 and 13:00-14:00; R-202: 15:00-16:00. NOW = 08:00.
const FREE_ROOM = { id: 'R-303', blocked: false }; // no bookings: isolates AC1/AC2 rules from AC4

const expectUnavailable = (result, reason) => {
  assert.equal(result.status, 'Unavailable');
  assert.equal(result.available, false);
  assert.equal(result.reason, reason);
};
const expectAvailable = (result) => {
  assert.equal(result.status, 'Available');
  assert.equal(result.available, true);
  assert.equal(result.reason, null);
};

// ---------- AC1: reject start >= end and requests in the past ----------

test('AC1: rejects start === end (zero-length interval)', () => {
  // AC1 says start >= end is invalid; equality is the boundary of that rule.
  expectUnavailable(checkAvailability(R101, req(at(9), at(9)), BOOKINGS, NOW), 'INVALID_RANGE');
});

test('AC1: rejects a reversed interval (end before start)', () => {
  expectUnavailable(checkAvailability(R101, req(at(9, 30), at(9)), BOOKINGS, NOW), 'INVALID_RANGE');
});

test('AC1: rejects a request in the past (start before NOW)', () => {
  // 07:00-07:30 is a valid range that starts before NOW = 08:00.
  expectUnavailable(checkAvailability(R101, req(at(7), at(7, 30)), BOOKINGS, NOW), 'IN_THE_PAST');
});

test('AC1: a request starting exactly at NOW is not "in the past" (documents current behavior)', () => {
  // AC1 is ambiguous about equality; the code treats start === now as allowed (start < now is false).
  expectAvailable(checkAvailability(R101, req(at(8), at(8, 30)), BOOKINGS, NOW));
});

// ---------- AC2: maximum duration 120 minutes ----------

test('AC2: accepts exactly 120 minutes', () => {
  expectAvailable(checkAvailability(FREE_ROOM, req(at(8, 30), at(10, 30)), [], NOW));
});

test('AC2: rejects 121 minutes', () => {
  expectUnavailable(checkAvailability(FREE_ROOM, req(at(8, 30), at(10, 31)), [], NOW), 'TOO_LONG');
});

// ---------- AC3: blocked room ----------

test('AC3: rejects a blocked room even for an otherwise valid, free slot', () => {
  const blockedRoom = { ...R101, blocked: true };
  expectUnavailable(checkAvailability(blockedRoom, req(at(9), at(9, 30)), BOOKINGS, NOW), 'ROOM_BLOCKED');
});

// ---------- AC4: reject overlaps, allow touching endpoints ----------

test('AC4: rejects a request fully inside an existing booking', () => {
  expectUnavailable(checkAvailability(R101, req(at(10, 15), at(10, 45)), BOOKINGS, NOW), 'OVERLAP');
});

test('AC4: rejects a request overlapping the start of a booking', () => {
  expectUnavailable(checkAvailability(R101, req(at(9, 30), at(10, 30)), BOOKINGS, NOW), 'OVERLAP');
});

test('AC4: rejects a request overlapping the end of a booking', () => {
  expectUnavailable(checkAvailability(R101, req(at(10, 30), at(11, 30)), BOOKINGS, NOW), 'OVERLAP');
});

test('AC4: rejects a 1-minute overlap with the first booking (10:59-12:00 vs 10:00-11:00)', () => {
  expectUnavailable(checkAvailability(R101, req(at(10, 59), at(12)), BOOKINGS, NOW), 'OVERLAP');
});

test('AC4: rejects a 1-minute overlap with the second booking (12:00-13:01 vs 13:00-14:00)', () => {
  expectUnavailable(checkAvailability(R101, req(at(12), at(13, 1)), BOOKINGS, NOW), 'OVERLAP');
});

test('AC4: allows a request that starts exactly when a booking ends (11:00-12:00)', () => {
  expectAvailable(checkAvailability(R101, req(at(11), at(12)), BOOKINGS, NOW));
});

test('AC4: allows a request that ends exactly when a booking starts (12:00-13:00)', () => {
  expectAvailable(checkAvailability(R101, req(at(12), at(13)), BOOKINGS, NOW));
});

test('AC4: allows a request touching two bookings at both endpoints (11:00-13:00)', () => {
  expectAvailable(checkAvailability(R101, req(at(11), at(13)), BOOKINGS, NOW));
});

test('AC4: allows a request ending exactly when the first booking starts (09:00-10:00)', () => {
  expectAvailable(checkAvailability(R101, req(at(9), at(10)), BOOKINGS, NOW));
});

test('AC4: a booking of another room (R-202, 15:00-16:00) does not block R-101', () => {
  expectAvailable(checkAvailability(R101, req(at(15), at(16)), BOOKINGS, NOW));
});

test('AC4: the same slot is rejected for the room that owns the booking (R-202)', () => {
  const r202 = { id: 'R-202', blocked: false };
  expectUnavailable(checkAvailability(r202, req(at(15), at(16)), BOOKINGS, NOW), 'OVERLAP');
});

// ---------- AC5: Available / Unavailable decision without changing booking data ----------

test('AC5: does not mutate the bookings array (order and content)', () => {
  const copy = structuredClone([...BOOKINGS]);
  checkAvailability(R101, req(at(15, 30), at(16, 30)), copy, NOW);
  // The fixture is deliberately NOT sorted; an in-place sort would reorder it.
  assert.deepStrictEqual(copy, [...BOOKINGS]);
});

test('AC5: works on a frozen bookings array (any write would throw in strict mode)', () => {
  const frozen = Object.freeze(structuredClone([...BOOKINGS]).map((b) => Object.freeze(b)));
  expectAvailable(checkAvailability(R101, req(at(15, 30), at(16, 30)), frozen, NOW));
});

test('AC5: booking fixtures keep their exact values and order after many checks', () => {
  const slots = [[9, 0, 9, 30], [10, 15, 10, 45], [11, 0, 12, 0], [12, 0, 13, 1], [15, 0, 16, 0]];
  for (const [a, b, c, d] of slots) checkAvailability(R101, req(at(a, b), at(c, d)), BOOKINGS, NOW);
  assert.deepStrictEqual(
    BOOKINGS.map((x) => [x.roomId, x.start, x.end]),
    [
      ['R-101', at(13), at(14)],
      ['R-101', at(10), at(11)],
      ['R-202', at(15), at(16)],
    ],
  );
});

// ---------- Refactoring guard: shared fixtures are immutable ----------

test('fixtures: ROOM, BOOKINGS and every booking are frozen', () => {
  assert.ok(Object.isFrozen(ROOM));
  assert.ok(Object.isFrozen(BOOKINGS));
  assert.ok(BOOKINGS.every((b) => Object.isFrozen(b)));
});
