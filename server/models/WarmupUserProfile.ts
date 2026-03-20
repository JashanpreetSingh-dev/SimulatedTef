export interface WarmupUserProfile {
  userId: string;
  /**
   * Current CEFR-like level estimate (e.g. "A2", "B1", "B2").
   */
  levelEstimate: string;
  /**
   * Historical level estimates over time (most recent last).
   */
  levelHistory: string[];
  strengths: string[];
  weaknesses: string[];
  /**
   * Topics the user has explored in previous sessions.
   */
  topicsExplored: string[];
  /**
   * Total number of completed warm-up sessions.
   */
  totalSessions: number;
  /**
   * ISO date string (YYYY-MM-DD) of the last completed session.
   */
  lastSessionDate?: string;
  /**
   * Timestamp of the last profile update.
   */
  updatedAt: Date;
}

