import React, { useState } from 'react';
import { useScrollAnimation } from '../utils/animations';

export const AssignmentCreationShowcase: React.FC = () => {
  const [ref, isVisible] = useScrollAnimation();
  const [selectedType, setSelectedType] = useState<'reading' | 'listening'>('reading');

  // Sample assignment data
  const sampleAssignments = [
    {
      assignmentId: 'assign-1',
      title: 'French Culture and Traditions',
      type: 'reading' as const,
      prompt: 'Read articles about French culture, traditions, and history. Answer questions about customs, holidays, and social practices.',
      status: 'published' as const,
      settings: { numberOfQuestions: 40 },
      createdAt: new Date().toISOString(),
      questionIds: ['q1', 'q2', 'q3'],
      creatorName: 'Prof. Dubois',
    },
    {
      assignmentId: 'assign-2',
      title: 'Business French - Listening',
      type: 'listening' as const,
      prompt: 'Listen to business conversations and meetings. Answer questions about professional communication, negotiations, and workplace scenarios.',
      status: 'published' as const,
      settings: { numberOfQuestions: 40 },
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      questionIds: ['q4', 'q5', 'q6'],
      creatorName: 'Prof. Martin',
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
      className={`relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 xl:px-16 bg-slate-100/50 dark:bg-slate-800/30 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em]">
            AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Assessment Creator</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-[1.6]">
            Create custom Reading and Listening assessments with AI. Just describe your topic and let AI generate questions automatically.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          {/* Assignment Form Preview */}
          <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create Assignment</h3>
                <span className="text-xs px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded font-semibold">
                  AI-POWERED
                </span>
              </div>

              <form className="space-y-6">
                {/* Assignment Type */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                    Assignment Type
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="reading"
                        checked={selectedType === 'reading'}
                        onChange={() => setSelectedType('reading')}
                        className="w-4 h-4 text-indigo-600 flex-shrink-0"
                      />
                      <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">Reading Comprehension</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="listening"
                        checked={selectedType === 'listening'}
                        onChange={() => setSelectedType('listening')}
                        className="w-4 h-4 text-indigo-600 flex-shrink-0"
                      />
                      <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">Listening Comprehension</span>
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value="French Culture and Traditions"
                    readOnly
                    className="w-full h-10 px-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-not-allowed opacity-75"
                  />
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                    Prompt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value="Read articles about French culture, traditions, and history. Answer questions about customs, holidays, and social practices."
                    readOnly
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-not-allowed opacity-75"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Describe the topic and content you want the AI to create questions about
                  </p>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    value="40"
                    readOnly
                    className="w-full h-10 px-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-not-allowed opacity-75"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Maximum 40 questions (official TEF format)
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    className="flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-indigo-500 text-white font-bold rounded-lg text-sm sm:text-base cursor-not-allowed opacity-75"
                    disabled
                  >
                    Create Assignment
                  </button>
                  <button
                    type="button"
                    className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-sm sm:text-base cursor-not-allowed opacity-75"
                    disabled
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  <span>AI generates questions automatically</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  <span>Edit and review before publishing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  <span>Share with your organization</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment List Preview */}
          <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Published Assignments</h3>
              <div className="space-y-4">
                {sampleAssignments.map((assignment) => (
                  <div
                    key={assignment.assignmentId}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 break-words">
                            {assignment.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-bold whitespace-nowrap bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              Published
                            </span>
                            <span
                              className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-bold whitespace-nowrap ${
                                assignment.type === 'reading'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              }`}
                            >
                              {assignment.type === 'reading' ? 'Reading' : 'Listening'}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 break-words">
                          {assignment.prompt}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-500">
                          <span className="whitespace-nowrap">
                            {assignment.settings.numberOfQuestions} questions
                          </span>
                          <span className="whitespace-nowrap">
                            Created {formatDate(assignment.createdAt)}
                          </span>
                          <span className="whitespace-nowrap text-indigo-500 dark:text-indigo-400">
                            Created by {assignment.creatorName}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                        <button
                          className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-not-allowed opacity-75"
                          disabled
                        >
                          Edit
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
              This is a demo preview. Sign up to create AI-powered assessments for your students.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
