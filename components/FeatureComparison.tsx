import React from 'react';

export const FeatureComparison: React.FC = () => {
  const features = [
    { name: 'Full Tests', trial: '1 per day', starter: '5 total', examReady: '15 total' },
    { name: 'Section A', trial: '1 per day', starter: '3 total', examReady: '10 total' },
    { name: 'Section B', trial: '1 per day', starter: '3 total', examReady: '10 total' },
    { name: 'Validity', trial: '3 days', starter: '30 days', examReady: '30 days' },
  ];

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16 bg-indigo-100 dark:bg-slate-800/30 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Compare <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Plans</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4">
            All plans include AI evaluation, CLB scoring, and progress tracking. Compare test counts to find the perfect fit.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 bg-indigo-100/50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
              <thead>
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-indigo-100/50 dark:bg-slate-800/50">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-indigo-100/50 dark:bg-slate-800/50">
                    Free Trial
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-indigo-100/50 dark:bg-slate-800/50">
                    Starter Pack
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-indigo-100/50 dark:bg-slate-800/50">
                    Exam Ready Pack
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {features.map((feature, index) => (
                  <tr key={index} className="hover:bg-indigo-100/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {feature.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-slate-300">
                      {feature.trial}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-slate-300">
                      {feature.starter}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-slate-300">
                      {feature.examReady}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

