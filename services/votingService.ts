/**
 * Voting service for Speaking results
 */

import { authenticatedFetchJSON } from './authenticatedFetch';
import { SavedResult, VoteType, DownvoteReason } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

type TokenGetter = () => Promise<string | null>;

export const votingService = {
  /**
   * Submit a vote for a result
   * Vote scope is determined by result.mode on the backend
   */
  async submitVote(
    resultId: string,
    vote: VoteType,
    reason: DownvoteReason | undefined,
    getToken: TokenGetter
  ): Promise<SavedResult> {
    const response = await authenticatedFetchJSON<{ success: boolean; result: SavedResult }>(
      `${BACKEND_URL}/api/results/${resultId}/vote`,
      {
        method: 'POST',
        getToken,
        body: JSON.stringify({
          vote,
          reason,
        }),
      }
    );

    if (!response.success) {
      throw new Error('Failed to submit vote');
    }

    return response.result;
  },

  /**
   * Get user's current vote for a result
   * Returns the vote from the result's votes.userVotes array
   */
  getUserVote(result: SavedResult, userId: string): { vote: VoteType; reason?: DownvoteReason } | null {
    if (!result.votes || !result.votes.userVotes) {
      return null;
    }

    const userVote = result.votes.userVotes.find((v) => v.userId === userId);
    if (!userVote) {
      return null;
    }

    return {
      vote: userVote.vote,
      reason: userVote.reason,
    };
  },
};
