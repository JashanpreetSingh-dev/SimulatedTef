import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { ExamCard } from './ExamCard';

interface ExpressionEcritTabProps {
  onStartExam: (mode: 'partA' | 'partB' | 'full') => void;
}

export function ExpressionEcritTab({ onStartExam }: ExpressionEcritTabProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleStartGuided = (mode: 'partA' | 'partB') => {
    navigate(`/practice/guided-written/${mode}`, {
      state: {
        from: '/practice',
        module: 'written',
        selectedModule: 'written'
      }
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Regular Practice Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
          {t('practice.standardPractice')}
        </h3>
        {/* Mobile: Stacked cards */}
        <div className="md:hidden space-y-4">
          <ExamCard mode="partA" onStart={onStartExam} variant="mobile" isWrittenExpression={true} />
          <ExamCard mode="partB" onStart={onStartExam} variant="mobile" isWrittenExpression={true} />
          <ExamCard mode="full" onStart={onStartExam} variant="mobile" isWrittenExpression={true} />
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          <ExamCard mode="partA" onStart={onStartExam} variant="desktop" isWrittenExpression={true} />
          <ExamCard mode="partB" onStart={onStartExam} variant="desktop" isWrittenExpression={true} />
          <ExamCard mode="full" onStart={onStartExam} variant="desktop" isWrittenExpression={true} />
        </div>
      </div>

      {/* Guided Learning Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
          {t('practice.guidedLearning')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {t('practice.guidedDescription')}
        </p>
        {/* Mobile: Stacked cards */}
        <div className="md:hidden space-y-4">
          <div 
            className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            onClick={() => handleStartGuided('partA')}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                ✍️
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              {t('practice.guidedSectionA')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-2">
              {t('practice.guidedSectionADescription')}
            </p>
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              {t('common.commencer')} <span className="ml-1">→</span>
            </div>
          </div>
          <div 
            className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            onClick={() => handleStartGuided('partB')}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                ✍️
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              {t('practice.guidedSectionB')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-2">
              {t('practice.guidedSectionBDescription')}
            </p>
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              {t('common.commencer')} <span className="ml-1">→</span>
            </div>
          </div>
        </div>

        {/* Desktop: 2-column grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          <div 
            className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            onClick={() => handleStartGuided('partA')}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                ✍️
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              {t('practice.guidedSectionA')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              {t('practice.guidedSectionADescription')}
            </p>
            <div className="mt-3 flex items-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              {t('common.commencer')} <span className="ml-1.5">→</span>
            </div>
          </div>
          <div 
            className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            onClick={() => handleStartGuided('partB')}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                ✍️
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              {t('practice.guidedSectionB')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              {t('practice.guidedSectionBDescription')}
            </p>
            <div className="mt-3 flex items-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              {t('common.commencer')} <span className="ml-1.5">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
