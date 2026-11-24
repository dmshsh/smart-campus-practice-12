// Smart Campus room availability — fixed demo clock and fictional fixtures.
// Pure data, no React: shared by the UI (App.tsx) and the regression tests.
// Frozen so neither the UI nor a test can mutate booking data (AC5).

// Fixed demo clock — do not change.
export const NOW = Date.UTC(2026, 9, 27, 8, 0, 0); // 2026-10-27 08:00 UTC
export const DAY = '2026-10-27';

export const ROOM = Object.freeze({ id: 'R-101', name: 'Room R-101', blocked: false });

// Fictional bookings. Order preserved (NOT sorted). R-202 included but never overlaps R-101.
export const BOOKINGS = Object.freeze([
  Object.freeze({ roomId: 'R-101', start: Date.UTC(2026, 9, 27, 13, 0, 0), end: Date.UTC(2026, 9, 27, 14, 0, 0) }),
  Object.freeze({ roomId: 'R-101', start: Date.UTC(2026, 9, 27, 10, 0, 0), end: Date.UTC(2026, 9, 27, 11, 0, 0) }),
  Object.freeze({ roomId: 'R-202', start: Date.UTC(2026, 9, 27, 15, 0, 0), end: Date.UTC(2026, 9, 27, 16, 0, 0) }),
]);
