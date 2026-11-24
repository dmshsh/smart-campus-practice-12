export const MAX_DURATION_MIN = 120;
const MINUTE = 60 * 1000;
export function checkAvailability(room, request, bookings, now) {
  const { start, end } = request;
  if (start >= end) return unavailable('INVALID_RANGE');
  if (start < now) return unavailable('IN_THE_PAST');
  if ((end - start) / MINUTE > MAX_DURATION_MIN) return unavailable('TOO_LONG');
  if (room.blocked) return unavailable('ROOM_BLOCKED');
  for (const b of bookings) {
    if (b.roomId !== room.id) continue;
    if (start < b.end && end > b.start) return unavailable('OVERLAP');
  }
  return { status: 'Available', available: true, reason: null };
}
function unavailable(reason) {
  return { status: 'Unavailable', available: false, reason };
}
