import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Batch } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface BatchCardProps {
  batch: Batch;
  assignmentCount?: number;
  onDelete?: (batchId: string) => void;
}

export function BatchCard({ batch, assignmentCount, onDelete }: BatchCardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/dashboard/batches/${batch.batchId}`)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 break-words mb-3">
            {batch.name}
          </h3>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-500">
            <span className="whitespace-nowrap">
              👥 {batch.studentIds.length} {batch.studentIds.length === 1 ? t('batches.student') : t('batches.studentsPlural')}
            </span>
            {assignmentCount !== undefined && (
              <span className="whitespace-nowrap">
                📋 {assignmentCount} {assignmentCount === 1 ? t('batches.assignment') : t('batches.assignmentsPlural')}
              </span>
            )}
            <span className="whitespace-nowrap">
              {t('batches.created')} {new Date(batch.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {onDelete && (
          <div className="flex gap-2 sm:ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => navigate(`/dashboard/batches/${batch.batchId}`)}
              className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg font-semibold transition-colors whitespace-nowrap"
            >
              {t('batches.view')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) {
                  onDelete(batch.batchId);
                }
              }}
              className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-semibold transition-colors whitespace-nowrap"
            >
              {t('batches.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}