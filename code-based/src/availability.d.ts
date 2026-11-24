export type Reason = 'INVALID_RANGE' | 'IN_THE_PAST' | 'TOO_LONG' | 'ROOM_BLOCKED' | 'OVERLAP';
export interface AvailabilityResult {
  status: 'Available' | 'Unavailable';
  available: boolean;
  reason: Reason | null;
}
export const MAX_DURATION_MIN: number;
export function checkAvailability(room: { readonly id: string; readonly blocked: boolean }, request: { start: number; end: number }, bookings: ReadonlyArray<{ readonly roomId: string; readonly start: number; readonly end: number }>, now: number): AvailabilityResult;
