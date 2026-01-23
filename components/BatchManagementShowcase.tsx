import React from 'react';
import { useScrollAnimation } from '../utils/animations';

export const BatchManagementShowcase: React.FC = () => {
  const [ref, isVisible] = useScrollAnimation();

  // Sample batch data for preview
  const sampleBatches = [
    {
      batchId: 'batch-1',
      name: 'TEF Preparation - Level B1',
      studentIds: ['student1', 'student2', 'student3', 'student4'],
      createdAt: new Date().toISOString(),
      assignmentCount: 3,
    },
    {
      batchId: 'batch-2',
      name: 'Advanced French - Level B2',
      studentIds: ['student5', 'student6', 'student7'],
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      assignmentCount: 5,
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 xl:px-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em]">
            Organize Students into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Batches</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-[1.6]">
            Create student groups, manage class rosters, and assign assessments to entire batches with one click.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          {/* Create Batch Modal Preview */}
          <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create New Batch</h3>
                <span className="text-xs px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded font-semibold">
                  NEW
                </span>
              </div>
              
              {/* Modal Preview */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl">
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Create Batch</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Enter a name for your batch
                </p>
                <form>
                  <input
                    type="text"
                    value="TEF Preparation - Level B1"
                    readOnly
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 mb-4 cursor-not-allowed opacity-75"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-semibold text-sm"
                      disabled
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold text-sm cursor-not-allowed opacity-75"
                      disabled
                    >
                      Create Batch
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  <span>Simple batch creation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  <span>Invite students from your organization</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  <span>Manage multiple classes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Cards Preview */}
          <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Your Batches</h3>
              <div className="space-y-4">
                {sampleBatches.map((batch) => (
                  <div
                    key={batch.batchId}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 break-words mb-3">
                          {batch.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-500">
                          <span className="whitespace-nowrap">
                            👥 {batch.studentIds.length} {batch.studentIds.length === 1 ? 'student' : 'students'}
                          </span>
                          <span className="whitespace-nowrap">
                            📋 {batch.assignmentCount} {batch.assignmentCount === 1 ? 'assignment' : 'assignments'}
                          </span>
                          <span className="whitespace-nowrap">
                            Created {formatDate(batch.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                        <button
                          className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-not-allowed opacity-75"
                          disabled
                        >
                          View
                        </button>
                        <button
                          className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-not-allowed opacity-75"
                          disabled
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom notice */}
        <div className="mt-8 text-center">
          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-500/20 rounded-xl px-4 py-3 inline-flex items-center gap-2">
            <span className="text-violet-600 dark:text-violet-400 text-sm">ℹ️</span>
            <p className="text-violet-800 dark:text-violet-300 text-xs sm:text-sm font-medium">
              This is a demo preview. Sign up to create and manage batches for your organization.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
