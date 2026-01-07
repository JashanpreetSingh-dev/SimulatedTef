import React from 'react';

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16 bg-indigo-100 dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Partner with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Akseli</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4">
            Bring AI-powered TEF Canada preparation to your language academy. Simple per-student pricing with no setup fees.
          </p>
        </div>

        {/* B2B Pricing Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-bold mb-6">
              🏫 For Language Academies
            </div>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl md:text-6xl font-black text-slate-800 dark:text-slate-100">$25</span>
              <span className="text-xl text-slate-500 dark:text-slate-400">/student/month</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Flexible billing • No minimum commitment • Cancel anytime
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Platform Features</h3>
              <ul className="space-y-3">
                {[
                  'AI-powered speaking evaluation',
                  'Real-time CLB scoring',
                  'Detailed feedback in French & English',
                  'All 4 TEF modules supported',
                  'Custom assignments & assessments',
                  'Student progress tracking',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Academy Support</h3>
              <ul className="space-y-3">
                {[
                  'Dedicated onboarding',
                  'Teacher training sessions',
                  'Priority email support',
                  'Custom branding options',
                  'Bulk student management',
                  'Usage analytics dashboard',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
            <a
              href="mailto:contact@akseli.app?subject=Academy%20Partnership%20Inquiry"
              className="block w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-center transition-all shadow-lg hover:shadow-xl"
            >
              Contact Sales →
            </a>
            <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-4">
              Get a personalized demo and volume pricing for your academy
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Trusted by language academies across Canada</p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="text-slate-400 dark:text-slate-500 text-sm">
              <span className="font-bold text-slate-600 dark:text-slate-300">500+</span> Students
            </div>
            <div className="text-slate-400 dark:text-slate-500 text-sm">
              <span className="font-bold text-slate-600 dark:text-slate-300">10+</span> Academies
            </div>
            <div className="text-slate-400 dark:text-slate-500 text-sm">
              <span className="font-bold text-slate-600 dark:text-slate-300">95%</span> Satisfaction
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
