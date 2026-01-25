/**
 * Vote analytics service for admin dashboard
 */

import { connectDB } from '../db/connection';
import { ObjectId } from 'mongodb';

export interface VoteAnalytics {
  summary: {
    totalResults: number;
    totalUpvotes: number;
    totalDownvotes: number;
    totalVotes: number;
    upvotePercentage: number;
    downvotePercentage: number;
  };
  byMode: {
    full: {
      totalResults: number;
      upvotes: number;
      downvotes: number;
      votes: number;
    };
    partA: {
      totalResults: number;
      upvotes: number;
      downvotes: number;
      votes: number;
    };
    partB: {
      totalResults: number;
      upvotes: number;
      downvotes: number;
      votes: number;
    };
  };
  byReason: {
    inaccurate_score: number;
    poor_feedback: number;
    technical_issue: number;
  };
  topDownvotedResults: Array<{
    resultId: string;
    title: string;
    mode: string;
    downvotes: number;
    upvotes: number;
    downvoteReasons: {
      inaccurate_score: number;
      poor_feedback: number;
      technical_issue: number;
    };
  }>;
  recentVotes: Array<{
    resultId: string;
    userId: string;
    vote: 'upvote' | 'downvote';
    reason?: string;
    timestamp: string;
  }>;
}

export const voteAnalyticsService = {
  /**
   * Get aggregated vote analytics for all oral expression results
   */
  async getAnalytics(
    orgUserIds?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<VoteAnalytics> {
    const db = await connectDB();

    // Build filter for oral expression results
    const filter: any = {
      module: 'oralExpression',
    };

    // Filter by organization users if provided
    if (orgUserIds && orgUserIds.length > 0) {
      filter.userId = { $in: orgUserIds };
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate).toISOString();
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end.toISOString();
      }
    }

    // Get all results with votes
    const results = await db.collection('results').find(filter).toArray();

    // Initialize analytics
    let totalUpvotes = 0;
    let totalDownvotes = 0;
    const byMode = {
      full: { totalResults: 0, upvotes: 0, downvotes: 0, votes: 0 },
      partA: { totalResults: 0, upvotes: 0, downvotes: 0, votes: 0 },
      partB: { totalResults: 0, upvotes: 0, downvotes: 0, votes: 0 },
    };
    const byReason = {
      inaccurate_score: 0,
      poor_feedback: 0,
      technical_issue: 0,
    };
    const topDownvotedResults: VoteAnalytics['topDownvotedResults'] = [];
    const recentVotes: VoteAnalytics['recentVotes'] = [];

    // Process each result
    for (const result of results) {
      if (!result.votes) continue;

      const votes = result.votes;
      const upvotes = votes.upvotes || 0;
      const downvotes = votes.downvotes || 0;

      totalUpvotes += upvotes;
      totalDownvotes += downvotes;

      // Aggregate by mode
      const mode = result.mode || 'full';
      if (mode === 'full' || mode === 'partA' || mode === 'partB') {
        byMode[mode].totalResults++;
        byMode[mode].upvotes += upvotes;
        byMode[mode].downvotes += downvotes;
        byMode[mode].votes += upvotes + downvotes;
      }

      // Aggregate by reason
      if (votes.downvoteReasons) {
        byReason.inaccurate_score += votes.downvoteReasons.inaccurate_score || 0;
        byReason.poor_feedback += votes.downvoteReasons.poor_feedback || 0;
        byReason.technical_issue += votes.downvoteReasons.technical_issue || 0;
      }

      // Track top downvoted results
      if (downvotes > 0) {
        topDownvotedResults.push({
          resultId: result._id?.toString() || '',
          title: result.title || 'Untitled',
          mode: result.mode || 'full',
          downvotes,
          upvotes,
          downvoteReasons: votes.downvoteReasons || {
            inaccurate_score: 0,
            poor_feedback: 0,
            technical_issue: 0,
          },
        });
      }

      // Collect recent votes
      if (votes.userVotes && Array.isArray(votes.userVotes)) {
        for (const userVote of votes.userVotes) {
          recentVotes.push({
            resultId: result._id?.toString() || '',
            userId: userVote.userId,
            vote: userVote.vote,
            reason: userVote.reason,
            timestamp: userVote.timestamp,
          });
        }
      }
    }

    // Sort top downvoted results
    topDownvotedResults.sort((a, b) => b.downvotes - a.downvotes);
    const top10 = topDownvotedResults.slice(0, 10);

    // Sort recent votes by timestamp
    recentVotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recent20 = recentVotes.slice(0, 20);

    const totalVotes = totalUpvotes + totalDownvotes;
    const upvotePercentage = totalVotes > 0 ? (totalUpvotes / totalVotes) * 100 : 0;
    const downvotePercentage = totalVotes > 0 ? (totalDownvotes / totalVotes) * 100 : 0;

    return {
      summary: {
        totalResults: results.length,
        totalUpvotes,
        totalDownvotes,
        totalVotes,
        upvotePercentage: Math.round(upvotePercentage * 100) / 100,
        downvotePercentage: Math.round(downvotePercentage * 100) / 100,
      },
      byMode,
      byReason,
      topDownvotedResults: top10,
      recentVotes: recent20,
    };
  },
};
