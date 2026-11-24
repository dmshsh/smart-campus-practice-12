export type ReasonCode =
  | 'OK'
  | 'INVALID_START'
  | 'START_IN_PAST'
  | 'INVALID_DURATION'
  | 'DURATION_NOT_POSITIVE'
  | 'DURATION_TOO_LONG'
  | 'ROOM_BLOCKED'
  | 'OVERLAP'
  | 'INTERNAL';

export interface CheckInput {
  startTime: unknown;
  durationMin: unknown;
  blocked?: boolean;
}

export interface CheckResult {
  available: boolean;
  reasonCode: ReasonCode;
  message: string;
  kind: 'decision' | 'validation';
}

export const MESSAGES: Readonly<Record<ReasonCode, string>>;

export function validateRequest(
  input: CheckInput,
  ctx: { day: string; now: number },
): { ok: true; startMs: number; endMs: number } | { ok: false; result: CheckResult };

export function checkRoom(
  input: CheckInput,
  ctx: {
    room: { readonly id: string; readonly blocked: boolean };
    bookings: ReadonlyArray<{ readonly roomId: string; readonly start: number; readonly end: number }>;
    day: string;
    now: number;
  },
): CheckResult;
