import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAssignments } from '../../hooks/useAssignments';
import { Assignment } from '../../types';

export function ReadingTab() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { fetchPublishedAssignments, loading } = useAssignments();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssignments = async () => {
    try {
      const published = await fetchPublishedAssignments('reading');
      if (published) {
        setAssignments(published);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const handleStartAssignment = (assignment: Assignment) => {
    if (!assignment.taskId) {
      alert(t('practice.assignmentNoQuestions'));
      return;
    }
    // Navigate to exam view with assignment task
    navigate(`/exam/reading?taskId=${assignment.taskId}&assignmentId=${assignment.assignmentId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">{t('practice.loadingAssignments')}</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">
          {t('practice.noReadingAssignments')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {assignments.map((assignment) => (
          <div
            key={assignment.assignmentId}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all group cursor-pointer"
            onClick={() => handleStartAssignment(assignment)}
          >
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">📖</div>
            </div>
            <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-1.5">
              {assignment.title}
            </h3>
            <p className="text-blue-100 text-xs leading-relaxed mb-2 md:mb-3 line-clamp-2">
              {assignment.prompt}
            </p>
            <div className="flex items-center justify-between text-white text-xs">
              <span className="font-semibold">
                {assignment.settings.numberOfQuestions} {t('practice.questions')}
              </span>
              <span className="font-bold">{t('practice.start')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
