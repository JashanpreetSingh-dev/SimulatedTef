import React, { useState } from 'react';
import LogRocket from 'logrocket';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { FAQSection } from '../components/FAQSection';
import { ExamInterfaceShowcase } from '../components/ExamInterfaceShowcase';
import { ResultsDashboardShowcase } from '../components/ResultsDashboardShowcase';
import { BatchManagementShowcase } from '../components/BatchManagementShowcase';
import { AssignmentCreationShowcase } from '../components/AssignmentCreationShowcase';
import { EnterpriseCTA } from '../components/EnterpriseCTA';
import { SubscriptionPlans } from '../components/SubscriptionPlans';
import { Footer } from '../components/Footer';
import { PromoBanner } from '../components/PromoBanner';
import activePromo from '../config/promoConfig';

// Animation variants
const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};
const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

export function LandingPage() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [audience, setAudience] = useState<'d2c' | 'b2b'>('d2c'); // Default to D2C
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <Helmet>
        <html lang="en" />
        <title>TEF Canada Oral Practice Online – Akseli AI Examiner</title>
        <meta name="description" content="Practice TEF Canada oral sections A and B with an AI examiner that simulates the real exam. 30 oral sessions for less than one hour of tutoring. Instant feedback, on your schedule." />
        <meta name="keywords" content="TEF Canada oral practice, TEF Canada speaking practice, TEF Canada online, simulated TEF exam, AI French examiner, TEF Canada preparation, practique TEF Canada" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TEF Canada Oral Practice Online – Akseli AI Examiner" />
        <meta property="og:description" content="Practice TEF Canada oral sections A and B with an AI examiner. 30 oral sessions for less than one hour of TEF tutoring. Instant feedback, any time of day." />
        <meta property="og:image" content="/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TEF Canada Oral Practice Online – Akseli AI Examiner" />
        <meta name="twitter:description" content="Practice TEF Canada Sections A and B with an AI examiner. Less than one hour of tutoring per month." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Do these questions match the real TEF Canada oral exam?', acceptedAnswer: { '@type': 'Answer', text: 'The prompts are modeled on official TEF Canada oral structures — the same types of scenarios and question formats — but are not official CCIP/CCI Paris content.' } },
            { '@type': 'Question', name: 'Can I practice TEF Canada oral sections A and B separately?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. You can focus on Section A (short interview-style questions), Section B (longer role-plays), or run a full oral session that chains both.' } },
            { '@type': 'Question', name: 'How many practice sessions do I get per month?', acceptedAnswer: { '@type': 'Answer', text: 'Basic plan: 10 oral sessions per month ($25/mo). Premium plan: 30 oral sessions per month ($45/mo).' } },
            { '@type': 'Question', name: 'Is this enough to replace a TEF tutor?', acceptedAnswer: { '@type': 'Answer', text: 'Akseli is great for volume and speaking comfort. It gives you on-demand practice any time of day — but if you can afford both, a human tutor is still valuable for personalized coaching.' } },
            { '@type': 'Question', name: 'Can I try a TEF Canada practice session for free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Sign up for a free account and try your first oral practice session before subscribing.' } },
          ],
        })}</script>
      </Helmet>

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
              {/* Audience Toggle - Desktop */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setAudience('d2c')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    audience === 'd2c'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  For Students
                </button>
                <button
                  onClick={() => setAudience('b2b')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    audience === 'b2b'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  For Institutions
                </button>
              </div>
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
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
                <button className="px-4 sm:px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-600 text-white font-semibold text-sm sm:text-base hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-300 border border-indigo-400 dark:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30">
                  Sign up
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="px-4 sm:px-6 py-2 rounded-full bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-md text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base hover:bg-indigo-200 dark:hover:bg-slate-700 transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>
        </nav>
      </header>

      {/* Promo Banner */}
      <PromoBanner promo={activePromo} />

      {/* Hero Section - Dynamic based on audience */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
        <div className="text-center space-y-8 sm:space-y-12 max-w-5xl mx-auto w-full">
          {/* Audience Toggle - Mobile */}
          <div className="md:hidden flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-4">
            <button
              onClick={() => setAudience('d2c')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                audience === 'd2c'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              For Students
            </button>
            <button
              onClick={() => setAudience('b2b')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                audience === 'b2b'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              For Institutions
            </button>
          </div>

          <AnimatePresence mode="wait">
          {audience === 'd2c' ? (
            // D2C Hero Content — TEF Canada oral focused
            <motion.div key="d2c" variants={heroContainer} initial="hidden" animate="show" className="w-full space-y-8 sm:space-y-12">
              <motion.p variants={heroItem} className="text-sm font-semibold text-teal-700 dark:text-teal-400 tracking-[0.2em] uppercase">
                Akseli • TEF Canada
              </motion.p>
              <motion.h1 variants={heroItem} className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-black tracking-[-0.02em] leading-[1.05] px-2 text-slate-900 dark:text-slate-50">
                TEF Canada oral practice, with an AI examiner
              </motion.h1>
              <motion.p variants={heroItem} className="text-slate-600 dark:text-slate-300 text-base sm:text-lg md:text-xl lg:text-2xl font-normal max-w-3xl mx-auto leading-[1.6] px-4">
                Practice TEF Canada Sections A and B with realistic prompts and timing. Get comfortable speaking out loud before you ever meet the real examiner.
              </motion.p>
              <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
                <p className="text-teal-700 dark:text-teal-400 text-sm sm:text-base font-semibold">
                  ✨ 30 oral sessions for less than one hour of tutoring
                </p>
                <span className="hidden sm:inline text-slate-400">•</span>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
                  Designed specifically for TEF Canada oral preparation
                </p>
              </motion.div>
              <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 w-full px-4">
                <SignUpButton
                  mode="modal"
                  fallbackRedirectUrl="/dashboard"
                  signInFallbackRedirectUrl="/dashboard"
                  afterSignUpUrl="/dashboard"
                >
                  <button
                    className="group relative w-full sm:w-auto px-8 py-4 rounded-full bg-teal-700 text-white font-semibold text-base sm:text-lg hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-900 dark:hover:bg-teal-400 transition-colors duration-200 active:scale-[0.98]"
                    onClick={() => {
                      LogRocket.track('marketing_cta_click', {
                        location: 'hero',
                        action: 'start_free_tef_practice',
                      });
                    }}
                  >
                    <span className="relative z-10">Start a free TEF practice</span>
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="group relative w-full sm:w-auto px-6 py-4 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-100 font-semibold text-base sm:text-lg hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700 active:scale-[0.98]">
                    <span className="relative z-10">Sign in</span>
                  </button>
                </SignInButton>
              </motion.div>
            </motion.div>
          ) : (
            // B2B Hero Content
            <motion.div key="b2b" variants={heroContainer} initial="hidden" animate="show" className="w-full space-y-8 sm:space-y-12">
              <motion.div variants={heroItem} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-indigo-600 dark:text-indigo-300 text-sm font-medium">For Language Schools & Institutions</span>
              </motion.div>
              <motion.h1 variants={heroItem} className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-black tracking-[-0.02em] leading-[1.05] px-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Akseli</span>
              </motion.h1>
              <motion.h2 variants={heroItem} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tight px-2">
                Enterprise TEF Canada Preparation Platform
              </motion.h2>
              <motion.p variants={heroItem} className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl lg:text-2xl font-normal max-w-3xl mx-auto leading-[1.6] px-4">
                Empower your institution with AI-powered assessments, student management, and custom content creation. Scale your TEF Canada preparation program efficiently.
              </motion.p>
              <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 w-full px-4">
                <a
                  href="#enterprise-cta"
                  className="group relative w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-600 text-white dark:text-white font-semibold text-base sm:text-lg hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-300 active:scale-[0.98] overflow-hidden text-center"
                >
                  <span className="relative z-10">Request Enterprise Demo</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                </a>
                <SignInButton mode="modal">
                  <button className="group relative w-full sm:w-auto px-6 py-4 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-100 font-semibold text-base sm:text-lg hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700 active:scale-[0.98] overflow-hidden">
                    <span className="relative z-10">Sign in</span>
                  </button>
                </SignInButton>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </section>

      {/* Features Section - Show relevant features based on audience */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16"
      >
        <div className="max-w-6xl mx-auto">
          {audience === 'd2c' ? (
            // D2C Features
            <>
              <div className="space-y-3 sm:space-y-6 mb-12 sm:mb-16 md:mb-20">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 leading-[1.1] tracking-[-0.02em]">
                  Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">succeed</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-[1.7]">
                  Practice all 4 TEF Canada modules with AI-powered evaluation and detailed feedback.
                </p>
              </div>
              
              <motion.div variants={cardContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Student Features */}
                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 group-hover:rotate-3 transition-all duration-300">📝</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Practice Mode</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Unlimited practice sessions for all 4 modules. Learn at your own pace with no time pressure.
                  </p>
                </motion.div>

                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800 group-hover:rotate-3 transition-all duration-300">🎯</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Mock Exams</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Full simulation with official time limits. Experience the real exam conditions before test day.
                  </p>
                </motion.div>

                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 group-hover:rotate-3 transition-all duration-300">🎙️</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">AI Oral Evaluation</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Live conversation with AI examiner. Get instant feedback on pronunciation, fluency, and grammar.
                  </p>
                </motion.div>

                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-amber-200 dark:group-hover:bg-amber-800 group-hover:rotate-3 transition-all duration-300">✍️</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">AI Written Evaluation</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Submit essays and get detailed AI feedback using official CCI Paris scoring criteria.
                  </p>
                </motion.div>

                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 group-hover:rotate-3 transition-all duration-300">📊</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">CLB Scoring</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Get TEF scores (0-699) and CLB levels mapped for Canadian immigration applications.
                  </p>
                </motion.div>

                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-indigo-100 dark:bg-slate-800/50 hover:bg-indigo-200 dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-rose-200 dark:group-hover:bg-rose-800 group-hover:rotate-3 transition-all duration-300">📈</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Progress Tracking</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Track your improvement over time with detailed history and performance analytics.
                  </p>
                </motion.div>
              </motion.div>
            </>
          ) : (
            // B2B Features
            <>
              <div className="space-y-3 sm:space-y-6 mb-12 sm:mb-16 md:mb-20">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 leading-[1.1] tracking-[-0.02em]">
                  Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">features</span> for institutions
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-[1.7]">
                  Powerful tools to manage students, create assessments, and scale your TEF Canada preparation program.
                </p>
              </div>
              
              <motion.div variants={cardContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 hover:from-violet-200 hover:to-indigo-200 dark:hover:from-violet-800/40 dark:hover:to-indigo-800/40 transition-colors duration-200 border border-violet-200 dark:border-violet-700">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 group-hover:rotate-3 transition-all duration-300">🪄</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">AI Assessment Creator</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Generate custom Reading & Listening assessments with AI. Just describe the topic and let AI create questions.
                  </p>
                </motion.div>

                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 hover:from-violet-200 hover:to-indigo-200 dark:hover:from-violet-800/40 dark:hover:to-indigo-800/40 transition-colors duration-200 border border-violet-200 dark:border-violet-700">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 group-hover:rotate-3 transition-all duration-300">👥</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Organization Management</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Invite students to your organization. Assignments are automatically shared with your class.
                  </p>
                </motion.div>

                <motion.div variants={cardItem} whileHover={{ scale: 1.04, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="group space-y-4 p-6 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 hover:from-violet-200 hover:to-indigo-200 dark:hover:from-violet-800/40 dark:hover:to-indigo-800/40 transition-colors duration-200 border border-violet-200 dark:border-violet-700">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-violet-200 dark:group-hover:bg-violet-800 group-hover:rotate-3 transition-all duration-300">✏️</div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100">Edit & Review</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-[1.5] text-xs sm:text-sm hidden sm:block">
                    Review AI-generated questions, edit content, and publish when ready. Full control over your assessments.
                  </p>
                </motion.div>
              </motion.div>
            </>
          )}
        </div>
      </motion.section>

      {/* All 4 Modules Section - Show for D2C */}
      {audience === 'd2c' && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16 bg-slate-100/50 dark:bg-slate-800/30"
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

            <motion.div variants={cardContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {/* Oral Expression */}
              <motion.div variants={cardItem} whileHover={{ scale: 1.03, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="space-y-4 p-6 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
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
              </motion.div>

              {/* Written Expression */}
              <motion.div variants={cardItem} whileHover={{ scale: 1.03, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="space-y-4 p-6 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-amber-200 dark:border-amber-800 shadow-sm">
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
              </motion.div>

              {/* Reading Comprehension */}
              <motion.div variants={cardItem} whileHover={{ scale: 1.03, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="space-y-4 p-6 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800 shadow-sm">
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
              </motion.div>

              {/* Listening Comprehension */}
              <motion.div variants={cardItem} whileHover={{ scale: 1.03, y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className="space-y-4 p-6 rounded-3xl bg-indigo-100 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-200 dark:border-cyan-800 shadow-sm">
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
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Showcases - Conditional based on audience */}
      {audience === 'd2c' ? (
        <>
          <ExamInterfaceShowcase />
          <ResultsDashboardShowcase />
        </>
      ) : (
        <>
          <BatchManagementShowcase />
          <AssignmentCreationShowcase />
        </>
      )}

      {/* Subscription Plans Section - Only show for D2C */}
      {audience === 'd2c' && (
        <div id="pricing">
          <SubscriptionPlans variant="landing" />
        </div>
      )}

      {/* Enterprise CTA Section - Show for B2B or as secondary for D2C */}
      <section id="enterprise-cta">
        <EnterpriseCTA />
      </section>

      {/* FAQ Section */}
      <FAQSection />

      <Footer variant="light" />
    </div>
  );
}
