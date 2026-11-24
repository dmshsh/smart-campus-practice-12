export default {
	// Practice #12 — low-code (Appsmith) JS Object. Same contract as src/contract.js in the code-based track.
	// Fictional data only. Fixed demo clock so results are reproducible.
	NOW: Date.UTC(2026, 9, 27, 8, 0, 0), // 2026-10-27 08:00 UTC
	DAY: '2026-10-27',
	MAX_DURATION_MIN: 120,
	ROOM: { id: 'R-101', name: 'Room R-101' },
	BOOKINGS: [
		{ roomId: 'R-101', start: '13:00', end: '14:00' },
		{ roomId: 'R-101', start: '10:00', end: '11:00' },
		{ roomId: 'R-202', start: '15:00', end: '16:00' },
	],
	MESSAGES: {
		OK: 'Available — the room is free for the whole requested interval.',
		INVALID_START: 'Enter a valid start time in HH:MM format (24-hour).',
		START_IN_PAST: 'Start time must be in the future (after 08:00 on the demo clock).',
		INVALID_DURATION: 'Enter the duration as a whole number of minutes.',
		DURATION_NOT_POSITIVE: 'Duration must be greater than 0 minutes.',
		DURATION_TOO_LONG: 'Duration must be at most 120 minutes.',
		ROOM_BLOCKED: 'Unavailable — the room is blocked.',
		OVERLAP: 'Unavailable — the requested interval overlaps an existing booking.',
	},

	toMs(hhmm) {
		if (typeof hhmm !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm.trim())) return NaN;
		return Date.parse(this.DAY + 'T' + hhmm.trim() + ':00Z');
	},

	parseDuration(value) {
		if (typeof value === 'number') return value;
		if (typeof value !== 'string' || value.trim() === '') return NaN;
		const t = value.trim();
		return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
	},

	result(available, reasonCode, kind) {
		return { available, reasonCode, message: this.MESSAGES[reasonCode], kind };
	},

	// Validation (AC1, AC2, AC6) -> booking rules (AC4 blocked, AC3 overlap). Read-only on BOOKINGS (AC5).
	check(startTime, durationMin, blocked) {
		const start = this.toMs(startTime);
		if (Number.isNaN(start)) return this.result(false, 'INVALID_START', 'validation');
		if (start <= this.NOW) return this.result(false, 'START_IN_PAST', 'validation');
		const d = this.parseDuration(durationMin);
		if (!Number.isFinite(d) || !Number.isInteger(d)) return this.result(false, 'INVALID_DURATION', 'validation');
		if (d <= 0) return this.result(false, 'DURATION_NOT_POSITIVE', 'validation');
		if (d > this.MAX_DURATION_MIN) return this.result(false, 'DURATION_TOO_LONG', 'validation');
		const end = start + d * 60000;
		if (blocked === true) return this.result(false, 'ROOM_BLOCKED', 'decision');
		for (const b of this.BOOKINGS) {
			if (b.roomId !== this.ROOM.id) continue;
			if (start < this.toMs(b.end) && end > this.toMs(b.start)) {
				return this.result(false, 'OVERLAP', 'decision');
			}
		}
		return this.result(true, 'OK', 'decision');
	},

	async run() {
		const before = JSON.stringify(this.BOOKINGS);
		const r = this.check(StartInput.text, DurationInput.text, BlockedSwitch.isSwitchedOn);
		r.bookingsUnchanged = JSON.stringify(this.BOOKINGS) === before;
		r.status = r.kind === 'validation' ? 'Invalid input' : (r.available ? 'Available' : 'Unavailable');
		await storeValue('lastResult', r, false);
		return r;
	},
};
