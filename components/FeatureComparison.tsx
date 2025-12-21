import React from 'react';

export const FeatureComparison: React.FC = () => {
  const features = [
    { name: 'Full Tests', trial: '1/day', monthly: '1/day', yearly: '1/day', pack: '5 total' },
    { name: 'Section A', trial: '1/day', monthly: '2/day', yearly: '2/day', pack: 'Not available' },
    { name: 'Section B', trial: '1/day', monthly: '2/day', yearly: '2/day', pack: 'Not available' },
    { name: 'AI Evaluation', trial: '✓', monthly: '✓', yearly: '✓', pack: '✓' },
    { name: 'CLB Scoring', trial: '✓', monthly: '✓', yearly: '✓', pack: '✓' },
    { name: 'Progress Tracking', trial: '✓', monthly: '✓', yearly: '✓', pack: '✓' },
    { name: 'Exam History', trial: '✓', monthly: 'Unlimited', yearly: 'Unlimited', pack: '✓' },
    { name: 'Support', trial: 'Standard', monthly: 'Priority', yearly: 'Priority', pack: 'Standard' },
  ];

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Compare <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">Plans</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4">
            See what's included in each plan to find the perfect fit for your preparation.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-800">
              <thead>
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-900/50">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-900/50">
                    Free Trial
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-900/50">
                    Pro Monthly
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-900/50">
                    Pro Yearly
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-900/50">
                    5-Pack
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {features.map((feature, index) => (
                  <tr key={index} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-white">
                      {feature.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-slate-300">
                      {feature.trial}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-slate-300">
                      {feature.monthly}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-slate-300">
                      {feature.yearly}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-slate-300">
                      {feature.pack}
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

