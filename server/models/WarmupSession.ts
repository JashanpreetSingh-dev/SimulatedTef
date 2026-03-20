export type WarmupSessionStatus = 'active' | 'completed' | 'abandoned';

export interface WarmupSessionFeedback {
  wentWell: string;
  practiceTip: string;
  levelNote: string;
}

export interface WarmupCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface WarmupSession {
  userId: string;
  /**
   * Client-supplied local date in YYYY-MM-DD format.
   */
  date: string;
  status: WarmupSessionStatus;
  /**
   * Total duration of the session in seconds.
   */
  durationSeconds?: number;
  topic?: string;
  keywords?: string[];
  topicsCovered?: string[];
  /**
   * Level estimate at the time of this session (e.g. "A2", "B1").
   */
  levelAtSession?: string;
  /**
   * Streak value at the time this session was completed.
   */
  streak?: number;
  feedback?: WarmupSessionFeedback;
  corrections?: WarmupCorrection[];
  topicId?: string;
  createdAt: Date;
}

