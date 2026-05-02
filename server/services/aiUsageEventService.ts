/**
 * Persists ad-hoc Gemini text usage (assignment titles, daily ritual decks,
 * guided writing feedback, etc.) for owner analytics.
 * Uses the same Flash text rates as eval's text leg.
 */

import { connectDB } from '../db/connection';

export type AiUsageSource = 'assignmentTitle' | 'dailyRitualDeck' | 'guidedWritingFeedback';

/** Gemini 2.5 Flash text pricing (aligned with evaluationWorker text eval leg) */
const FLASH_TEXT_PROMPT_PER_TOKEN = 0.0000003; // $0.30 / 1M
const FLASH_TEXT_COMPLETION_PER_TOKEN = 0.0000025; // $2.50 / 1M

export function computeFlashTextCostUsd(promptTokens: number, completionTokens: number): number {
  return promptTokens * FLASH_TEXT_PROMPT_PER_TOKEN + completionTokens * FLASH_TEXT_COMPLETION_PER_TOKEN;
}

export function extractGeminiTextUsage(response: unknown): { promptTokens: number; completionTokens: number } {
  const r = response as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
  const u = r?.usageMetadata;
  return {
    promptTokens: u?.promptTokenCount ?? 0,
    completionTokens: u?.candidatesTokenCount ?? 0,
  };
}

/**
 * Writes one document to `aiUsageEvents`. Swallows errors so callers are not blocked.
 */
export async function recordAiUsageFromGeminiResponse(params: {
  source: AiUsageSource;
  model: string;
  response: unknown;
  userId?: string | null;
}): Promise<void> {
  const { source, model, response, userId } = params;
  const { promptTokens, completionTokens } = extractGeminiTextUsage(response);
  const costUsd = computeFlashTextCostUsd(promptTokens, completionTokens);
  const createdAt = new Date().toISOString();

  try {
    const db = await connectDB();
    await db.collection('aiUsageEvents').insertOne({
      source,
      model,
      userId: userId ?? null,
      promptTokens,
      completionTokens,
      costUsd,
      createdAt,
    });
  } catch (err) {
    console.error('[aiUsageEvents] insert failed:', source, err);
  }
}
