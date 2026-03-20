import { makeWarmupSystemPrompt } from './prompts/warmup';
import { authenticatedFetchJSON } from './authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface WarmupConfigResponse {
  systemPrompt: string;
  phrases: string[];
  userLevel: string;
  streak: number;
}

export const warmupService = {
  async getConfig(localDate: string, topicLabel: string, getToken: () => Promise<string | null>, topicId?: string): Promise<WarmupConfigResponse> {
    const params = new URLSearchParams({ localDate, topic: topicLabel });
    if (topicId) params.set('topicId', topicId);
    return authenticatedFetchJSON<WarmupConfigResponse>(
      `${BACKEND_URL}/api/warmup/config?${params.toString()}`,
      { method: 'GET', getToken },
    );
  },

  async startSession(
    localDate: string,
    topicId: string,
    topicLabel: string,
    getToken: () => Promise<string | null>,
  ): Promise<{ sessionId: string }> {
    return authenticatedFetchJSON<{ sessionId: string }>(
      `${BACKEND_URL}/api/warmup/session/start`,
      { method: 'POST', getToken, body: JSON.stringify({ localDate, topicId, topicLabel }) },
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
    corrections: { original: string; corrected: string; explanation: string }[];
  }> {
    return authenticatedFetchJSON(
      `${BACKEND_URL}/api/warmup/session/complete`,
      { method: 'POST', getToken, body: JSON.stringify({ sessionId, transcript, durationSeconds }) },
    );
  },

  async getSummary(getToken: () => Promise<string | null>): Promise<{ streak: number; levelEstimate: string }> {
    return authenticatedFetchJSON(
      `${BACKEND_URL}/api/warmup/summary`,
      { method: 'GET', getToken },
    );
  },

  async getHistory(getToken: () => Promise<string | null>): Promise<{
    date: string;
    status: string;
    durationSeconds: number;
    topic?: string;
    topicsCovered: string[];
    levelAtSession?: string;
    streak?: number;
  }[]> {
    return authenticatedFetchJSON(
      `${BACKEND_URL}/api/warmup/history`,
      { method: 'GET', getToken },
    );
  },

  makeWarmupSystemPrompt,
};
