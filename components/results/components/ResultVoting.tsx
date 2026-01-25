import React, { useState, useRef, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { SavedResult, VoteType, DownvoteReason } from '../../../types';
import { votingService } from '../../../services/votingService';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ResultVotingProps {
  result: SavedResult;
  onVoteUpdate?: (updatedResult: SavedResult) => void;
  compact?: boolean; // Compact mode for header placement
}

export const ResultVoting: React.FC<ResultVotingProps> = ({ result, onVoteUpdate, compact = false }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show voting for oral expression results
  if (result.module !== 'oralExpression') {
    return null;
  }

  // Don't show voting for loading results
  if (result.isLoading) {
    return null;
  }

  const userId = user?.id;
  if (!userId) {
    return null;
  }

  const votes = result.votes || {
    upvotes: 0,
    downvotes: 0,
    downvoteReasons: {
      inaccurate_score: 0,
      poor_feedback: 0,
      technical_issue: 0,
    },
    userVotes: [],
  };

  const userVote = votingService.getUserVote(result, userId);
  const hasUserVoted = userVote !== null;

  // Close dropdown when clicking outside (supports both mouse and touch)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowReasonDropdown(false);
      }
    };

    if (showReasonDropdown) {
      // Support both mouse and touch events for mobile
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showReasonDropdown]);

  const handleVoteClick = async (vote: VoteType) => {
    if (isSubmitting) return;

    // If clicking the same vote, remove it
    if (userVote?.vote === vote) {
      // Remove vote - we'll implement this if needed
      return;
    }

    // If downvoting, show reason dropdown
    if (vote === 'downvote') {
      setShowReasonDropdown(true);
    } else {
      // Upvote directly
      await submitVote(vote, undefined);
    }
  };

  const handleReasonSelect = async (reason: DownvoteReason) => {
    setShowReasonDropdown(false);
    await submitVote('downvote', reason);
  };

  const submitVote = async (vote: VoteType, reason?: DownvoteReason) => {
    if (isSubmitting || !userId) return;

    setIsSubmitting(true);
    try {
      const updatedResult = await votingService.submitVote(
        result._id!,
        vote,
        reason,
        getToken
      );
      
      if (onVoteUpdate) {
        onVoteUpdate(updatedResult);
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModeLabel = () => {
    if (result.mode === 'full') {
      return t('results.section') + ' A & B';
    } else if (result.mode === 'partA') {
      return t('results.section') + ' A';
    } else {
      return t('results.section') + ' B';
    }
  };

  const downvoteReasons: Array<{ value: DownvoteReason; label: string }> = [
    { value: 'inaccurate_score', label: t('voting.reason.inaccurateScore') || 'Inaccurate score/level' },
    { value: 'poor_feedback', label: t('voting.reason.poorFeedback') || 'Poor or unhelpful feedback' },
    { value: 'technical_issue', label: t('voting.reason.technicalIssue') || 'Technical issue' },
  ];

  // Compact mode for header placement
  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Upvote Button */}
          <button
            onClick={() => handleVoteClick('upvote')}
            disabled={isSubmitting}
            className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border transition-all touch-manipulation ${
              userVote?.vote === 'upvote'
                ? 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-700'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:bg-emerald-100 dark:active:bg-emerald-900/30'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={t('voting.title') || 'Was this evaluation helpful?'}
          >
            <span className="text-base sm:text-lg">👍</span>
          </button>

          {/* Downvote Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => handleVoteClick('downvote')}
              disabled={isSubmitting}
              className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border transition-all touch-manipulation ${
                userVote?.vote === 'downvote'
                  ? 'bg-rose-500 dark:bg-rose-600 text-white border-rose-600 dark:border-rose-700'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:bg-rose-100 dark:active:bg-rose-900/30'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={t('voting.title') || 'Was this evaluation helpful?'}
            >
              <span className="text-base sm:text-lg">👎</span>
            </button>

            {/* Dropdown for downvote reasons */}
            {showReasonDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 sm:w-56 max-w-[calc(100vw-2rem)] sm:max-w-none bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                <div className="p-2">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-2">
                    {t('voting.selectReason') || 'Select reason'}
                  </div>
                  {downvoteReasons.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => handleReasonSelect(reason.value)}
                      disabled={isSubmitting}
                      className="w-full text-left px-3 py-2.5 sm:py-2 rounded-md text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:bg-indigo-100 dark:active:bg-indigo-900/30 transition-colors disabled:opacity-50 touch-manipulation"
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full mode (original layout)
  return (
    <>
      <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm transition-colors">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1">
                {t('voting.title') || 'Was this evaluation helpful?'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {getModeLabel()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Upvote Button */}
            <button
              onClick={() => handleVoteClick('upvote')}
              disabled={isSubmitting}
              className={`flex items-center justify-center px-4 py-2 rounded-lg border transition-all ${
                userVote?.vote === 'upvote'
                  ? 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-lg">👍</span>
            </button>

            {/* Downvote Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => handleVoteClick('downvote')}
                disabled={isSubmitting}
                className={`flex items-center justify-center px-4 py-2 rounded-lg border transition-all ${
                  userVote?.vote === 'downvote'
                    ? 'bg-rose-500 dark:bg-rose-600 text-white border-rose-600 dark:border-rose-700'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-lg">👎</span>
              </button>

              {/* Dropdown for downvote reasons */}
              {showReasonDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                  <div className="p-2">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-2">
                      {t('voting.selectReason') || 'Select reason'}
                    </div>
                    {downvoteReasons.map((reason) => (
                      <button
                        key={reason.value}
                        onClick={() => handleReasonSelect(reason.value)}
                        disabled={isSubmitting}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50"
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vote counts summary */}
            <div className="flex-1 text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {votes.upvotes + votes.downvotes} {t('voting.totalVotes') || 'total votes'}
              </div>
            </div>
          </div>

          {/* Show user's current vote reason if downvoted */}
          {userVote?.vote === 'downvote' && userVote.reason && (
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-2">
              <span className="font-bold">{t('voting.yourReason') || 'Your reason'}:</span>{' '}
              {downvoteReasons.find((r) => r.value === userVote.reason)?.label}
            </div>
          )}
        </div>
      </div>

    </>
  );
};
