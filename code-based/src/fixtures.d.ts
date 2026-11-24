export interface Booking {
  readonly roomId: string;
  readonly start: number;
  readonly end: number;
}

export interface Room {
  readonly id: string;
  readonly name: string;
  readonly blocked: boolean;
}

export const NOW: number;
export const DAY: string;
export const ROOM: Room;
export const BOOKINGS: readonly Booking[];
