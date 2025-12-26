import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { OralExpressionLive } from './components/OralExpressionLive';
import { HistoryList } from './components/HistoryList';
import { DetailedResultView } from './components/DetailedResultView';
import { LoadingResult } from './components/LoadingResult';
import { SavedResult } from './types';
import { getRandomTasks, getTaskById } from './services/tasks';
import { persistenceService } from './services/persistence';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { useExamResult } from './hooks/useExamResult';
import { PricingSection } from './components/PricingSection';
import { FeatureComparison } from './components/FeatureComparison';
import { FAQSection } from './components/FAQSection';
import { ExamInterfaceShowcase } from './components/ExamInterfaceShowcase';
import { ResultsDashboardShowcase } from './components/ResultsDashboardShowcase';
import { useScrollAnimation } from './utils/animations';
import { useUsage } from './hooks/useUsage';
import { PaywallModal } from './components/PaywallModal';
import { ExamWarningModal } from './components/ExamWarningModal';
import { SubscriptionStatus } from './components/SubscriptionStatus';
import { useSubscription } from './hooks/useSubscription';
import { SubscriptionManagement } from './components/SubscriptionManagement';
import { PricingPage } from './components/PricingPage';
import { TermsOfService } from './components/TermsOfService';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Footer } from './components/Footer';

const PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function LandingPage() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [featuresRef, featuresVisible] = useScrollAnimation();
  const [comparisonRef, comparisonVisible] = useScrollAnimation();
  const [ctaRef, ctaVisible] = useScrollAnimation();
  
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-[-0.02em] leading-[1.05] px-2 animate-fade-in-up">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Akseli</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tight px-2 animate-fade-in-up delay-200">
              Build better French, faster
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl lg:text-2xl font-normal max-w-3xl mx-auto leading-[1.6] px-4 animate-fade-in-up delay-300">
              The exam simulator trusted by candidates preparing for Canadian immigration. Practice with real scenarios and get evaluated by AI trained on the official CCI Paris framework.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-[1.6] px-4 animate-fade-in-up delay-350">
              Starting at $19 for 5 full tests • No credit card required for trial
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 w-full px-4 animate-fade-in-up delay-400">
            <SignUpButton mode="modal">
              <button className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-600 text-white dark:text-white font-semibold text-base sm:text-lg hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-indigo-500/40 dark:hover:shadow-indigo-500/40 active:scale-[0.98] overflow-hidden">
                <span className="relative z-10">Start 3-Day Free Trial</span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-md text-slate-800 dark:text-slate-100 font-semibold text-base sm:text-lg hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
                Sign in
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
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className={`group space-y-2 sm:space-y-4 p-4 sm:p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-indigo-300/20 dark:hover:shadow-indigo-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-100' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl sm:text-2xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 group-hover:rotate-3 transition-all duration-300">🎯</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Official Format</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Real TEF Canada scenarios with exact time limits and official exam structure.
              </p>
            </div>

            <div className={`group space-y-2 sm:space-y-4 p-4 sm:p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-cyan-300/20 dark:hover:shadow-cyan-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-200' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-2xl sm:text-2xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800 group-hover:rotate-3 transition-all duration-300">🤖</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">AI Evaluation</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                CCI Paris framework evaluation with accurate CLB and CECR assessments.
              </p>
            </div>

            <div className={`group space-y-2 sm:space-y-4 p-4 sm:p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-300' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl sm:text-2xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 group-hover:rotate-3 transition-all duration-300">🎙️</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Live Audio</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Real-time conversation practice with advanced speech recognition.
              </p>
            </div>

            <div className={`group space-y-2 sm:space-y-4 p-4 sm:p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/20 border border-slate-200 dark:border-slate-700 ${
              featuresVisible ? 'animate-slide-up delay-400' : 'opacity-0 translate-y-4'
            }`}>
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-2xl sm:text-2xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 group-hover:rotate-3 transition-all duration-300">📊</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">CLB Scoring</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Get TEF scores (0-699) and CLB levels for Canadian immigration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Interface Showcase */}
      <ExamInterfaceShowcase />

      {/* Results Dashboard Showcase */}
      <ResultsDashboardShowcase />

      {/* Why Akseli Section */}
      <section 
        ref={comparisonRef as React.RefObject<HTMLElement>}
        className={`relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16 bg-slate-100/50 dark:bg-slate-800/30 transition-all duration-1000 ${
          comparisonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 md:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-3 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
              Why Akseli beats <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">generic AI</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4 hidden sm:block">
              Training with ChatGPT or plain AI models won't prepare you for the real exam. Here's what makes Akseli different.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Akseli Column */}
            <div className={`space-y-2 sm:space-y-6 p-4 sm:p-8 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-800 shadow-sm transition-all duration-500 ${
              comparisonVisible ? 'animate-slide-in-left' : 'opacity-0 -translate-x-8'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                <img 
                  src="/logo.png" 
                  alt="Akseli Logo" 
                  className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                />
                <h3 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Akseli</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 dark:text-emerald-300 text-lg sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base">Official exam format</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-[1.4]">Real TEF Canada scenarios with time limits</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 dark:text-emerald-300 text-lg sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base">Official scoring</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-[1.4]">CLB & TEF scores (0-699) for immigration</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 dark:text-emerald-300 text-lg sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base">Real-time audio practice</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-[1.4]">Live conversation with AI examiner</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 dark:text-emerald-300 text-lg sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base">Progress tracking</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-[1.4]">Track your improvement over time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ChatGPT/Plain AI Column */}
            <div className={`space-y-2 sm:space-y-6 p-4 sm:p-8 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-500 ${
              comparisonVisible ? 'animate-slide-in-right' : 'opacity-0 translate-x-8'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-base sm:text-xl font-black text-slate-500 dark:text-slate-400">
                  AI
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-500 dark:text-slate-400">ChatGPT / Plain AI</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-500 text-lg sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm sm:text-base">No exam structure</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-[1.4]">Just generic conversation practice</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-500 text-lg sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm sm:text-base">No official scoring</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-[1.4]">Can't get CLB or TEF scores</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-500 text-lg sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm sm:text-base">Text-based only</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-[1.4]">No real-time audio practice</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-500 text-lg sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm sm:text-base">No progress tracking</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-[1.4]">Can't monitor your improvement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Feature Comparison Section */}
      <FeatureComparison />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <section 
        ref={ctaRef as React.RefObject<HTMLElement>}
        className={`relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16 transition-all duration-1000 ${
          ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">succeed</span>?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl mb-4 sm:mb-6 leading-[1.6] max-w-2xl mx-auto px-4">
            Join candidates preparing for Canadian immigration with the most accurate TEF exam simulator available.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mb-8 sm:mb-12 leading-[1.6] max-w-2xl mx-auto px-4">
            Start with a free 3-day trial, or choose a plan that fits your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full px-4">
            <SignUpButton mode="modal">
              <button className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-600 text-white dark:text-white font-semibold text-base sm:text-lg hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-indigo-500/40 dark:hover:shadow-indigo-500/40 active:scale-[0.98] overflow-hidden">
                <span className="relative z-10">Start Free Trial</span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              </button>
            </SignUpButton>
            <a
              href="#pricing"
              className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-md text-slate-800 dark:text-slate-100 font-semibold text-base sm:text-lg hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.05] hover:shadow-xl hover:shadow-indigo-400/20 dark:hover:shadow-indigo-500/20 active:scale-[0.98] text-center"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="relative z-10">View Pricing</span>
            </a>
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-md text-slate-800 dark:text-slate-100 font-semibold text-base sm:text-lg hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-[1.05] hover:shadow-xl hover:shadow-slate-600/20 dark:hover:shadow-slate-500/20 active:scale-[0.98]">
                Sign in
              </button>
            </SignInButton>
          </div>
        </div>
      </section>

      <Footer variant="light" />
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { status } = useSubscription();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const getSubscriptionBadge = () => {
    if (!status) return null;
    
    // Show pack badge if active, otherwise show subscription type
    if (status.packType && status.packExpirationDate && new Date(status.packExpirationDate) > new Date()) {
      const packName = status.packType === 'STARTER_PACK' ? 'Starter Pack' : 'Exam Ready Pack';
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-300/20 text-indigo-400">
          {packName}
        </span>
      );
    }

    const badges: Record<string, { text: string; color: string }> = {
      'TRIAL': { text: 'Trial', color: 'bg-blue-500/20 text-blue-400' },
      'EXPIRED': { text: 'Expired', color: 'bg-red-500/20 text-red-400' },
    };

    const badge = badges[status.subscriptionType];
    if (!badge) return null;

    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <nav className="sticky top-0 z-50 bg-indigo-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center min-h-[57px] transition-colors duration-300">
        <div className="flex items-center gap-4 md:gap-8">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            <img 
              src="/logo.png" 
              alt="Akseli Logo" 
              className="h-6 md:h-8 w-auto"
            />
            <span className="hidden md:inline font-black text-lg md:text-xl text-slate-800 dark:text-slate-100">
              Akseli
            </span>
          </div>
          <div className="h-6 flex items-center">
            {getSubscriptionBadge()}
          </div>
          <div className="hidden md:flex gap-4 text-sm font-bold">
            <button 
              onClick={() => navigate('/dashboard')}
              className={isActive('/dashboard') ? 'text-indigo-400 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}>
              {t('nav.dashboard')}
            </button>
            <button 
              onClick={() => navigate('/history')}
              className={isActive('/history') ? 'text-indigo-400 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}>
              {t('nav.history')}
            </button>
            <button 
              onClick={() => navigate('/dashboard/subscription')}
              className={isActive('/dashboard/subscription') ? 'text-indigo-400 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}>
              Subscription
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setLanguage('fr')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                language === 'fr'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-500'
              }`}
              title="Français"
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                language === 'en'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-500'
              }`}
              title="English"
            >
              EN
            </button>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <button 
            onClick={() => signOut()}
            className="hidden md:block text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-rose-300 dark:hover:text-rose-400 transition-colors"
          >
            {t('nav.signOut')}
          </button>
          <UserButton />
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <div className="fixed top-[57px] left-0 right-0 bg-indigo-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-40 md:hidden shadow-lg transition-colors duration-300">
            <div className="px-4 py-3 space-y-1">
              <button 
                onClick={() => handleNavigate('/dashboard')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-slate-800'
                }`}
              >
                {t('nav.dashboard')}
              </button>
              <button 
                onClick={() => handleNavigate('/history')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/history') 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-slate-800'
                }`}
              >
                {t('nav.history')}
              </button>
              <button 
                onClick={() => handleNavigate('/dashboard/subscription')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/dashboard/subscription') 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-slate-800'
                }`}
              >
                Subscription
              </button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
              <button 
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-rose-300 hover:bg-rose-50 transition-colors"
              >
                {t('nav.signOut')}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex-1 bg-indigo-100 dark:bg-slate-900 transition-colors duration-300">
        {children}
      </div>

      <Footer variant="light" />
    </div>
  );
}

function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'partA' | 'partB'>('partA');
  const { t } = useLanguage();
  const { status, refreshStatus } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>();
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle checkout redirect - only run once per checkout parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkout = params.get('checkout');
    
    if (!checkout) return; // No checkout parameter, skip
    
    if (checkout === 'success') {
      setCheckoutMessage({ type: 'success', text: 'Payment successful! Your subscription has been activated.' });
      // Refresh subscription status
      refreshStatus();
      // Clean up URL immediately to prevent re-running
      navigate('/dashboard', { replace: true });
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setCheckoutMessage(null), 5000);
      return () => clearTimeout(timer);
    } else if (checkout === 'cancelled') {
      setCheckoutMessage({ type: 'error', text: 'Payment was cancelled. You can try again anytime.' });
      // Clean up URL immediately to prevent re-running
      navigate('/dashboard', { replace: true });
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setCheckoutMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.search, navigate, refreshStatus]);

  const canStartExamLightweight = (examType: 'full' | 'partA' | 'partB'): { canStart: boolean; reason?: string } => {
    if (!status) {
      return { canStart: false, reason: 'Loading subscription status...' };
    }

    if (status.subscriptionType === 'EXPIRED') {
      return { canStart: false, reason: 'Subscription has expired' };
    }

    if (status.packExpirationDate) {
      const expirationDate = new Date(status.packExpirationDate);
      const now = new Date();
      if (now >= expirationDate) {
        return { canStart: false, reason: 'Pack has expired' };
      }
    }

    if (examType === 'full') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.fullTestsUsed < status.limits.fullTests;
      const hasPackCredits = status.packCredits && status.packCredits.fullTests.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: 'Daily full test limit reached and no pack credits available' };
      }
    } else if (examType === 'partA') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.sectionAUsed < status.limits.sectionA;
      const hasPackCredits = status.packCredits && status.packCredits.sectionA.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: 'Daily Section A limit reached and no pack credits available' };
      }
    } else if (examType === 'partB') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.sectionBUsed < status.limits.sectionB;
      const hasPackCredits = status.packCredits && status.packCredits.sectionB.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: 'Daily Section B limit reached and no pack credits available' };
      }
    }

    return { canStart: true };
  };

  const startExam = (mode: 'partA' | 'partB' | 'full') => {
    const examType = mode === 'full' ? 'full' : mode === 'partA' ? 'partA' : 'partB';
    const result = canStartExamLightweight(examType);
    
    if (result.canStart) {
      // When starting a new exam from the dashboard, always clear any previous
      // session/scenario for this mode so we generate a fresh random task.
      sessionStorage.removeItem(`exam_session_${mode}`);
      sessionStorage.removeItem(`exam_scenario_${mode}`);
      navigate(`/exam/${mode}`);
    } else {
      setPaywallReason(result.reason);
      setShowPaywall(true);
    }
  };

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-6 md:space-y-12">
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">{t('dashboard.greeting')}, {user?.firstName}!</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
        </div>

        {/* Checkout Success/Error Message */}
        {checkoutMessage && (
          <div className={`rounded-2xl p-4 md:p-6 border ${
            checkoutMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {checkoutMessage.type === 'success' ? (
                  <span className="text-2xl">✅</span>
                ) : (
                  <span className="text-2xl">❌</span>
                )}
                <p className="font-semibold">{checkoutMessage.text}</p>
              </div>
              <button
                onClick={() => setCheckoutMessage(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {status && status.packType && status.packExpirationDate && new Date(status.packExpirationDate) > new Date() && (() => {
          const expirationDate = new Date(status.packExpirationDate);
          const now = new Date();
          const diffTime = expirationDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 3 && diffDays > 0) {
            return (
              <div className="bg-amber-300/10 border border-amber-300/20 rounded-2xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-bold text-amber-700 mb-1">
                      Pack Expiring Soon
                    </h3>
                    <p className="text-xs md:text-sm text-amber-800 mb-2">
                      Your {status.packType === 'STARTER_PACK' ? 'Starter Pack' : 'Exam Ready Pack'} expires in {diffDays} {diffDays === 1 ? 'day' : 'days'}.
                    </p>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="text-xs md:text-sm text-amber-700 hover:text-amber-800 font-semibold underline"
                    >
                      Purchase New Pack →
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Subscription Status */}
        <div className="hidden md:block">
          <SubscriptionStatus />
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          reason={paywallReason}
        />

        {/* Mobile: Tabs for Section A and B */}
        <div className="md:hidden space-y-4">
          {/* Tab Buttons */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('partA')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'partA'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-blue-400 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Section A
            </button>
            <button
              onClick={() => setActiveTab('partB')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'partB'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-emerald-400 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Section B
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'partA' && (
            <div className="bg-indigo-100 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partA')}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📞</div>
              {status && (status.limits.sectionA > 0 || status.packCredits?.sectionA.remaining) && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Available</div>
                  <div className="text-lg font-black text-blue-400 dark:text-blue-300">
                    {(() => {
                      const dailyRemaining = status.limits.sectionA > 0 
                        ? Math.max(0, status.limits.sectionA - status.usage.sectionAUsed)
                        : 0;
                      const packRemaining = status.packCredits?.sectionA.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA) || (status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0) ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA && (
                        <span>Daily: {status.limits.sectionA - status.usage.sectionAUsed}/{status.limits.sectionA}</span>
                      )}
                      {status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA && status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0 && <span> • </span>}
                      {status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0 && (
                        <span>Pack: {status.packCredits.sectionA.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Section A</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-3">
                Posez des questions pour obtenir des informations. (4 min)
              </p>
              <div className="flex items-center text-blue-400 dark:text-blue-300 font-bold text-xs">
                Commencer <span className="ml-1">→</span>
              </div>
            </div>
          )}

          {activeTab === 'partB' && (
            <div className="bg-indigo-100 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partB')}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🤝</div>
              {status && (status.limits.sectionB > 0 || status.packCredits?.sectionB.remaining) && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Available</div>
                  <div className="text-lg font-black text-emerald-400 dark:text-emerald-300">
                    {(() => {
                      const dailyRemaining = status.limits.sectionB > 0 
                        ? Math.max(0, status.limits.sectionB - status.usage.sectionBUsed)
                        : 0;
                      const packRemaining = status.packCredits?.sectionB.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB) || (status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0) ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB && (
                        <span>Daily: {status.limits.sectionB - status.usage.sectionBUsed}/{status.limits.sectionB}</span>
                      )}
                      {status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB && status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0 && <span> • </span>}
                      {status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0 && (
                        <span>Pack: {status.packCredits.sectionB.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Section B</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-3">
                Argumentez pour convaincre un ami. (8 min)
              </p>
              <div className="flex items-center text-emerald-400 dark:text-emerald-300 font-bold text-xs">
                Commencer <span className="ml-1">→</span>
              </div>
            </div>
          )}

          {/* Exam Complet - Always visible below tabs */}
          <div className="bg-indigo-400 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer" onClick={() => startExam('full')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-100/20 rounded-xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">🏆</div>
              {status && (
                <div className="text-right">
                  <div className="text-xs text-indigo-200 mb-1">Available</div>
                  <div className="text-lg font-black text-white">
                    {(() => {
                      const dailyRemaining = status.limits.fullTests > 0 
                        ? Math.max(0, status.limits.fullTests - status.usage.fullTestsUsed)
                        : 0;
                      const packRemaining = status.packCredits?.fullTests.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests) || (status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0) ? (
                    <div className="text-xs text-indigo-300 mt-0.5">
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && (
                        <span>Daily: {status.limits.fullTests - status.usage.fullTestsUsed}/{status.limits.fullTests}</span>
                      )}
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && <span> • </span>}
                      {status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && (
                        <span>Pack: {status.packCredits.fullTests.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Examen Complet</h3>
            <p className="text-indigo-100 text-xs leading-relaxed mb-3">
              Enchaînez les deux sections pour une simulation réelle. (12 min)
            </p>
            <div className="flex items-center text-white font-bold text-xs">
              Commencer <span className="ml-1">→</span>
            </div>
          </div>
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          <div className="bg-indigo-100 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partA')}>
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📞</div>
              {status && (status.limits.sectionA > 0 || status.packCredits?.sectionA.remaining) && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Available</div>
                  <div className="text-2xl font-black text-blue-400 dark:text-blue-300">
                    {(() => {
                      const dailyRemaining = status.limits.sectionA > 0 
                        ? Math.max(0, status.limits.sectionA - status.usage.sectionAUsed)
                        : 0;
                      const packRemaining = status.packCredits?.sectionA.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA) || (status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0) ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA && (
                        <span>Daily: {status.limits.sectionA - status.usage.sectionAUsed}/{status.limits.sectionA}</span>
                      )}
                      {status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA && status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0 && <span> • </span>}
                      {status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0 && (
                        <span>Pack: {status.packCredits.sectionA.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Section A</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Posez des questions pour obtenir des informations. (4 min)
            </p>
            <div className="mt-6 flex items-center text-blue-400 dark:text-blue-300 font-bold text-sm">
              Commencer <span className="ml-2">→</span>
            </div>
          </div>

          <div className="bg-indigo-100 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partB')}>
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🤝</div>
              {status && (status.limits.sectionB > 0 || status.packCredits?.sectionB.remaining) && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Available</div>
                  <div className="text-2xl font-black text-emerald-400 dark:text-emerald-300">
                    {(() => {
                      const dailyRemaining = status.limits.sectionB > 0 
                        ? Math.max(0, status.limits.sectionB - status.usage.sectionBUsed)
                        : 0;
                      const packRemaining = status.packCredits?.sectionB.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB) || (status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0) ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB && (
                        <span>Daily: {status.limits.sectionB - status.usage.sectionBUsed}/{status.limits.sectionB}</span>
                      )}
                      {status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB && status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0 && <span> • </span>}
                      {status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0 && (
                        <span>Pack: {status.packCredits.sectionB.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Section B</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Argumentez pour convaincre un ami. (8 min)
            </p>
            <div className="mt-6 flex items-center text-emerald-400 dark:text-emerald-300 font-bold text-sm">
              Commencer <span className="ml-2">→</span>
            </div>
          </div>

          <div className="bg-indigo-400 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer" onClick={() => startExam('full')}>
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-indigo-100/20 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🏆</div>
              {status && (
                <div className="text-right">
                  <div className="text-xs text-indigo-200 mb-1">Available</div>
                  <div className="text-2xl font-black text-white">
                    {(() => {
                      const dailyRemaining = status.limits.fullTests > 0 
                        ? Math.max(0, status.limits.fullTests - status.usage.fullTestsUsed)
                        : 0;
                      const packRemaining = status.packCredits?.fullTests.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests) || (status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0) ? (
                    <div className="text-xs text-indigo-300 mt-1">
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && (
                        <span>Daily: {status.limits.fullTests - status.usage.fullTestsUsed}/{status.limits.fullTests}</span>
                      )}
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && <span> • </span>}
                      {status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && (
                        <span>Pack: {status.packCredits.fullTests.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Examen Complet</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Enchaînez les deux sections pour une simulation réelle. (12 min)
            </p>
            <div className="mt-6 flex items-center text-white font-bold text-sm">
              Commencer <span className="ml-2">→</span>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

function HistoryView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-12 flex flex-col h-full min-h-0">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors flex-shrink-0"
        >
          ← {t('back.dashboard')}
        </button>
        <div className="flex-1 min-h-0 overflow-hidden">
          <HistoryList />
        </div>
      </main>
    </DashboardLayout>
  );
}

function ResultView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [result, setResult] = useState<SavedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) {
      setLoading(false);
      return;
    }

    // Fetch result by ID
    const fetchResult = async () => {
      try {
        // First check localStorage for recently saved results (faster and more reliable for new results)
        const localResults = persistenceService.getResultsSync();
        const localFound = localResults.find(r => r._id === id);
        if (localFound) {
          setResult(localFound);
          setLoading(false);
          return;
        }

        // If not in localStorage, try fetching from backend
        const results = await persistenceService.getAllResults(user.id, getToken);
        const found = results.find(r => r._id === id);
        if (found) {
          setResult(found);
        } else {
          setError('Result not found');
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch result:', err);
        setError('Failed to load result');
        setLoading(false);
      }
    };
    
    fetchResult();
  }, [id, user, getToken]);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingResult />
      </DashboardLayout>
    );
  }

  if (error || !result) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={() => navigate('/history')}
              className="mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
            >
              ← {t('back.history')}
            </button>
            <div className="py-20 text-center">
              <p className="text-slate-500 dark:text-slate-400">{error || 'Result not found'}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
        <div className="max-w-7xl mx-auto">
          <DetailedResultView 
            result={result} 
            onBack={() => navigate('/history')} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function ExamView() {
  const { mode } = useParams<{ mode: 'partA' | 'partB' | 'full' }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [scenario, setScenario] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>();
  const [showWarning, setShowWarning] = useState(false);
  const [hasSeenWarning, setHasSeenWarning] = useState(false);
  const { startExam, checkCanStart, validateSession, loading: usageLoading } = useUsage();
  
  // Use the custom hook for result management
  const { result, isLoading, handleResult } = useExamResult({
    onSuccess: (savedResult) => {
      console.log('Exam completed successfully:', savedResult._id);
      sessionStorage.removeItem(`exam_session_${mode}`);
      sessionStorage.removeItem(`exam_scenario_${mode}`);
    },
    onError: (error) => {
      console.error('Exam error:', error);
      sessionStorage.removeItem(`exam_session_${mode}`);
      sessionStorage.removeItem(`exam_scenario_${mode}`);
    },
    autoNavigate: true,
    sessionId: sessionId || undefined,
  });

  // Track if we've initialized to prevent re-running
  const [hasInitialized, setHasInitialized] = useState(false);
  const initializedModeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mode || !['partA', 'partB', 'full'].includes(mode)) {
      navigate('/dashboard');
      return;
    }

    // Only run initialization once per mode
    if (hasInitialized && initializedModeRef.current === mode) return;

    // Validate session on page load/refresh
    const validateExistingSession = async () => {
      const storedSessionId = sessionStorage.getItem(`exam_session_${mode}`);
      const storedScenario = sessionStorage.getItem(`exam_scenario_${mode}`);
      
      if (storedSessionId) {
        const isValid = await validateSession(storedSessionId);
        if (isValid) {
          setSessionId(storedSessionId);
          
          // Restore scenario if it exists (for refresh recovery)
          if (storedScenario && !scenario) {
            try {
              const parsedScenario = JSON.parse(storedScenario);
              setScenario(parsedScenario);
              setHasInitialized(true);
              initializedModeRef.current = mode;
              return; // Don't generate new scenario if we restored one
            } catch (error) {
              console.error('Error parsing stored scenario:', error);
              // Fall through to generate new scenario
            }
          }
        } else {
          // Session invalid - usage already consumed
          sessionStorage.removeItem(`exam_session_${mode}`);
          sessionStorage.removeItem(`exam_scenario_${mode}`);
          alert('This exam session has expired. Usage was already consumed when the exam started.');
          navigate('/dashboard');
          return;
        }
      }
    };

    validateExistingSession();

    // Check if scenario was passed via location state (for retakes)
    if (location.state?.scenario && !scenario) {
      setScenario(location.state.scenario);
      // Store scenario for refresh recovery
      sessionStorage.setItem(`exam_scenario_${mode}`, JSON.stringify(location.state.scenario));
      setHasInitialized(true);
      initializedModeRef.current = mode;
    } else if (!scenario) {
      // Check if we have a stored scenario first
      const storedScenario = sessionStorage.getItem(`exam_scenario_${mode}`);
      if (storedScenario) {
        try {
          const parsedScenario = JSON.parse(storedScenario);
          setScenario(parsedScenario);
          setHasInitialized(true);
          initializedModeRef.current = mode;
        } catch (error) {
          console.error('Error parsing stored scenario:', error);
          // Fall through to generate new scenario
        }
      }
      
      // Only generate new scenario if we don't have one stored (for refresh recovery)
      if (!storedScenario && !scenario) {
        // Generate new scenario, excluding completed tasks
        const loadCompletedTaskIds = async () => {
        try {
          const results = await persistenceService.getAllResults(user?.id || 'guest', getToken);
          const completedIds: number[] = [];
          results.forEach(result => {
            if (result.taskPartA?.id) completedIds.push(result.taskPartA.id);
            if (result.taskPartB?.id) completedIds.push(result.taskPartB.id);
          });
          
          const { partA, partB } = getRandomTasks(completedIds);
          const newScenario = {
            title: mode === 'full' ? "Entraînement Complet" : (mode === 'partA' ? "Section A" : "Section B"),
            mode: mode,
            officialTasks: {
              partA,
              partB
            }
          };
          setScenario(newScenario);
          sessionStorage.setItem(`exam_scenario_${mode}`, JSON.stringify(newScenario));
          setHasInitialized(true);
          initializedModeRef.current = mode;
        } catch (error) {
          console.error('Error loading completed tasks:', error);
          const { partA, partB } = getRandomTasks();
          const newScenario = {
            title: mode === 'full' ? "Entraînement Complet" : (mode === 'partA' ? "Section A" : "Section B"),
            mode: mode,
            officialTasks: {
              partA,
              partB
            }
          };
          setScenario(newScenario);
          sessionStorage.setItem(`exam_scenario_${mode}`, JSON.stringify(newScenario));
          setHasInitialized(true);
          initializedModeRef.current = mode;
        }
        };
        
        loadCompletedTaskIds();
      }
    }
  }, [mode, navigate, user, validateSession, hasInitialized]);

  // Reset initialization when mode changes
  useEffect(() => {
    if (initializedModeRef.current !== mode) {
      setHasInitialized(false);
      initializedModeRef.current = null;
    }
  }, [mode]);

  // Check if user can start exam (without counting usage)
  // Only check once when scenario is first set - don't block rendering
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);
  
  useEffect(() => {
    if (scenario && !sessionId && user && !hasCheckedPermissions) {
      // Don't await - let it run in background
      const checkExam = async () => {
        try {
          const examType = mode === 'full' ? 'full' : mode === 'partA' ? 'partA' : 'partB';
          const result = await checkCanStart(examType);
          
          setHasCheckedPermissions(true);
          
          if (!result.canStart) {
            setPaywallReason(result.reason);
            setShowPaywall(true);
            // Don't clear scenario - let user see what they can't access
          }
          // If canStart is true, we just continue - scenario is already set
        } catch (error) {
          console.error('Error checking exam permissions:', error);
          setHasCheckedPermissions(true);
          // Don't block the exam if check fails - let it proceed
        }
      };

      checkExam();
    }
  }, [scenario, sessionId, user, mode, checkCanStart, hasCheckedPermissions]);
  
  // Reset permission check and warning when mode changes
  useEffect(() => {
    setHasCheckedPermissions(false);
    setHasSeenWarning(false);
  }, [mode]);

  // Show warning modal first when scenario is ready (only once, and only if user hasn't seen it)
  useEffect(() => {
    if (scenario && !showWarning && !showPaywall && hasInitialized && !hasSeenWarning) {
      setShowWarning(true);
    }
  }, [scenario, showWarning, showPaywall, hasInitialized, hasSeenWarning]);

  // Show loading state if result is loading
  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingResult />
      </DashboardLayout>
    );
  }

  // Show result view if we have a complete result but haven't navigated yet
  if (result && !result.isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <DetailedResultView 
              result={result} 
              onBack={() => navigate('/history')} 
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!scenario) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
          <div className="max-w-7xl mx-auto py-20 text-center animate-pulse text-slate-500">
            {showPaywall ? 'Checking subscription...' : 'Loading exam...'}
          </div>
          <PaywallModal
            isOpen={showPaywall}
            onClose={() => {
              setShowPaywall(false);
              navigate('/dashboard');
            }}
            reason={paywallReason}
          />
        </div>
      </DashboardLayout>
    );
  }

  const handleConfirmWarning = () => {
    setShowWarning(false);
    setHasSeenWarning(true);
  };

  const handleCancelWarning = () => {
    setShowWarning(false);
    setHasSeenWarning(true);
    setScenario(null);
    navigate('/dashboard');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-3 md:p-6 transition-colors">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider cursor-pointer"
          >
            ← {t('back.dashboard')}
          </button>
          {scenario && !showWarning && <OralExpressionLive scenario={scenario} onFinish={handleResult} onSessionStart={startExam} mode={mode} />}
          <ExamWarningModal
            isOpen={showWarning}
            onConfirm={handleConfirmWarning}
            onCancel={handleCancelWarning}
            examType={mode}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function SubscriptionManagementView() {
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col overflow-hidden">
        <SubscriptionManagement />
      </div>
    </DashboardLayout>
  );
}

function PricingView() {
  return <PricingPage />;
}

function ProtectedRoutes() {
  // Trial will be auto-initialized when subscription status is first checked
  // This happens automatically in useSubscription hook when user loads dashboard

  return (
    <>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<HistoryView />} />
        <Route path="/results/:id" element={<ResultView />} />
        <Route path="/exam/:mode" element={<ExamView />} />
        <Route path="/dashboard/subscription" element={<SubscriptionManagementView />} />
        <Route path="/pricing" element={<PricingView />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

// Custom Clerk theme matching app's theme (light/dark)
const getClerkAppearance = (theme: 'light' | 'dark') => ({
  baseTheme: theme === 'dark' ? 'dark' : undefined,
  variables: {
    colorPrimary: theme === 'dark' ? '#818cf8' : '#6366f1', // indigo-400 : indigo-500
    colorBackground: theme === 'dark' ? '#1e293b' : '#ffffff', // slate-800 : white
    colorInputBackground: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
    colorInputText: theme === 'dark' ? '#f1f5f9' : '#0f172a', // slate-100 : slate-900
    colorText: theme === 'dark' ? '#f1f5f9' : '#0f172a', // slate-100 : slate-900
    colorTextSecondary: theme === 'dark' ? '#cbd5e1' : '#475569', // slate-300 : slate-600
    borderRadius: '1rem',
    fontFamily: 'Inter, sans-serif',
  },
  elements: {
    rootBox: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    card: {
      borderRadius: '2rem',
      boxShadow: theme === 'dark' 
        ? '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', // slate-800 : white
    },
    headerTitle: {
      fontWeight: '900',
      letterSpacing: '-0.025em',
      color: theme === 'dark' ? '#f1f5f9' : '#0f172a', // slate-100 : slate-900
      fontSize: '1.5rem',
    },
    headerSubtitle: {
      color: theme === 'dark' ? '#94a3b8' : '#64748b', // slate-400 : slate-500
      fontSize: '0.875rem',
    },
    socialButtonsBlockButton: {
      borderRadius: '1rem',
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#475569' : '#f1f5f9', // slate-600 : slate-100
        color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important',
      },
    },
    socialButtonsBlockButtonText: {
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
    },
    formButtonPrimary: {
      borderRadius: '1rem',
      textTransform: 'uppercase',
      fontWeight: '800',
      letterSpacing: '0.05em',
      fontSize: '0.75rem',
      backgroundColor: theme === 'dark' ? '#6366f1' : '#6366f1', // indigo-500
      color: '#ffffff !important',
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#818cf8' : '#4f46e5', // indigo-400 : indigo-600
        color: '#ffffff !important',
      },
    },
    formButtonSecondary: {
      borderRadius: '1rem',
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#475569' : '#f1f5f9', // slate-600 : slate-100
        color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important',
      },
    },
    button: {
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
    },
    buttonPrimary: {
      backgroundColor: theme === 'dark' ? '#6366f1' : '#6366f1', // indigo-500
      color: '#ffffff !important',
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#818cf8' : '#4f46e5', // indigo-400 : indigo-600
        color: '#ffffff !important',
      },
    },
    buttonSecondary: {
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#475569' : '#f1f5f9', // slate-600 : slate-100
        color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important',
      },
    },
    formFieldInput: {
      borderRadius: '0.75rem',
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
      '&::placeholder': {
        color: theme === 'dark' ? '#94a3b8 !important' : '#94a3b8 !important', // slate-400
      },
      '&:focus': {
        borderColor: theme === 'dark' ? '#818cf8' : '#6366f1', // indigo-400 : indigo-500
        boxShadow: theme === 'dark' 
          ? '0 0 0 3px rgba(129, 140, 248, 0.2)'
          : '0 0 0 3px rgba(99, 102, 241, 0.1)',
        color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important',
      },
    },
    formFieldLabel: {
      color: theme === 'dark' ? '#cbd5e1 !important' : '#475569 !important', // slate-300 : slate-600
      fontWeight: '600',
      fontSize: '0.875rem',
    },
    formFieldSuccessText: {
      color: theme === 'dark' ? '#86efac !important' : '#22c55e !important', // emerald-400 : emerald-500
    },
    formFieldErrorText: {
      color: theme === 'dark' ? '#f87171 !important' : '#ef4444 !important', // red-400 : red-500
    },
    footerActionLink: {
      color: theme === 'dark' ? '#818cf8 !important' : '#6366f1 !important', // indigo-400 : indigo-500
      fontWeight: '600',
      '&:hover': {
        color: theme === 'dark' ? '#a5b4fc !important' : '#4f46e5 !important', // indigo-300 : indigo-600
      },
    },
    footerPages: {
      color: theme === 'dark' ? '#cbd5e1 !important' : '#475569 !important', // slate-300 : slate-600
    },
    identityPreviewText: {
      color: theme === 'dark' ? '#f1f5f9' : '#0f172a', // slate-100 : slate-900
    },
    identityPreviewEditButton: {
      color: theme === 'dark' ? '#818cf8' : '#6366f1', // indigo-400 : indigo-500
    },
    alertText: {
      color: theme === 'dark' ? '#cbd5e1 !important' : '#475569 !important', // slate-300 : slate-600
    },
    alert: {
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      color: theme === 'dark' ? '#cbd5e1 !important' : '#475569 !important', // slate-300 : slate-600
    },
    formResendCodeLink: {
      color: theme === 'dark' ? '#818cf8 !important' : '#6366f1 !important', // indigo-400 : indigo-500
      '&:hover': {
        color: theme === 'dark' ? '#a5b4fc !important' : '#4f46e5 !important', // indigo-300 : indigo-600
      },
    },
    otpCodeFieldInput: {
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
    },
    dividerLine: {
      backgroundColor: theme === 'dark' 
        ? 'rgba(51, 65, 85, 0.8)' 
        : 'rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
    },
    dividerText: {
      color: theme === 'dark' ? '#64748b' : '#94a3b8', // slate-500 : slate-400
    },
  },
});

// Wrapper component to access theme context
function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  // Get theme from localStorage initially, then sync with DOM
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      return savedTheme || 'light';
    }
    return 'light';
  });

  // Listen to DOM class changes to sync with ThemeContext
  React.useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    // Initial check
    updateTheme();

    // Watch for class changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Also listen to storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        updateTheme();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={getClerkAppearance(theme)}
      signInUrl="/"
      signUpUrl="/"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}

function App() {
  return (
    <ClerkProviderWithTheme>
      <BrowserRouter>
        <SignedOut>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SignedOut>
        <SignedIn>
          <ProtectedRoutes />
        </SignedIn>
      </BrowserRouter>
    </ClerkProviderWithTheme>
  );
}

export default App;
