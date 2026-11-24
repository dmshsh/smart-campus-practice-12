import type { LlmAdapter } from './explain.js';

export type MockMode = 'normal' | 'timeout' | 'error' | 'invalid-json' | 'contradict' | 'invented';
export const MOCK_MODES: Readonly<Record<MockMode, string>>;
export function createMockAdapter(options?: { simulate?: MockMode; delayMs?: number }): LlmAdapter;
