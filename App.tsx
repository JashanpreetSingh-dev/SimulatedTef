import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { OralExpressionLive } from './components/OralExpressionLive';
import { HistoryList } from './components/HistoryList';
import { DetailedResultView } from './components/DetailedResultView';
import { LoadingResult } from './components/LoadingResult';
import { SavedResult } from './types';
import { getRandomTasks, getTaskById } from './services/tasks';
import { persistenceService } from './services/persistence';

const PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
        <div className="z-10 text-center space-y-8 sm:space-y-12 max-w-5xl mx-auto w-full">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-[-0.02em] leading-[1.05] px-2 animate-fade-in-up">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">Akseli</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight px-2 animate-fade-in-up delay-200">
              Build better French, faster
            </h2>
            <p className="text-slate-400 text-base sm:text-lg md:text-xl lg:text-2xl font-normal max-w-3xl mx-auto leading-[1.6] px-4 animate-fade-in-up delay-300">
              The exam simulator trusted by candidates preparing for Canadian immigration. 
              Practice with real scenarios and get evaluated by AI trained on the official CCI Paris framework.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 w-full px-4 animate-fade-in-up delay-400">
            <SignUpButton mode="modal">
              <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-slate-900 font-semibold text-base sm:text-lg hover:bg-indigo-50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]">
                Start for free
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-slate-900/60 backdrop-blur-md text-white font-semibold text-base sm:text-lg hover:bg-slate-800/60 transition-all duration-300 border border-slate-800/50 hover:border-slate-700/50 hover:scale-[1.02] active:scale-[0.98]">
                Sign in
              </button>
            </SignInButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-12 mb-12 sm:mb-16 md:mb-20">
            <div className="space-y-3 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-[-0.02em]">
                Create, practice, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">succeed</span>
              </h2>
              <p className="text-slate-400 text-base sm:text-lg leading-[1.7] hidden sm:block">
                Everything you need to prepare, practice, and track your progress—all in one platform.
              </p>
            </div>
            <div className="flex items-center">
              <p className="text-slate-400 text-base sm:text-lg leading-[1.7] hidden md:block">
                Scale without switching tools. All your exam preparation in one place.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="group space-y-2 sm:space-y-4 p-4 sm:p-6 rounded-2xl hover:bg-slate-900/40 transition-all duration-300 hover:scale-[1.02] animate-scale-in delay-100">
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-2xl sm:text-2xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all duration-300">🎯</div>
              <h3 className="text-base sm:text-xl font-bold text-white">Official Format</h3>
              <p className="text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Real TEF Canada scenarios with exact time limits and official exam structure.
              </p>
            </div>

            <div className="group space-y-2 sm:space-y-4 p-4 sm:p-6 rounded-2xl hover:bg-slate-900/40 transition-all duration-300 hover:scale-[1.02] animate-scale-in delay-200">
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-2xl sm:text-2xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-cyan-500/30 transition-all duration-300">🤖</div>
              <h3 className="text-base sm:text-xl font-bold text-white">AI Evaluation</h3>
              <p className="text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                CCI Paris framework evaluation with accurate CLB and CECR assessments.
              </p>
            </div>

            <div className="group space-y-2 sm:space-y-4 p-4 sm:p-6 rounded-2xl hover:bg-slate-900/40 transition-all duration-300 hover:scale-[1.02] animate-scale-in delay-300">
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl sm:text-2xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-emerald-500/30 transition-all duration-300">🎙️</div>
              <h3 className="text-base sm:text-xl font-bold text-white">Live Audio</h3>
              <p className="text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Real-time conversation practice with advanced speech recognition.
              </p>
            </div>

            <div className="group space-y-2 sm:space-y-4 p-4 sm:p-6 rounded-2xl hover:bg-slate-900/40 transition-all duration-300 hover:scale-[1.02] animate-scale-in delay-400">
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl sm:text-2xl mb-2 sm:mb-4 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all duration-300">📊</div>
              <h3 className="text-base sm:text-xl font-bold text-white">CLB Scoring</h3>
              <p className="text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                Get TEF scores (0-699) and CLB levels for Canadian immigration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Akseli Section */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 md:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
              Why Akseli beats <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">generic AI</span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4 hidden sm:block">
              Training with ChatGPT or plain AI models won't prepare you for the real exam. Here's what makes Akseli different.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Akseli Column */}
            <div className="space-y-2 sm:space-y-6 p-4 sm:p-8 rounded-3xl bg-slate-900/40 backdrop-blur-sm border border-indigo-500/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-base sm:text-xl font-black text-indigo-400 shadow-lg shadow-indigo-500/10">
                  A
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-white">Akseli</h3>
              </div>
              
              <div className="space-y-2 sm:space-y-5">
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 text-base sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-base">Official exam format</p>
                    <p className="text-slate-400 text-xs sm:text-sm leading-[1.4] hidden sm:block">Real scenarios, time limits, structure</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 text-base sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-base">CCI Paris framework</p>
                    <p className="text-slate-400 text-xs sm:text-sm leading-[1.4] hidden sm:block">Official TEF evaluation criteria</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 text-base sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-base">CLB, CECR, TEF scores</p>
                    <p className="text-slate-400 text-xs sm:text-sm leading-[1.4] hidden sm:block">0-699 scale, immigration-ready</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 text-base sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-base">Real-time audio</p>
                    <p className="text-slate-400 text-xs sm:text-sm leading-[1.4] hidden sm:block">Live conversation practice</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-start gap-2 sm:gap-3 group">
                  <span className="text-emerald-400 text-base sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-base">Official exam scenarios</p>
                    <p className="text-slate-400 text-xs sm:text-sm leading-[1.4]">OCR-extracted from real materials</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-start gap-2 sm:gap-3 group">
                  <span className="text-emerald-400 text-base sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-base">Performance tracking</p>
                    <p className="text-slate-400 text-xs sm:text-sm leading-[1.4]">Full history and progress monitoring</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-start gap-2 sm:gap-3 group">
                  <span className="text-emerald-400 text-base sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-base">Specialized examiner AI</p>
                    <p className="text-slate-400 text-xs sm:text-sm leading-[1.4]">Trained to act as official examiner</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-start gap-2 sm:gap-3 group">
                  <span className="text-emerald-400 text-base sm:text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">✓</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs sm:text-base">Model answers & improvements</p>
                    <p className="text-slate-400 text-xs sm:text-sm leading-[1.4]">Detailed examples and upgrades</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ChatGPT/Plain AI Column */}
            <div className="space-y-2 sm:space-y-6 p-4 sm:p-8 rounded-3xl bg-slate-900/20 backdrop-blur-sm border border-slate-800/30">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-base sm:text-xl font-black text-slate-500">
                  AI
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-500">ChatGPT / Plain AI</h3>
              </div>
              
              <div className="space-y-2 sm:space-y-5">
                <div className="flex items-start gap-2">
                  <span className="text-slate-600 text-base sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 font-semibold text-xs sm:text-base">Generic conversation</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-[1.4] hidden sm:block">No exam structure</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-600 text-base sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 font-semibold text-xs sm:text-base">No framework</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-[1.4] hidden sm:block">Generic feedback only</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-600 text-base sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 font-semibold text-xs sm:text-base">No scoring</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-[1.4] hidden sm:block">No standardized assessment</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-600 text-base sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 font-semibold text-xs sm:text-base">Text-based</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-[1.4] hidden sm:block">No real-time audio practice</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-start gap-2 sm:gap-3">
                  <span className="text-slate-600 text-base sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 font-semibold text-xs sm:text-base">Random topics</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-[1.4]">Not exam-specific</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-start gap-2 sm:gap-3">
                  <span className="text-slate-600 text-base sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 font-semibold text-xs sm:text-base">No tracking</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-[1.4]">No progress monitoring</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-start gap-2 sm:gap-3">
                  <span className="text-slate-600 text-base sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 font-semibold text-xs sm:text-base">Generic assistant</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-[1.4]">Not exam-focused</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-start gap-2 sm:gap-3">
                  <span className="text-slate-600 text-base sm:text-xl mt-0.5 flex-shrink-0">✗</span>
                  <div className="min-w-0">
                    <p className="text-slate-500 font-semibold text-xs sm:text-base">Basic suggestions</p>
                    <p className="text-slate-600 text-xs sm:text-sm leading-[1.4]">No exam-specific examples</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA Section */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Launch faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">Akseli</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 leading-[1.6] max-w-2xl mx-auto px-4">
            Join candidates preparing for Canadian immigration with the most accurate TEF exam simulator available.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full px-4">
            <SignUpButton mode="modal">
              <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-slate-900 font-semibold text-base sm:text-lg hover:bg-indigo-50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]">
                Start for free
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-slate-900/60 backdrop-blur-md text-white font-semibold text-base sm:text-lg hover:bg-slate-800/60 transition-all duration-300 border border-slate-800/50 hover:border-slate-700/50 hover:scale-[1.02] active:scale-[0.98]">
                Sign in
              </button>
            </SignInButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
        <div className="flex items-center gap-4 md:gap-8">
          <span 
            className="font-black text-lg md:text-xl text-slate-900 dark:text-white cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            Akseli
          </span>
          <div className="hidden md:flex gap-4 text-sm font-bold">
            <button 
              onClick={() => navigate('/dashboard')}
              className={isActive('/dashboard') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}>
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/history')}
              className={isActive('/history') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}>
              History
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
            className="hidden md:block text-sm font-bold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
          >
            Sign Out
          </button>
          <UserButton />
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <div className="fixed top-[57px] left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 md:hidden shadow-lg">
            <div className="px-4 py-3 space-y-1">
              <button 
                onClick={() => handleNavigate('/dashboard')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigate('/history')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/history') 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                History
              </button>
              <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
              <button 
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {children}
    </div>
  );
}

function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'partA' | 'partB'>('partA');

  const startExam = (mode: 'partA' | 'partB' | 'full') => {
    navigate(`/exam/${mode}`);
  };

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-6 md:space-y-12">
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Bonjour, {user?.firstName}!</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Ready to practice your oral expression today?</p>
        </div>

        {/* Mobile: Tabs for Section A and B */}
        <div className="md:hidden space-y-4">
          {/* Tab Buttons */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('partA')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'partA'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Section A
            </button>
            <button
              onClick={() => setActiveTab('partB')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'partB'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Section B
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'partA' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partA')}>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">📞</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Section A</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-3">
                Posez des questions pour obtenir des informations. (4 min)
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                Commencer <span className="ml-1">→</span>
              </div>
            </div>
          )}

          {activeTab === 'partB' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partB')}>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Section B</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-3">
                Argumentez pour convaincre un ami. (8 min)
              </p>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                Commencer <span className="ml-1">→</span>
              </div>
            </div>
          )}

          {/* Exam Complet - Always visible below tabs */}
          <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-indigo-600/20 transition-all group cursor-pointer" onClick={() => startExam('full')}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:rotate-12 transition-transform">🏆</div>
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partA')}>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">📞</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Section A</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Posez des questions pour obtenir des informations. (4 min)
            </p>
            <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              Commencer <span className="ml-2">→</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partB')}>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🤝</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Section B</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Argumentez pour convaincre un ami. (8 min)
            </p>
            <div className="mt-6 flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              Commencer <span className="ml-2">→</span>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-600/20 transition-all group cursor-pointer" onClick={() => startExam('full')}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-12 transition-transform">🏆</div>
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
  
  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-12 space-y-6 md:space-y-12">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-3 md:mb-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
        >
          ← Back to Dashboard
        </button>
        <HistoryList />
      </main>
    </DashboardLayout>
  );
}

function ResultView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
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
        const token = await getToken();
        const results = await persistenceService.getAllResults(user.id, token);
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={() => navigate('/history')}
              className="mb-3 md:mb-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
            >
              ← Back to History
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
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
  const [scenario, setScenario] = useState<any>(null);

  useEffect(() => {
    if (!mode || !['partA', 'partB', 'full'].includes(mode)) {
      navigate('/dashboard');
      return;
    }

    // Check if scenario was passed via location state (for retakes)
    if (location.state?.scenario) {
      setScenario(location.state.scenario);
    } else {
      // Generate new scenario, excluding completed tasks
      const loadCompletedTaskIds = async () => {
        try {
          const token = await getToken();
          const results = await persistenceService.getAllResults(user?.id || 'guest', token);
          // Extract completed task IDs from results
          const completedIds: number[] = [];
          results.forEach(result => {
            if (result.taskPartA?.id) completedIds.push(result.taskPartA.id);
            if (result.taskPartB?.id) completedIds.push(result.taskPartB.id);
          });
          
          // Get random tasks excluding completed ones
          const { partA, partB } = getRandomTasks(completedIds);
          setScenario({
            title: mode === 'full' ? "Entraînement Complet" : (mode === 'partA' ? "Section A" : "Section B"),
            mode: mode,
            officialTasks: {
              partA,
              partB
            }
          });
        } catch (error) {
          console.error('Error loading completed tasks:', error);
          // Fallback to random selection without filtering
          const { partA, partB } = getRandomTasks();
          setScenario({
            title: mode === 'full' ? "Entraînement Complet" : (mode === 'partA' ? "Section A" : "Section B"),
            mode: mode,
            officialTasks: {
              partA,
              partB
            }
          });
        }
      };
      
      loadCompletedTaskIds();
    }
  }, [mode, location.state, navigate, user]);

  const handleFinish = async (savedResult: SavedResult) => {
    // Navigate to result view with the saved result ID
    if (savedResult._id) {
      navigate(`/results/${savedResult._id}`);
    } else {
      // Fallback to history if no ID
      navigate('/history');
    }
  };

  if (!scenario) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
          <div className="max-w-7xl mx-auto py-20 text-center animate-pulse text-slate-400">
            Loading exam...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 md:p-8">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mb-3 md:mb-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider"
          >
            ← Back to Dashboard
          </button>
          <OralExpressionLive scenario={scenario} onFinish={handleFinish} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/history" element={<HistoryView />} />
      <Route path="/results/:id" element={<ResultView />} />
      <Route path="/exam/:mode" element={<ExamView />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Custom Clerk theme matching app's indigo/slate design
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#6366f1', // indigo-500
    colorBackground: '#0f172a', // slate-900
    colorInputBackground: '#1e293b', // slate-800
    colorInputText: '#f1f5f9', // slate-100
    colorText: '#f8fafc', // slate-50
    colorTextSecondary: '#cbd5e1', // slate-300
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
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(30, 41, 59, 0.8)', // slate-800
      backgroundColor: '#0f172a', // slate-900
    },
    headerTitle: {
      fontWeight: '900',
      letterSpacing: '-0.025em',
      color: '#f8fafc', // slate-50
      fontSize: '1.5rem',
    },
    headerSubtitle: {
      color: '#94a3b8', // slate-400
      fontSize: '0.875rem',
    },
    socialButtonsBlockButton: {
      borderRadius: '1rem',
      border: '1px solid rgba(30, 41, 59, 0.5)',
      backgroundColor: '#1e293b', // slate-800
      color: '#f8fafc', // slate-50
      '&:hover': {
        backgroundColor: '#334155', // slate-700
      },
    },
    formButtonPrimary: {
      borderRadius: '1rem',
      textTransform: 'uppercase',
      fontWeight: '800',
      letterSpacing: '0.05em',
      fontSize: '0.75rem',
      backgroundColor: '#6366f1', // indigo-500
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#4f46e5', // indigo-600
      },
    },
    formFieldInput: {
      borderRadius: '0.75rem',
      backgroundColor: '#1e293b', // slate-800
      border: '1px solid rgba(30, 41, 59, 0.5)',
      color: '#f1f5f9', // slate-100
      '&:focus': {
        borderColor: '#6366f1', // indigo-500
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
      },
    },
    formFieldLabel: {
      color: '#cbd5e1', // slate-300
      fontWeight: '600',
      fontSize: '0.875rem',
    },
    footerActionLink: {
      color: '#818cf8', // indigo-400
      fontWeight: '600',
      '&:hover': {
        color: '#6366f1', // indigo-500
      },
    },
    identityPreviewText: {
      color: '#f8fafc', // slate-50
    },
    identityPreviewEditButton: {
      color: '#818cf8', // indigo-400
    },
    alertText: {
      color: '#cbd5e1', // slate-300
    },
    dividerLine: {
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
    },
    dividerText: {
      color: '#94a3b8', // slate-400
    },
  },
};

function App() {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={clerkAppearance}
    >
      <BrowserRouter>
        <SignedOut>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SignedOut>
        <SignedIn>
          <ProtectedRoutes />
        </SignedIn>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
