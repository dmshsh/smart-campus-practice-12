import { parseHHMM } from './time.js';

import { test } from 'node:test';
import assert from 'node:assert/strict';

const DAY = '2026-10-27';
const at = (h, m) => Date.parse(`${DAY}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);

// ---------- Valid inputs ----------

test('parses 09:30', () => assert.equal(parseHHMM(DAY, '09:30'), at(9, 30)));
test('parses 00:00 (midnight)', () => assert.equal(parseHHMM(DAY, '00:00'), at(0, 0)));
test('parses 23:59 (last minute)', () => assert.equal(parseHHMM(DAY, '23:59'), at(23, 59)));

// ---------- NaN inputs (fail closed) ----------

for (const bad of ['', '9', '10', '9:30', '24:00', '12:60', '25:99', 'ab:cd', ' 09:30', undefined, null, 930]) {
  test(`returns NaN for ${JSON.stringify(bad)}`, () => assert.ok(Number.isNaN(parseHHMM(DAY, bad))));
}

// ---------- Day argument is used ----------

test('uses the day argument (2026-10-28 differs from 2026-10-27)', () => {
  const d27 = parseHHMM('2026-10-27', '09:30');
  const d28 = parseHHMM('2026-10-28', '09:30');
  assert.ok(!Number.isNaN(d27));
  assert.ok(!Number.isNaN(d28));
  assert.equal(d28 - d27, 24 * 60 * 60 * 1000);
});

test('returns NaN when the day argument is malformed', () => {
  assert.ok(Number.isNaN(parseHHMM('not-a-day', '09:30')));
});
