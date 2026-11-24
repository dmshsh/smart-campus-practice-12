import { useState, useMemo, useRef } from 'react';
import { checkRoom } from '@/contract.js';
import type { CheckResult } from '@/contract.js';
import type { Reason } from '@/availability.js';
import { NOW, DAY, ROOM, BOOKINGS } from '@/fixtures.js';
import { explainAvailability } from '@/explain.js';
import type { ExplainResult } from '@/explain.js';
import { createMockAdapter, MOCK_MODES } from '@/mockAdapter.js';
import type { MockMode } from '@/mockAdapter.js';

// Presentation layer only: validation lives in contract.js, booking rules in availability.js.

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// The exact request that produced the current result, so the explanation always matches the shown decision.
interface CheckedRequest {
  start: string;
  end: string;
  duration: number;
}

function App() {
  const [start, setStart] = useState('09:00');
  const [duration, setDuration] = useState('30');
  const [blocked, setBlocked] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checked, setChecked] = useState<CheckedRequest | null>(null);
  const [explanation, setExplanation] = useState<ExplainResult | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [mockMode, setMockMode] = useState<MockMode>('normal');
  const requestSeq = useRef(0);

  const bookingsView = useMemo(
    () =>
      BOOKINGS.map((b) => ({
        roomId: b.roomId,
        start: new Date(b.start).toISOString().slice(11, 16),
        end: new Date(b.end).toISOString().slice(11, 16),
      })),
    []
  );

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    requestSeq.current += 1; // any explanation still in flight belongs to the old result
    setExplanation(null);
    setExplaining(false);
    // Bookings are frozen fixtures; the contract never mutates them (AC5).
    const res = checkRoom({ startTime: start, durationMin: duration, blocked }, { room: ROOM, bookings: BOOKINGS, day: DAY, now: NOW });
    setResult(res);
    const d = Number(duration);
    setChecked(res.kind === 'decision' ? { start, end: addMinutes(start, d), duration: d } : null);
  };

  // Optional explanation (Practice #11). It only reads the deterministic result; it never calls setResult.
  const handleExplain = async () => {
    if (!result || !checked || result.kind !== 'decision') return;
    const seq = ++requestSeq.current;
    setExplaining(true);
    const reasonCode: Reason | null = result.reasonCode === 'OK' ? null : (result.reasonCode as Reason);
    const res = await explainAvailability(
      { roomLabel: ROOM.name, start: checked.start, end: checked.end, isAvailable: result.available, reasonCode },
      createMockAdapter({ simulate: mockMode }),
      { day: DAY }
    );
    if (seq !== requestSeq.current) return; // stale: the user checked again meanwhile
    setExplanation(res);
    setExplaining(false);
  };

  const resultClass = result ? (result.available ? 'result available' : 'result unavailable') : 'result idle';
  const statusText = !result ? '' : result.kind === 'validation' ? 'Invalid input' : result.available ? 'Available' : 'Unavailable';

  return (
    <div className="page">
      <div className="shell">
        <header className="header">
          <h1>Smart Campus — Room Availability</h1>
          <p className="sub">Check whether Room R-101 is free for a new booking.</p>
          <div className="clock">
            <span>Demo clock (NOW): {DAY} 08:00 UTC</span>
          </div>
        </header>

        <div className="grid">
          {/* Form + Result */}
          <div>
            <form className="card" onSubmit={handleCheck} noValidate>
              <h2>Availability check</h2>

              <div className="field">
                <label htmlFor="start">Start time (HH:MM, UTC)</label>
                <input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="duration">Duration (minutes, 1–120)</label>
                <input
                  id="duration"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  aria-describedby="result-status"
                />
              </div>

              <label className="row">
                <input id="blocked" type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
                <span>Room is blocked</span>
              </label>

              <button className="btn" type="submit">
                Check availability
              </button>
            </form>

            <div id="result-status" className={resultClass} role="status" aria-live="polite" style={{ marginTop: 16 }}>
              {!result && <span>Enter a start time and duration, then press “Check availability”.</span>}
              {result && (
                <>
                  <div className="label">
                    {result.kind === 'validation' ? 'Validation error (nothing was checked)' : 'Confirmed status (booking rules)'}
                  </div>
                  <div className="status" data-testid="status">
                    {statusText}
                  </div>
                  <div className="reason">
                    <strong data-testid="reason-code">{result.reasonCode}</strong> — {result.message}
                  </div>
                  {checked && (
                    <div className="reason">
                      Requested: {DAY} {checked.start} → {checked.end} UTC ({checked.duration} min)
                    </div>
                  )}
                </>
              )}
            </div>

            {result && result.kind === 'decision' && (
              <section className="card explain" aria-labelledby="explain-title" style={{ marginTop: 16 }}>
                <h2 id="explain-title">Explain availability (optional)</h2>
                <div className="field">
                  <label htmlFor="mock-mode">Mock LLM mode (demo / testing)</label>
                  <select id="mock-mode" value={mockMode} onChange={(e) => setMockMode(e.target.value as MockMode)}>
                    {(Object.keys(MOCK_MODES) as MockMode[]).map((m) => (
                      <option key={m} value={m}>
                        {MOCK_MODES[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn secondary" type="button" onClick={handleExplain} disabled={explaining}>
                  {explaining ? 'Explaining…' : 'Explain availability'}
                </button>

                {explanation && explanation.ok && (
                  <div className="explanation" aria-live="polite">
                    <span className={explanation.generated ? 'badge ai' : 'badge fallback'}>
                      {explanation.generated
                        ? 'AI-generated explanation · MOCK adapter'
                        : `Standard explanation · AI unavailable (${explanation.fallbackReason})`}
                    </span>
                    <p className="explanation-text">{explanation.text}</p>
                  </div>
                )}
                {explanation && !explanation.ok && (
                  <div className="explanation error" aria-live="polite">
                    <span className="badge fallback">Explanation not generated · input rejected</span>
                    <p className="explanation-text">{explanation.errors.join(' ')}</p>
                  </div>
                )}
                <p className="legend">
                  The explanation is generated text. It never changes the confirmed status above and does not create a
                  booking.
                </p>
              </section>
            )}
          </div>

          {/* Bookings */}
          <aside className="card">
            <h2>Bookings for today</h2>
            <ul className="bookings" data-testid="bookings">
              {bookingsView.map((b, i) => (
                <li key={i} className={b.roomId === ROOM.id ? 'booking' : 'booking other'}>
                  <span className="times">
                    {b.start}–{b.end}
                  </span>
                  <span className="room-tag">{b.roomId}</span>
                </li>
              ))}
            </ul>
            <p className="legend">All times UTC. List order is fixed and not sorted. Checks never change this list.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
