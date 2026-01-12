import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAssignments } from '../hooks/useAssignments';
import { AssignmentList } from '../components/assignments/AssignmentList';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

type AssignmentTab = 'reading' | 'listening';

export function AssignmentsView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { assignments, loading, fetchMyAssignments, deleteAssignment } = useAssignments();
  const [activeTab, setActiveTab] = useState<AssignmentTab>('reading');

  useEffect(() => {
    fetchMyAssignments();
  }, [fetchMyAssignments]);

  const handleDelete = async (assignmentId: string) => {
    try {
      await deleteAssignment(assignmentId);
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      alert(t('assignments.deleteFailed'));
    }
  };

  // Filter assignments by type
  const readingAssignments = useMemo(() => 
    assignments.filter(a => a.type === 'reading'), [assignments]);
  const listeningAssignments = useMemo(() => 
    assignments.filter(a => a.type === 'listening'), [assignments]);
  
  const filteredAssignments = activeTab === 'reading' ? readingAssignments : listeningAssignments;

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 md:space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
            >
              ← {t('back.dashboard')}
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('assignments.title')}
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              {t('assignments.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/assignments/create')}
            className="px-4 py-3 sm:px-6 sm:py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            + {t('assignments.createAssignment')}
          </button>
        </div>

        {/* Tabs for Reading / Listening */}
        <div className={`
          flex gap-2 p-1 rounded-xl
          ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}
        `}>
          <button
            onClick={() => setActiveTab('reading')}
            className={`
              flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
              ${activeTab === 'reading'
                ? theme === 'dark'
                  ? 'bg-blue-900/50 text-blue-400 shadow-sm'
                  : 'bg-blue-100 text-blue-600 shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            <span>📖</span>
            {t('assignments.reading')}
            {readingAssignments.length > 0 && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${activeTab === 'reading'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                }
              `}>
                {readingAssignments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('listening')}
            className={`
              flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
              ${activeTab === 'listening'
                ? theme === 'dark'
                  ? 'bg-green-900/50 text-green-400 shadow-sm'
                  : 'bg-green-100 text-green-600 shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            <span>🎧</span>
            {t('assignments.listening')}
            {listeningAssignments.length > 0 && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${activeTab === 'listening'
                  ? 'bg-green-500 text-white'
                  : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                }
              `}>
                {listeningAssignments.length}
              </span>
            )}
          </button>
        </div>

        <AssignmentList
          assignments={filteredAssignments}
          loading={loading}
          onDelete={handleDelete}
        />
      </main>
    </DashboardLayout>
  );
}
