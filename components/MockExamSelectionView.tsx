import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';

type TabType = 'mock-test' | 'completed';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface MockExamSelectionViewProps {
  onMockExamSelected: (mockExamId: string, sessionId: string) => void;
  onCancel?: () => void;
}

interface MockExamStatus {
  mockExamId: string;
  sessionId: string;
  completedModules: string[];
  availableModules: string[];
}

interface MockExam {
  mockExamId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface ActiveMockExam {
  mockExamId: string;
  sessionId: string;
  completedModules: string[];
  availableModules: string[];
}

export const MockExamSelectionView: React.FC<MockExamSelectionViewProps> = ({
  onMockExamSelected,
  onCancel,
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [activeMockExam, setActiveMockExam] = useState<ActiveMockExam | null>(null);
  const [completedMockExamIds, setCompletedMockExamIds] = useState<string[]>([]);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('mock-test');

  // Load mock exams and check status
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch available mock exams
        const exams = await authenticatedFetchJSON<MockExam[]>(
          `${BACKEND_URL}/api/exam/mock-exams`,
          {
            method: 'GET',
            getToken,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          }
        );
        setMockExams(exams || []);
        setLoadingExams(false);

        // Check for active mock exam
        await checkExistingMockExam();
      } catch (error) {
        console.error('Failed to load mock exams:', error);
        setError('Failed to load mock exams. Please try again.');
        setLoadingExams(false);
        setCheckingStatus(false);
      }
    };
    loadData();
  }, []);

  const checkExistingMockExam = async () => {
    try {
      const status = await authenticatedFetchJSON<{
        hasActiveMockExam: boolean;
        activeMockExam?: {
          mockExamId: string;
          sessionId: string;
          completedModules: string[];
          availableModules: string[];
        };
        completedMockExamIds: string[];
      }>(
        `${BACKEND_URL}/api/exam/mock/status`,
        {
          method: 'GET',
          getToken,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        }
      );

      if (status.hasActiveMockExam && status.activeMockExam) {
        setActiveMockExam(status.activeMockExam);
      }

      if (status.completedMockExamIds) {
        setCompletedMockExamIds(status.completedMockExamIds);
      }
    } catch (error) {
      console.error('Failed to check existing mock exam:', error);
      // For errors, just ignore - user can try starting a new exam
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleStartMockExam = async (mockExamId: string) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetchJSON<{
        sessionId: string;
        mockExamId: string;
      }>(
        `${BACKEND_URL}/api/exam/start`,
        {
          method: 'POST',
          getToken,
          body: JSON.stringify({ mockExamId }),
        }
      );

      onMockExamSelected(mockExamId, response.sessionId);
    } catch (error: any) {
      console.error('Failed to start mock exam:', error);
      if (error.message?.includes('credits')) {
        setError('You need credits to start a mock exam. Please purchase a pack.');
      } else {
        setError('Failed to start mock exam. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResumeMockExam = () => {
    if (activeMockExam) {
      onMockExamSelected(activeMockExam.mockExamId, 'resumed');
    }
  };

  return (
    <div className={`
      min-h-screen p-4 md:p-8
      ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}
    `}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className={`
                mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 
                flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              ← Retour au tableau de bord
            </button>
          )}
          <div className="mb-4">
            <h1 className={`
              text-3xl font-bold
              ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
            `}>
              Mock Exams
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('mock-test')}
              className={`
                flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all
                ${activeTab === 'mock-test'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }
              `}
            >
              Mock Tests
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`
                flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all relative
                ${activeTab === 'completed'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-green-400 dark:text-green-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }
              `}
            >
              Completed
              {completedMockExamIds.length > 0 && (
                <span className={`
                  absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold
                  ${activeTab === 'completed'
                    ? 'bg-white text-green-600'
                    : 'bg-green-500 text-white'
                  }
                `}>
                  {completedMockExamIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'mock-test' ? (
            <div>
        {error && (
          <div className={`
            mb-6 p-4 rounded-lg
            ${theme === 'dark' ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}
          `}>
            <p className={`
              text-sm
              ${theme === 'dark' ? 'text-red-200' : 'text-red-800'}
            `}>
              {error}
            </p>
          </div>
        )}

        {/* Available Mock Exams */}
              {loadingExams || checkingStatus ? (
          <div className="text-center py-8">
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                    {loadingExams ? 'Loading mock exams...' : 'Checking exam status...'}
                  </p>
          </div>
        ) : mockExams.length > 0 ? (
          <div className="space-y-4 mb-8">
            <h2 className={`
              text-xl font-semibold mb-4
              ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}
            `}>
                    Mock Exams
            </h2>
                  {mockExams.map((exam) => {
                    const isActiveExam = activeMockExam && activeMockExam.mockExamId === exam.mockExamId;
                    const completedCount = isActiveExam ? activeMockExam.completedModules.length : 0;
                    // Only treat exam as "started" if at least one module has been completed
                    // (session may exist, but exam isn't really started until work is done)
                    const isIncomplete = isActiveExam && completedCount > 0 && completedCount < 3;
                    const isComplete = isActiveExam && completedCount === 3;
                    // Only show as active/started if there's actually progress (completedCount > 0)
                    const hasStarted = isActiveExam && completedCount > 0;
                    const actionText = hasStarted ? 'Resume' : 'Start';
                    const actionHandler = hasStarted ? handleResumeMockExam : () => handleStartMockExam(exam.mockExamId);

                    return (
              <div
                key={exam.mockExamId}
                        onClick={loading ? undefined : actionHandler}
                className={`
                  p-6 rounded-lg border-2 transition-all
                  ${loading
                    ? theme === 'dark'
                      ? 'bg-slate-800 border-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-white border-slate-300 cursor-not-allowed opacity-50'
                    : theme === 'dark'
                    ? 'bg-slate-800 border-slate-600 hover:border-indigo-500 hover:shadow-xl hover:scale-[1.02] cursor-pointer active:scale-100'
                    : 'bg-white border-slate-300 hover:border-indigo-500 hover:shadow-xl hover:scale-[1.02] cursor-pointer active:scale-100'
                  }
                          ${hasStarted ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''}
                `}
                role={loading ? undefined : 'button'}
                tabIndex={loading ? undefined : 0}
                onKeyDown={(e) => {
                  if (!loading && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                            actionHandler();
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`
                      text-lg font-semibold mb-1
                      ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
                    `}>
                      {exam.name}
                    </h3>
                    {exam.description && (
                      <p className={`
                        text-sm mb-3
                        ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
                      `}>
                        {exam.description}
                      </p>
                    )}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className={`
                                px-2 py-1 rounded text-xs font-medium
                                ${isComplete
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : isIncomplete
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                }
                              `}>
                                {isComplete ? 'Complete' : isIncomplete ? 'Incomplete' : 'New'}
                              </span>
                              {hasStarted && (
                                <div className="flex gap-2 flex-wrap">
                                  <div className={`
                                    px-2 py-1 rounded text-xs font-medium
                                    ${activeMockExam.completedModules.includes('oralExpression')
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                    }
                                  `}>
                                    Expression Orale: {activeMockExam.completedModules.includes('oralExpression') ? '✓' : '○'}
                                  </div>
                                  <div className={`
                                    px-2 py-1 rounded text-xs font-medium
                                    ${activeMockExam.completedModules.includes('reading')
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                    }
                                  `}>
                                    Reading: {activeMockExam.completedModules.includes('reading') ? '✓' : '○'}
                                  </div>
                                  <div className={`
                                    px-2 py-1 rounded text-xs font-medium
                                    ${activeMockExam.completedModules.includes('listening')
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                    }
                                  `}>
                                    Listening: {activeMockExam.completedModules.includes('listening') ? '✓' : '○'}
                                  </div>
                                </div>
                              )}
                            </div>
                    {!hasStarted && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>
                          Expression Orale
                        </div>
                        <div className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>
                          Reading (40 Q - sequential)
                        </div>
                        <div className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>
                          Listening (40 Q)
                        </div>
                      </div>
                    )}
                  </div>
                  {!loading && (
                            <div className="flex items-center gap-2 ml-4">
                              <span className={`
                                text-sm font-semibold
                                ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}
                              `}>
                                {actionText}
                              </span>
                              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className={`
                    text-lg
                    ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
                  `}>
                    All available mock exams have been completed. Check the Completed tab to view your results.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {completedMockExamIds.length > 0 ? (
                <div className="space-y-4">
                  {completedMockExamIds.map((mockExamId) => (
                    <div
                      key={mockExamId}
                      className={`
                        p-6 rounded-lg border-2 transition-all
                        ${theme === 'dark'
                          ? 'bg-green-900/20 border-green-600 hover:shadow-xl hover:scale-[1.02] cursor-pointer active:scale-100'
                          : 'bg-green-50 border-green-500 hover:shadow-xl hover:scale-[1.02] cursor-pointer active:scale-100'
                        }
                      `}
                      onClick={() => onMockExamSelected(mockExamId, 'completed')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onMockExamSelected(mockExamId, 'completed');
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`
                            text-lg font-semibold mb-2
                            ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
                          `}>
                            Mock Exam Completed
                          </h3>
                          <p className={`
                            text-sm mb-3
                            ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
                          `}>
                            All modules completed. View your final results.
                          </p>
                          <div className="flex gap-4 text-sm">
                            <div className={`
                              px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800
                            `}>
                              Oral: Complete
                            </div>
                            <div className={`
                              px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800
                            `}>
                              Reading: Complete
                            </div>
                            <div className={`
                              px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800
                            `}>
                              Listening: Complete
                            </div>
                          </div>
                        </div>
                        {!loading && (
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`
                              text-sm font-semibold
                              ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}
                            `}>
                              View Results
                            </span>
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className={`
              text-lg
              ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
            `}>
                    No completed mock exams yet. Complete your first mock exam to see it here!
            </p>
          </div>
        )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};