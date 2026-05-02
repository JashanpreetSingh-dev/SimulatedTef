import type { WrittenTask } from '../types';
import type { GuidedFeedback } from './guidedWritingFeedback';
import { authenticatedFetchJSON } from './authenticatedFetch';

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/revision`;

export async function fetchGuidedWritingFeedback(
  getToken: () => Promise<string | null>,
  params: { text: string; section: 'A' | 'B'; task: WrittenTask }
): Promise<GuidedFeedback> {
  const { text, section, task } = params;
  return authenticatedFetchJSON<GuidedFeedback>(`${API_BASE}/guided-writing-feedback`, {
    method: 'POST',
    getToken,
    body: JSON.stringify({ text, section, task }),
    timeout: 120000,
  });
}
