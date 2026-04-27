import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { BackNavButton } from '../components/navigation/BackNavButton';
import { generateQuiz, markNotificationRead } from '../services/quizNotification';
import type { WeaknessLabel, QuizQuestion } from '../services/quizNotification';

type Phase = 'loading' | 'paywalled' | 'intro' | 'question' | 'result';

export function QuizView() {
  const { notificationId } = useParams<{ notificationId: string }>();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [quiz, setQuiz] = useState<{ weaknessLabels: WeaknessLabel[]; questions: QuizQuestion[] } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ selectedIndex: number; correct: boolean }[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (!notificationId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await generateQuiz(notificationId, getToken);
        if (cancelled) return;
        if (res.paywalled) {
          setPhase('paywalled');
        } else if (res.quiz) {
          setQuiz(res.quiz);
          setPhase('intro');
        }
      } catch {
        // stay on loading — could add error state
      }
    })();

    return () => { cancelled = true; };
  }, [notificationId, getToken]);

  const currentQuestion = quiz?.questions[currentIndex] ?? null;
  const totalQuestions = quiz?.questions.length ?? 15;
  const correctCount = answers.filter((a) => a.correct).length;

  const handleSelect = (idx: number) => {
    if (selectedIndex !== null || !currentQuestion) return;
    setSelectedIndex(idx);
    setShowExplanation(true);
    setAnswers((prev) => [...prev, { selectedIndex: idx, correct: idx === currentQuestion.correctIndex }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) {
      setPhase('result');
      if (notificationId) {
        markNotificationRead(notificationId, getToken).catch(() => {});
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setShowExplanation(false);
    }
  };

  const optionLetter = (i: number) => ['A', 'B', 'C', 'D'][i] ?? '';

  const getOptionClass = (idx: number) => {
    if (selectedIndex === null) {
      return 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 cursor-pointer';
    }
    if (idx === currentQuestion?.correctIndex) {
      return 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-400 text-emerald-700 dark:text-emerald-300';
    }
    if (idx === selectedIndex) {
      return 'bg-rose-50 dark:bg-rose-900/20 border border-rose-400 text-rose-700 dark:text-rose-300';
    }
    return 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60';
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Loading */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Building your personalized quiz...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Akseli is analysing your weaknesses</p>
          </div>
        )}

        {/* Paywalled */}
        {phase === 'paywalled' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center max-w-md">
              <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Quiz available for premium members</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Upgrade your plan to access personalized quizzes based on your weaknesses.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/subscription')}
                  className="w-full py-3 px-6 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                >
                  Upgrade
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-3 px-6 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Intro */}
        {phase === 'intro' && quiz && (
          <div>
            <BackNavButton onClick={() => navigate(-1)} />
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-4">Your Personalized Quiz</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Based on your recent practice sessions</p>

            <div className="flex flex-wrap gap-2 mt-5">
              {quiz.weaknessLabels.map((wl) => (
                <span
                  key={wl.weakness}
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                >
                  {wl.displayLabel}
                </span>
              ))}
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              {totalQuestions} questions &middot; C1 level &middot; ~10 min
            </p>

            <button
              onClick={() => setPhase('question')}
              className="mt-8 w-full sm:w-auto py-3 px-8 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              Start Quiz &rarr;
            </button>
          </div>
        )}

        {/* Question */}
        {phase === 'question' && currentQuestion && (
          <div>
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-6">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{currentQuestion.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={selectedIndex !== null}
                  className={`w-full text-left px-5 py-4 rounded-xl transition-colors flex items-start gap-3 ${getOptionClass(idx)}`}
                >
                  <span className="font-bold text-sm mt-0.5">{optionLetter(idx)}</span>
                  <span className="text-sm">{option}</span>
                </button>
              ))}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-200">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Next button */}
            {selectedIndex !== null && (
              <button
                onClick={handleNext}
                className="mt-6 w-full sm:w-auto py-3 px-8 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                {currentIndex + 1 >= totalQuestions ? 'See Results \u2192' : 'Next \u2192'}
              </button>
            )}
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="text-center py-12">
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">
              You got {correctCount} out of {totalQuestions}
            </p>
            <p
              className={`text-lg font-bold mt-3 ${
                correctCount >= 12
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : correctCount >= 8
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {correctCount >= 12 ? 'Excellent work!' : correctCount >= 8 ? 'Good effort!' : 'Keep practising!'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-8 py-3 px-8 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
