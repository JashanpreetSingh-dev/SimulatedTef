/**
 * EmailPreference — stores per-user email opt-out state.
 * Collection: emailPreferences
 * Unique index: { userId: 1 }
 */

export interface EmailPreference {
  userId: string;
  unsubscribedAt: string; // ISO timestamp
  source: 'link' | 'admin'; // how the opt-out was recorded
}
