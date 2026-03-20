import { makeWarmupSystemPrompt } from './prompts/warmup';
import { authenticatedFetchJSON } from './authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface WarmupConfigResponse {
  systemPrompt: string;
  topic: string;
  keywords: string[];
  userLevel: string;
  streak: number;
}

export const warmupService = {
  async getConfig(localDate: string, getToken: () => Promise<string | null>): Promise<WarmupConfigResponse> {
    return authenticatedFetchJSON<WarmupConfigResponse>(
      `${BACKEND_URL}/api/warmup/config?localDate=${encodeURIComponent(localDate)}`,
      { method: 'GET', getToken },
    );
  },

  async startSession(localDate: string, getToken: () => Promise<string | null>): Promise<{ sessionId: string }> {
    return authenticatedFetchJSON<{ sessionId: string }>(
      `${BACKEND_URL}/api/warmup/session/start`,
      { method: 'POST', getToken, body: JSON.stringify({ localDate }) },
    );
  },

  async completeSession(
    sessionId: string,
    transcript: string,
    durationSeconds: number,
    getToken: () => Promise<string | null>,
  ): Promise<{
    streak: number;
    feedback: {
      wentWell: string;
      practiceTip: string;
      levelNote: string;
    };
    topicsCovered: string[];
    levelAtSession: string;
  }> {
    return authenticatedFetchJSON(
      `${BACKEND_URL}/api/warmup/session/complete`,
      { method: 'POST', getToken, body: JSON.stringify({ sessionId, transcript, durationSeconds }) },
    );
  },

  makeWarmupSystemPrompt,
};
