/**
 * AssignmentForm Component
 * 
 * Form for creating new assignments.
 * Uses standardized spacing from utils/designTokens.ts:
 * - Form spacing: space-y-6 (24px) between form groups
 * - Input height: h-10 (40px) for standard inputs
 * - Button padding: py-4 px-6 (standard buttons)
 * - Label spacing: mb-4 (16px) below labels
 */

import React, { useState } from 'react';
import { AssignmentType, AssignmentSettings } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface AssignmentFormProps {
  onSubmit: (data: {
    type: AssignmentType;
    title?: string;
    prompt: string;
    settings: AssignmentSettings;
  }) => void;
  onCancel?: () => void;
  initialData?: {
    type?: AssignmentType;
    title?: string;
    prompt?: string;
    settings?: Partial<AssignmentSettings>;
  };
  loading?: boolean;
}

export function AssignmentForm({ onSubmit, onCancel, initialData, loading }: AssignmentFormProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<AssignmentType>(initialData?.type || 'reading');
  const [title, setTitle] = useState(initialData?.title || '');
  const [prompt, setPrompt] = useState(initialData?.prompt || '');
  const [numberOfQuestions, setNumberOfQuestions] = useState(
    initialData?.settings?.numberOfQuestions || 40
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      alert(t('assignments.promptRequired'));
      return;
    }

    const settings: AssignmentSettings = {
      numberOfQuestions,
    };

    onSubmit({
      type,
      title: title.trim() || undefined,
      prompt: prompt.trim(),
      settings,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Assignment Type */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
          {t('assignments.assignmentType')}
        </label>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="reading"
              checked={type === 'reading'}
              onChange={(e) => setType(e.target.value as AssignmentType)}
              className="w-4 h-4 text-indigo-600 flex-shrink-0"
            />
            <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">{t('assignments.readingComprehension')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="listening"
              checked={type === 'listening'}
              onChange={(e) => setType(e.target.value as AssignmentType)}
              className="w-4 h-4 text-indigo-600 flex-shrink-0"
            />
            <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">{t('assignments.listeningComprehension')}</span>
          </label>
        </div>
      </div>

      {/* Title (Optional) */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
          {t('assignments.titleLabel')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('assignments.titlePlaceholder')}
          className="w-full h-10 px-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
          {t('assignments.promptLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('assignments.promptPlaceholder')}
          rows={4}
          required
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('assignments.promptHelper')}
        </p>
      </div>

      {/* Number of Questions */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
          {t('assignments.numberOfQuestions')}
        </label>
        <input
          type="number"
          min="1"
          max="40"
          value={numberOfQuestions}
          onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 40)}
          className="w-full h-10 px-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('assignments.numberOfQuestionsHelper')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {loading ? t('assignments.creating') : t('assignments.createButton')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            {t('assignments.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
