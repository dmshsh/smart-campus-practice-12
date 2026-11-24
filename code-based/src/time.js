// Parse "HH:MM" on the fixed demo day (UTC) into epoch ms.
// Returns NaN for anything that is not a valid 24h time, so callers can fail closed.
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export function parseHHMM(day, hhmm) {
  if (typeof hhmm !== 'string' || !HHMM.test(hhmm)) return NaN;
  return Date.parse(`${day}T${hhmm}:00Z`);
}
