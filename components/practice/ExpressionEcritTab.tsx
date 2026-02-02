import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ExamCard } from './ExamCard';
import { useIsD2C } from '../../utils/userType';
import { subscriptionService } from '../../services/subscriptionService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ExpressionEcritTabProps {
  onStartExam: (mode: 'partA' | 'partB' | 'full') => void;
}

interface WrittenLimits {
  sectionA: { used: number; limit: number };
  sectionB: { used: number; limit: number };
}

export function ExpressionEcritTab({ onStartExam }: ExpressionEcritTabProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getToken } = useAuth();
  const isD2C = useIsD2C();
  const [checkingLimit, setCheckingLimit] = useState<'partA' | 'partB' | null>(null);
  const [writtenLimits, setWrittenLimits] = useState<WrittenLimits | null>(null);

  // D2C: load usage/limits so we can show the wall on the section cards
  useEffect(() => {
    if (!isD2C) return;
    let cancelled = false;
    subscriptionService.getUsage(getToken).then((data: any) => {
      if (cancelled) return;
      const limits = data.limits || {};
      const usage = data.usage || {};
      const limitA = limits.writtenExpressionSectionALimit ?? 1;
      const limitB = limits.writtenExpressionSectionBLimit ?? 1;
      setWrittenLimits({
        sectionA: { used: usage.writtenExpressionSectionAUsed ?? 0, limit: limitA },
        sectionB: { used: usage.writtenExpressionSectionBUsed ?? 0, limit: limitB },
      });
    }).catch(() => {
      if (!cancelled) setWrittenLimits(null);
    });
    return () => { cancelled = true; };
  }, [isD2C, getToken]);

  const atLimitA = isD2C && writtenLimits && writtenLimits.sectionA.limit !== -1 && writtenLimits.sectionA.used >= writtenLimits.sectionA.limit;
  const atLimitB = isD2C && writtenLimits && writtenLimits.sectionB.limit !== -1 && writtenLimits.sectionB.used >= writtenLimits.sectionB.limit;

  const handleStartGuided = async (mode: 'partA' | 'partB') => {
    if (!isD2C) {
      navigate(`/practice/guided-written/${mode}`, {
        state: { from: '/practice', module: 'written', selectedModule: 'written' }
      });
      return;
    }
    // Show wall immediately from loaded limits (no need to click through to find out)
    if (mode === 'partA' && atLimitA) {
      alert(t('errors.writtenExpressionLimitReached'));
      return;
    }
    if (mode === 'partB' && atLimitB) {
      alert(t('errors.writtenExpressionLimitReached'));
      return;
    }
    const section = mode === 'partA' ? 'A' : 'B';
    setCheckingLimit(mode);
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/usage/check-written`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ section }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || t('errors.loadFailed'));
        return;
      }
      if (!data.canStart) {
        alert(data.reason || t('errors.writtenExpressionLimitReached'));
        return;
      }
      navigate(`/practice/guided-written/${mode}`, {
        state: { from: '/practice', module: 'written', selectedModule: 'written' }
      });
    } catch (err: any) {
      alert(err?.message || t('errors.loadFailed'));
    } finally {
      setCheckingLimit(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Regular Practice Section - Only for B2B users */}
      {!isD2C && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
            {t('practice.standardPractice')}
          </h3>
          {/* Mobile: Stacked cards */}
          <div className="md:hidden space-y-2">
            <ExamCard mode="partA" onStart={onStartExam} variant="mobile" isWrittenExpression={true} />
            <ExamCard mode="partB" onStart={onStartExam} variant="mobile" isWrittenExpression={true} />
          </div>

          {/* Desktop: 2-column grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-3">
            <ExamCard mode="partA" onStart={onStartExam} variant="desktop" isWrittenExpression={true} />
            <ExamCard mode="partB" onStart={onStartExam} variant="desktop" isWrittenExpression={true} />
          </div>
        </div>
      )}

      {/* Guided Learning Section - For all users, but D2C users only see this */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
          {t('practice.guidedLearning')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {t('practice.guidedDescription')}
        </p>
        {/* Mobile: Stacked cards */}
        <div className="md:hidden space-y-2">
          <div 
            className={`rounded-lg p-2 border shadow-sm transition-all group ${atLimitA ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 opacity-75 cursor-not-allowed' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-md cursor-pointer'}`}
            onClick={() => !atLimitA && handleStartGuided('partA')}
            aria-busy={checkingLimit === 'partA'}
            aria-disabled={atLimitA}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-base">
                ✍️
              </div>
              {isD2C && writtenLimits && (
                <span className={`text-xs font-semibold ${atLimitA ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {atLimitA ? t('practice.limitReached') : `${writtenLimits.sectionA.used} / ${writtenLimits.sectionA.limit === -1 ? '∞' : writtenLimits.sectionA.limit}`}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              {t('practice.guidedSectionA')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-1">
              {t('practice.guidedSectionADescription')}
            </p>
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              {checkingLimit === 'partA' ? '…' : atLimitA ? t('practice.limitReached') : <>{t('common.commencer')} <span className="ml-1">→</span></>}
            </div>
          </div>
          <div 
            className={`rounded-lg p-2 border shadow-sm transition-all group ${atLimitB ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 opacity-75 cursor-not-allowed' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-md cursor-pointer'}`}
            onClick={() => !atLimitB && handleStartGuided('partB')}
            aria-busy={checkingLimit === 'partB'}
            aria-disabled={atLimitB}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-base">
                ✍️
              </div>
              {isD2C && writtenLimits && (
                <span className={`text-xs font-semibold ${atLimitB ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {atLimitB ? t('practice.limitReached') : `${writtenLimits.sectionB.used} / ${writtenLimits.sectionB.limit === -1 ? '∞' : writtenLimits.sectionB.limit}`}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              {t('practice.guidedSectionB')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-1">
              {t('practice.guidedSectionBDescription')}
            </p>
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              {checkingLimit === 'partB' ? '…' : atLimitB ? t('practice.limitReached') : <>{t('common.commencer')} <span className="ml-1">→</span></>}
            </div>
          </div>
        </div>

        {/* Desktop: 2-column grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-3">
          <div 
            className={`rounded-lg p-2 border shadow-sm transition-all group ${atLimitA ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 opacity-75 cursor-not-allowed' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-md cursor-pointer'}`}
            onClick={() => !atLimitA && handleStartGuided('partA')}
            aria-busy={checkingLimit === 'partA'}
            aria-disabled={atLimitA}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-base">
                ✍️
              </div>
              {isD2C && writtenLimits && (
                <span className={`text-xs font-semibold ${atLimitA ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {atLimitA ? t('practice.limitReached') : `${writtenLimits.sectionA.used} / ${writtenLimits.sectionA.limit === -1 ? '∞' : writtenLimits.sectionA.limit}`}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              {t('practice.guidedSectionA')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              {t('practice.guidedSectionADescription')}
            </p>
            <div className="mt-1.5 flex items-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              {checkingLimit === 'partA' ? '…' : atLimitA ? t('practice.limitReached') : <>{t('common.commencer')} <span className="ml-1.5">→</span></>}
            </div>
          </div>
          <div 
            className={`rounded-lg p-2 border shadow-sm transition-all group ${atLimitB ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 opacity-75 cursor-not-allowed' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-md cursor-pointer'}`}
            onClick={() => !atLimitB && handleStartGuided('partB')}
            aria-busy={checkingLimit === 'partB'}
            aria-disabled={atLimitB}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-base">
                ✍️
              </div>
              {isD2C && writtenLimits && (
                <span className={`text-xs font-semibold ${atLimitB ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {atLimitB ? t('practice.limitReached') : `${writtenLimits.sectionB.used} / ${writtenLimits.sectionB.limit === -1 ? '∞' : writtenLimits.sectionB.limit}`}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              {t('practice.guidedSectionB')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              {t('practice.guidedSectionBDescription')}
            </p>
            <div className="mt-1.5 flex items-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              {checkingLimit === 'partB' ? '…' : atLimitB ? t('practice.limitReached') : <>{t('common.commencer')} <span className="ml-1.5">→</span></>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
