import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Assignment, AssignmentType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface AssignmentListProps {
  assignments: Assignment[];
  loading?: boolean;
  onDelete?: (assignmentId: string) => void;
  showActions?: boolean;
}

export function AssignmentList({ assignments, loading, onDelete, showActions = true }: AssignmentListProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">{t('assignments.loadingAssignments')}</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">{t('assignments.noAssignmentsFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div
          key={assignment.assignmentId}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 break-words">
                  {assignment.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-bold whitespace-nowrap ${
                      assignment.status === 'published'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {assignment.status === 'published' ? t('assignments.statusPublished') : t('assignments.statusDraft')}
                  </span>
                  <span
                    className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-bold whitespace-nowrap ${
                      assignment.type === 'reading'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {assignment.type === 'reading' ? t('assignments.reading') : t('assignments.listening')}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 break-words">
                {assignment.prompt}
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-500">
                <span className="whitespace-nowrap">
                  {assignment.settings.numberOfQuestions} {t('assignments.questions')}
                </span>
                <span className="whitespace-nowrap">
                  {t('assignments.created')} {new Date(assignment.createdAt).toLocaleDateString()}
                </span>
                {assignment.questionIds && (
                  <span className="whitespace-nowrap">
                    {assignment.questionIds.length} {t('assignments.questionsGenerated')}
                  </span>
                )}
              </div>
            </div>
            {showActions && (
              <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                <button
                  onClick={() => navigate(`/dashboard/assignments/create/${assignment.assignmentId}`)}
                  className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg font-semibold transition-colors whitespace-nowrap"
                >
                  {t('assignments.edit')}
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(t('assignments.deleteConfirm'))) {
                        onDelete(assignment.assignmentId);
                      }
                    }}
                    className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-semibold transition-colors whitespace-nowrap"
                  >
                    {t('assignments.delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
