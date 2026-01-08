import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { batchService } from '../services/batchService';
import { batchAssignmentService } from '../services/batchAssignmentService';
import { useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { AssignmentList } from '../components/assignments/AssignmentList';
import { Assignment } from '../types';

export function StudentBatchView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getToken } = useAuth();
  const [batch, setBatch] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const getTokenWrapper = async () => getToken();

      // Get student's batch
      const batchData = await batchService.getMyBatch(getTokenWrapper);
      if (!batchData) {
        setBatch(null);
        setLoading(false);
        return;
      }

      setBatch(batchData);

      // Get assigned assessments
      const assigned = await batchAssignmentService.getAssignedAssignments(getTokenWrapper);
      setAssignments(assigned.map((ba: any) => ba.assignment).filter(Boolean));
    } catch (err: any) {
      console.error('Failed to load batch data:', err);
      setBatch(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    if (!batch) return;
    if (!assignment.taskId) {
      alert('Assignment questions not yet generated. Please wait for the professor to generate questions.');
      return;
    }
    navigate(`/exam/${assignment.type}?assignmentId=${assignment.assignmentId}&taskId=${assignment.taskId}&type=${assignment.type}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">{t('batches.loading')}</p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!batch) {
    return (
      <DashboardLayout>
        <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('batches.noBatchAssigned')}</h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t('batches.noBatchAssignedDescription')}
            </p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
        <div className="space-y-2 md:space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
          >
            ← Dashboard
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {batch.name}
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            {t('batches.assignedAssessmentsTitle')}
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              {t('batches.noAssignmentsYet')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.assignmentId}
                onClick={() => handleAssignmentClick(assignment)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 break-words">
                        {assignment.title}
                      </h3>
                      <span
                        className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-bold whitespace-nowrap ${
                          assignment.type === 'reading'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {assignment.type === 'reading' ? t('batches.reading') : t('batches.listening')}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 break-words">
                      {assignment.prompt}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-500">
                      <span className="whitespace-nowrap">
                        {assignment.settings.numberOfQuestions} Questions
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignmentClick(assignment);
                    }}
                    className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                    disabled={!assignment.taskId}
                  >
                    {assignment.taskId ? t('batches.start') : t('batches.notReady')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}