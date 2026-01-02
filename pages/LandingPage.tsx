import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useScrollAnimation } from '../utils/animations';
import { PricingSection } from '../components/PricingSection';
import { FeatureComparison } from '../components/FeatureComparison';
import { FAQSection } from '../components/FAQSection';
import { ExamInterfaceShowcase } from '../components/ExamInterfaceShowcase';
import { ResultsDashboardShowcase } from '../components/ResultsDashboardShowcase';
import { Footer } from '../components/Footer';

export function LandingPage() {
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
