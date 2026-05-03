import { authenticatedFetchJSON } from './authenticatedFetch';

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/owner`;

/** IANA zone for owner chart bucketing (Mongo $dateToString). */
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function localYmdStartIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function localYmdEndIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

function inclusiveLocalDayCount(startYmd: string, endYmd: string): number {
  const [s, e] = startYmd <= endYmd ? [startYmd, endYmd] : [endYmd, startYmd];
  const [ys, ms, ds] = s.split('-').map(Number);
  const [ye, me, de] = e.split('-').map(Number);
  const t1 = new Date(ys, ms - 1, ds).getTime();
  const t2 = new Date(ye, me - 1, de).getTime();
  return Math.floor((t2 - t1) / 86400000) + 1;
}

/** Query string: local calendar bounds + IANA zone for chart series. */
export function buildOwnerDateRangeQuery(startDate: string, endDate: string): string {
  const [s, e] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
  const params = new URLSearchParams();
  params.set('since', localYmdStartIso(s));
  params.set('until', localYmdEndIso(e));
  params.set('startDate', s);
  params.set('endDate', e);
  params.set('totalDays', String(inclusiveLocalDayCount(s, e)));
  params.set('timeZone', getBrowserTimeZone());
  return params.toString();
}

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
  /** From `subscriptions` collection */
  subscriptionTier: 'free' | 'basic' | 'premium';
  subscriptionStatus: string;
  /** Paid tier with Stripe status active or trialing */
  isPayingSubscriber: boolean;
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
  const q = buildOwnerDateRangeQuery(startDate, endDate);
  return authenticatedFetchJSON<OwnerStats>(`${API_BASE}/stats?${q}`, { getToken });
}

export async function fetchActivityChart(
  getToken: () => Promise<string | null>,
  startDate: string,
  endDate: string
): Promise<ActivityChart> {
  const q = buildOwnerDateRangeQuery(startDate, endDate);
  return authenticatedFetchJSON<ActivityChart>(`${API_BASE}/activity-chart?${q}`, { getToken });
}

export async function fetchCostBreakdown(
  getToken: () => Promise<string | null>,
  startDate: string,
  endDate: string
): Promise<CostBreakdown> {
  const q = buildOwnerDateRangeQuery(startDate, endDate);
  return authenticatedFetchJSON<CostBreakdown>(`${API_BASE}/cost-breakdown?${q}`, { getToken });
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
  const q = buildOwnerDateRangeQuery(startDate, endDate);
  return authenticatedFetchJSON<UserCost[]>(`${API_BASE}/user-costs?${q}`, { getToken });
}

export async function fetchRecentSessions(
  getToken: () => Promise<string | null>,
  limit: number,
  startDate?: string,
  endDate?: string
): Promise<RecentSession[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (startDate && endDate) {
    const range = new URLSearchParams(buildOwnerDateRangeQuery(startDate, endDate));
    range.forEach((v, k) => params.set(k, v));
  }
  return authenticatedFetchJSON<RecentSession[]>(`${API_BASE}/recent-sessions?${params}`, {
    getToken,
  });
}
