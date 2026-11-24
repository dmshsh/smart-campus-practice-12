// MOCK LLM adapter — clearly labelled, free, no network, no API key.
// It follows the same contract a real server-side adapter would: generate({ system, user, context, signal }) -> JSON string.
// A real adapter must live on a server (API key never in the browser); this project has no backend by design (AGENTS.md).
import { templateExplanation } from './explain.js';

export const MOCK_MODES = Object.freeze({
  normal: 'Normal (mock answer)',
  timeout: 'Simulate timeout',
  error: 'Simulate API failure',
  'invalid-json': 'Simulate malformed output',
  contradict: 'Simulate output contradicting status',
  invented: 'Simulate invented booking details',
});

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(new Error('aborted'));
  }, { once: true });
});

export function createMockAdapter({ simulate = 'normal', delayMs = 300 } = {}) {
  return {
    name: 'mock',
    async generate({ context, signal }) {
      if (simulate === 'timeout') await sleep(60_000, signal);
      if (delayMs > 0) await sleep(delayMs, signal);
      if (simulate === 'error') throw new Error('Simulated API failure (HTTP 503)');
      if (simulate === 'invalid-json') return 'Sure! The room looks free to me.';
      if (simulate === 'contradict') {
        const text = context.isAvailable ? 'Sorry, the room is not available.' : 'Good news, the room is available.';
        return JSON.stringify({ explanation: text });
      }
      if (simulate === 'invented') {
        return JSON.stringify({ explanation: 'The room is booked by Professor Smith from 07:15 to 23:45.' });
      }
      return JSON.stringify({ explanation: templateExplanation(context) });
    },
  };
}
