import type { Reason } from './availability.js';

export interface ExplainInput {
  roomLabel: string;
  start: string;
  end: string;
  isAvailable: boolean;
  reasonCode: Reason | null;
}
export interface ExplainContext {
  readonly room: string;
  readonly date: string;
  readonly requestedStart: string;
  readonly requestedEnd: string;
  readonly timezone: 'UTC';
  readonly isAvailable: boolean;
  readonly reasonCode: Reason | 'AVAILABLE';
  readonly reasonMeaning: string;
}
export interface LlmAdapter {
  readonly name: string;
  generate(args: { system: string; user: string; context: ExplainContext; signal: AbortSignal }): Promise<unknown>;
}
export type ExplainResult =
  | { ok: false; error: 'INVALID_INPUT'; errors: string[] }
  | { ok: true; text: string; source: string; generated: boolean; fallbackReason?: string };

export const PROMPT_VERSION: string;
export const SYSTEM_INSTRUCTION: string;
export const REASON_CODES: readonly Reason[];
export const REASON_MEANING: Readonly<Record<Reason | 'AVAILABLE', string>>;
export const INPUT_LIMITS: { readonly maxLabelLength: number };
export const OUTPUT_LIMITS: { readonly maxChars: number; readonly maxSentences: number };
export const DEFAULT_TIMEOUT_MS: number;
export function validateExplainInput(input: unknown): { ok: true; value: ExplainInput } | { ok: false; errors: string[] };
export function buildContext(value: ExplainInput, day: string): ExplainContext;
export function buildUserMessage(context: ExplainContext): string;
export function templateExplanation(context: ExplainContext): string;
export function validateExplanation(raw: unknown, context: ExplainContext): { ok: true; text: string } | { ok: false; reason: string };
export function explainAvailability(
  input: unknown,
  adapter: LlmAdapter | null,
  options: { day: string; timeoutMs?: number },
): Promise<ExplainResult>;
