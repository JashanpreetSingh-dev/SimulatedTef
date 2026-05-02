import { authenticatedFetchJSON } from './authenticatedFetch';

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/owner`;

// --- Response types ---

export interface OwnerStats {
  users: {
    total: number;
    d2c: number;
    org: number;
  };
  subscriptions: {
    free: number;
    basic: number;
    premium: number;
    canceled: number;
  };
  activity: {
    speakingSessions: number;
    evaluations: number;
    writingFeedback: number;
    mockExams: number;
  };
  cost: {
    speaking: number;
    oralEval: number;
    writtenEval: number;
    /** Gemini daily ritual deck generation */
    dailyRitual: number;
    /** Guided writing on-demand feedback */
    guidedWriting: number;
    /** Assignment titles and any legacy events without a split source */
    otherAi: number;
    total: number;
  };
}

export interface ActivityChart {
  labels: string[];
  speaking: number[];
  evaluations: number[];
  newSignups: number[];
}

export interface CostBreakdown {
  labels: string[];
  speaking: number[];
  oralEval: number[];
  writtenEval: number[];
  dailyRitual: number[];
  guidedWriting: number[];
  /** Assignment titles and other misc `aiUsageEvents` */
  otherAi: number[];
}

export interface SessionHealth {
  completed: number;
  abandoned: number;
  failed: number;
  avgDurationSeconds: number;
  avgTokensPerSession: number;
  totalCostThisMonth: number;
}

export interface RecentSession {
  userId: string;
  userEmail: string;
  examType: string;
  startedAt: string;
  duration: number;
  status: string;
  cost: number;
  billedPromptTokens: number;
  completionTokens: number;
  turns: number;
}

export interface UserCost {
  userId: string;
  userEmail: string;
  speakingSessions: number;
  speakingCost: number;
  oralEvals: number;
  oralEvalCost: number;
  writtenEvals: number;
  writtenEvalCost: number;
  dailyRitualEvents: number;
  dailyRitualCost: number;
  guidedWritingEvents: number;
  guidedWritingCost: number;
  otherEvents: number;
  otherAiCost: number;
  totalCost: number;
}

// --- Fetch helpers ---

export async function fetchOwnerStats(
  getToken: () => Promise<string | null>,
  startDate: string,
  endDate: string
): Promise<OwnerStats> {
  return authenticatedFetchJSON<OwnerStats>(
    `${API_BASE}/stats?startDate=${startDate}&endDate=${endDate}`,
    { getToken }
  );
}

export async function fetchActivityChart(
  getToken: () => Promise<string | null>,
  startDate: string,
  endDate: string
): Promise<ActivityChart> {
  return authenticatedFetchJSON<ActivityChart>(
    `${API_BASE}/activity-chart?startDate=${startDate}&endDate=${endDate}`,
    { getToken }
  );
}

export async function fetchCostBreakdown(
  getToken: () => Promise<string | null>,
  startDate: string,
  endDate: string
): Promise<CostBreakdown> {
  return authenticatedFetchJSON<CostBreakdown>(
    `${API_BASE}/cost-breakdown?startDate=${startDate}&endDate=${endDate}`,
    { getToken }
  );
}

export async function fetchSessionHealth(
  getToken: () => Promise<string | null>
): Promise<SessionHealth> {
  return authenticatedFetchJSON<SessionHealth>(`${API_BASE}/session-health`, {
    getToken,
  });
}

export async function fetchUserCosts(
  getToken: () => Promise<string | null>,
  startDate: string,
  endDate: string
): Promise<UserCost[]> {
  return authenticatedFetchJSON<UserCost[]>(
    `${API_BASE}/user-costs?startDate=${startDate}&endDate=${endDate}`,
    { getToken }
  );
}

export async function fetchRecentSessions(
  getToken: () => Promise<string | null>,
  limit: number,
  startDate?: string,
  endDate?: string
): Promise<RecentSession[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  return authenticatedFetchJSON<RecentSession[]>(`${API_BASE}/recent-sessions?${params}`, {
    getToken,
  });
}
