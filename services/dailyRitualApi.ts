import type { DailyRitualCard } from '../types';
import { authenticatedFetchJSON } from './authenticatedFetch';

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/revision`;

export type DailyRitualFocus = 'vocab' | 'grammar' | 'mixed';
export type DailyRitualCefrHint = 'B2' | 'C1';

export interface FetchDailyDeckOptions {
  focus?: DailyRitualFocus;
  cefrHint?: DailyRitualCefrHint;
  cardCount?: number;
  skipCache?: boolean;
}

export interface DailyDeckResponse {
  cards: DailyRitualCard[];
  cached: boolean;
}

export async function fetchDailyDeck(
  getToken: () => Promise<string | null>,
  options: FetchDailyDeckOptions = {}
): Promise<DailyDeckResponse> {
  const body = {
    focus: options.focus ?? 'mixed',
    cefrHint: options.cefrHint ?? 'B2',
    cardCount: options.cardCount ?? 24,
    skipCache: options.skipCache ?? false,
  };
  return authenticatedFetchJSON<DailyDeckResponse>(`${API_BASE}/daily-deck`, {
    method: 'POST',
    getToken,
    body: JSON.stringify(body),
    timeout: 120000,
  });
}

export async function saveWeakCard(
  getToken: () => Promise<string | null>,
  card: DailyRitualCard
): Promise<void> {
  await authenticatedFetchJSON(`${API_BASE}/weak-card`, {
    method: 'POST',
    getToken,
    body: JSON.stringify({ card }),
    timeout: 15000,
  });
}
