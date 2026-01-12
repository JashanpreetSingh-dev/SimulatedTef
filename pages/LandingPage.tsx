import React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScrollAnimation } from '../utils/animations';
import { FAQSection } from '../components/FAQSection';
import { ExamInterfaceShowcase } from '../components/ExamInterfaceShowcase';
import { ResultsDashboardShowcase } from '../components/ResultsDashboardShowcase';
import { EnterpriseCTA } from '../components/EnterpriseCTA';
import { Footer } from '../components/Footer';

export function LandingPage() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [featuresRef, featuresVisible] = useScrollAnimation();
  const [comparisonRef, comparisonVisible] = useScrollAnimation();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col transition-colors duration-300">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-indigo-100/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 transition-colors">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/logo.png" 
                alt="Akseli Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <span className="font-black text-lg sm:text-xl text-slate-800 dark:text-slate-100 hidden sm:inline">
                Akseli
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors rounded-lg hover:bg-indigo-100 dark:hover:bg-slate-800"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M3 12H2m15.325-4.275l.707-.707M3.975 20.025l.707-.707M20.025 3.975l-.707.707M4.675 4.675l-.707-.707M18 12a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <SignInButton mode="modal">
                <button className="px-4 sm:px-6 py-2 rounded-full bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-md text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-100/40 via-indigo-100 to-slate-50 dark:from-indigo-900/20 dark:via-slate-800 dark:to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-100/50 to-slate-50 dark:from-transparent dark:via-slate-800/50 dark:to-slate-900" />
        <div className="z-10 text-center space-y-8 sm:space-y-12 max-w-5xl mx-auto w-full">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-black tracking-[-0.02em] leading-[1.05] px-2 animate-fade-in-up">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Akseli</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tight px-2 animate-fade-in-up delay-200">
              AI-Powered TEF Canada Preparation
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl lg:text-2xl font-normal max-w-3xl mx-auto leading-[1.6] px-4 animate-fade-in-up delay-300">
              Complete exam simulation with AI-evaluated Written & Oral Expression. Practice mode, full mock exams, and powerful tools for teachers to create custom assessments.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 w-full px-4 animate-fade-in-up delay-400">
            <SignInButton mode="modal">
              <button className="group relative w-full sm:w-auto px-6 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-600 text-white dark:text-white font-semibold text-base sm:text-lg hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-indigo-500/40 dark:hover:shadow-indigo-500/40 active:scale-[0.98] overflow-hidden">
                <span className="relative z-10">Sign in</span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              </button>
            </SignInButton>
            <a 
              href="https://www.producthunt.com/products/akseli?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-akseli" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block hover:opacity-80 transition-opacity duration-300"
            >
              <img 
                alt="Akseli - An AI-enabled TEF Canada Speaking Test Simulator | Product Hunt" 
                width="200" 
                height="43" 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1054152&theme=dark&t=1766600261177"
                className="h-9 sm:h-10"
              />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef as React.RefObject<HTMLElement>}
        className={`relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16 transition-all duration-1000 ${
          featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-12 mb-12 sm:mb-16 md:mb-20">
            <div className="space-y-3 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 leading-[1.1] tracking-[-0.02em]">
                Create, practice, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">succeed</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-[1.7] hidden sm:block">
                Everything you need to prepare, practice, and track your progress—all in one platform.
              </p>
            </div>
            <div className="flex items-center">
              <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-[1.7] hidden md:block">
                Scale without switching tools. All your exam preparation in one place.
              </p>
            </div>
          </div>
          
          {/* Student Features - 2x3 grid */}
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">For Students</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
            <div className={`group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-indigo-300/20 dark:hover:shadow-indigo-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-100' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 group-hover:rotate-3 transition-all duration-300">📝</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Practice Mode</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Unlimited practice sessions for all 4 modules. Learn at your own pace with no time pressure.
              </p>
            </div>

            <div className={`group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-cyan-300/20 dark:hover:shadow-cyan-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-200' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800 group-hover:rotate-3 transition-all duration-300">🎯</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Mock Exams</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Full simulation with official time limits. Experience the real exam conditions before test day.
              </p>
            </div>

            <div className={`group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-300' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 group-hover:rotate-3 transition-all duration-300">🎙️</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">AI Oral Evaluation</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Live conversation with AI examiner. Get instant feedback on pronunciation, fluency, and grammar.
              </p>
            </div>

            <div className={`group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-amber-500/20 dark:hover:shadow-amber-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-400' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-amber-200 dark:group-hover:bg-amber-800 group-hover:rotate-3 transition-all duration-300">✍️</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">AI Written Evaluation</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Submit essays and get detailed AI feedback using official CCI Paris scoring criteria.
              </p>
            </div>

            <div className={`group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-500' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 group-hover:rotate-3 transition-all duration-300">📊</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">CLB Scoring</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Get TEF scores (0-699) and CLB levels mapped for Canadian immigration applications.
              </p>
            </div>

            <div className={`group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-rose-500/20 dark:hover:shadow-rose-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-600' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-rose-200 dark:group-hover:bg-rose-800 group-hover:rotate-3 transition-all duration-300">📈</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Progress Tracking</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Track your improvement over time with detailed history and performance analytics.
              </p>
            </div>
          </div>

          {/* Teacher Features */}
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">For Teachers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className={`group space-y-4 p-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 hover:from-violet-200 hover:to-indigo-200 dark:hover:from-violet-800/40 dark:hover:to-indigo-800/40 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-violet-500/20 dark:hover:shadow-violet-500/20 border border-violet-200 dark:border-violet-700 ${
              featuresVisible ? 'animate-slide-up delay-700' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 group-hover:rotate-3 transition-all duration-300">🪄</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">AI Assessment Creator</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Generate custom Reading & Listening assessments with AI. Just describe the topic and let AI create questions.
              </p>
            </div>

            <div className={`group space-y-4 p-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 hover:from-violet-200 hover:to-indigo-200 dark:hover:from-violet-800/40 dark:hover:to-indigo-800/40 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-violet-500/20 dark:hover:shadow-violet-500/20 border border-violet-200 dark:border-violet-700 ${
              featuresVisible ? 'animate-slide-up delay-800' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 group-hover:rotate-3 transition-all duration-300">👥</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Organization Management</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Invite students to your organization. Assignments are automatically shared with your class.
              </p>
            </div>

            <div className={`group space-y-4 p-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 hover:from-violet-200 hover:to-indigo-200 dark:hover:from-violet-800/40 dark:hover:to-indigo-800/40 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-violet-500/20 dark:hover:shadow-violet-500/20 border border-violet-200 dark:border-violet-700 ${
              featuresVisible ? 'animate-slide-up delay-900' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 group-hover:rotate-3 transition-all duration-300">✏️</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Edit & Review</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Review AI-generated questions, edit content, and publish when ready. Full control over your assessments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* All 4 Modules Section */}
      <section 
        ref={comparisonRef as React.RefObject<HTMLElement>}
        className={`relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16 bg-slate-100/50 dark:bg-slate-800/30 transition-all duration-1000 ${
          comparisonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 md:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-3 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
              All <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">4 TEF Modules</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4 hidden sm:block">
              Complete preparation for every section of the TEF Canada exam with AI-powered evaluation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {/* Oral Expression */}
            <div className={`space-y-4 p-6 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-emerald-200 dark:border-emerald-800 shadow-sm transition-all duration-500 ${
              comparisonVisible ? 'animate-slide-up delay-100' : 'opacity-0 translate-y-8'
            }`}>
              <div className="text-3xl mb-2">🎙️</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Expression Orale</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-[1.5]">
                Live conversation with AI examiner. Real-time speech recognition and instant feedback.
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  AI Evaluated
                </span>
              </div>
            </div>

            {/* Written Expression */}
            <div className={`space-y-4 p-6 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-amber-200 dark:border-amber-800 shadow-sm transition-all duration-500 ${
              comparisonVisible ? 'animate-slide-up delay-200' : 'opacity-0 translate-y-8'
            }`}>
              <div className="text-3xl mb-2">✍️</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Expression Écrite</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-[1.5]">
                Write essays on official topics. AI evaluates grammar, vocabulary, coherence & structure.
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                  AI Evaluated
                </span>
              </div>
            </div>

            {/* Reading Comprehension */}
            <div className={`space-y-4 p-6 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800 shadow-sm transition-all duration-500 ${
              comparisonVisible ? 'animate-slide-up delay-300' : 'opacity-0 translate-y-8'
            }`}>
              <div className="text-3xl mb-2">📖</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Compréhension Écrite</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-[1.5]">
                40 MCQ questions across 4 sections. Texts range from simple to complex professional content.
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  40 Questions
                </span>
              </div>
            </div>

            {/* Listening Comprehension */}
            <div className={`space-y-4 p-6 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-200 dark:border-cyan-800 shadow-sm transition-all duration-500 ${
              comparisonVisible ? 'animate-slide-up delay-400' : 'opacity-0 translate-y-8'
            }`}>
              <div className="text-3xl mb-2">🎧</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Compréhension Orale</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-[1.5]">
                40 MCQ questions with AI-generated audio. Practice with various accents and speaking speeds.
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs font-semibold">
                  40 Questions
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Interface Showcase */}
      <ExamInterfaceShowcase />

      {/* Results Dashboard Showcase */}
      <ResultsDashboardShowcase />

      {/* Enterprise CTA Section */}
      <EnterpriseCTA />

      {/* FAQ Section */}
      <FAQSection />

      <Footer variant="light" />
    </div>
  );
}
