import React, { useState } from 'react';
import { useScrollAnimation } from '../utils/animations';

export const ResultsDashboardShowcase: React.FC = () => {
  const [ref, isVisible] = useScrollAnimation();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const getCECRColor = (level: string) => {
    if (level.includes('C2')) return 'bg-purple-600';
    if (level.includes('C1')) return 'bg-indigo-600';
    if (level.includes('B2')) return 'bg-blue-600';
    if (level.includes('B1')) return 'bg-emerald-600';
    if (level.includes('A2')) return 'bg-amber-600';
    return 'bg-rose-600';
  };

  const getSectionBadgeColor = (mode: string) => {
    if (mode === 'partA') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    if (mode === 'partB') return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
  };

  const getSectionLabel = (mode: string) => {
    if (mode === 'partA') return 'A';
    if (mode === 'partB') return 'B';
    return 'Complet';
  };

  // Sample result data
  const sampleResult = {
    mode: 'full',
    score: 542,
    clbLevel: 'CLB 7',
    cecrLevel: 'B2',
    strengths: [
      'Fluidité excellente dans la conversation',
      'Vocabulaire riche et varié',
      'Prononciation claire et naturelle',
    ],
    weaknesses: [
      'Quelques erreurs grammaticales mineures',
      'Peut enrichir les structures complexes',
      'Améliorer la précision lexicale',
    ],
    feedback: 'Votre performance démontre une bonne maîtrise du français avec une communication fluide et naturelle. Continuez à pratiquer pour atteindre un niveau encore plus élevé.',
    criteria: {
      'Remplissage de la tâche': { score: 8, comment: 'Excellent' },
      'Cohérence': { score: 7, comment: 'Très bon' },
      'Richesse lexicale': { score: 8, comment: 'Excellent' },
      'Maîtrise grammaticale': { score: 6, comment: 'Bon' },
      'Fluidité': { score: 8, comment: 'Excellent' },
      'Interaction': { score: 7, comment: 'Très bon' },
    },
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 xl:px-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em]">
            Track Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">Progress</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] mb-3">
            Get detailed feedback with CLB scores, CECR levels, and actionable insights to improve your French.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 inline-flex items-center gap-2 max-w-2xl mx-auto">
            <span className="text-amber-400 text-sm">ℹ️</span>
            <p className="text-amber-200 text-xs sm:text-sm font-medium">
              This is a sample results preview. Sign up to see your actual exam results and progress tracking.
            </p>
          </div>
        </div>

        {/* Compact Top Section: Section Badge, CLB, CECR - Matching DetailedResultView */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-6 shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            {/* Pills Section */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
              {/* Section Badge */}
              <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border font-black text-xs sm:text-sm uppercase tracking-wider ${getSectionBadgeColor(sampleResult.mode)}`}>
                Section {getSectionLabel(sampleResult.mode)}
              </div>

              {/* CLB Pill */}
              <div className="bg-indigo-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80">CLB</span>
                <span className="text-base sm:text-lg font-black">{sampleResult.clbLevel}</span>
                <span className="text-[8px] sm:text-[9px] font-bold opacity-70 hidden sm:inline">({sampleResult.score}/699)</span>
              </div>

              {/* CECR Pill */}
              <div className={`${getCECRColor(sampleResult.cecrLevel)} text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2`}>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80">CECR</span>
                <span className="text-base sm:text-lg font-black">{sampleResult.cecrLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Result Card - Matching DetailedResultView */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 shadow-sm">
          {/* Title Section */}
          <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Examen Complet</h3>
          </div>

          {/* Overall Comment */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl sm:rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 mb-2 sm:mb-3 tracking-widest">Évaluation Globale</h4>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {sampleResult.feedback}
            </p>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Strengths */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl sm:rounded-[2rem] p-3 sm:p-4 border border-emerald-100 dark:border-emerald-500/20">
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-2 sm:mb-3 tracking-widest flex items-center gap-2">
                <span>✅</span> Points Forts
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {sampleResult.strengths.map((strength, i) => (
                  <li key={i} className="text-slate-700 dark:text-slate-300 text-xs font-medium flex gap-2 leading-relaxed">
                    <span className="text-emerald-500">•</span> {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl sm:rounded-[2rem] p-3 sm:p-4 border border-rose-100 dark:border-rose-500/20">
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 mb-2 sm:mb-3 tracking-widest flex items-center gap-2">
                <span>⚠️</span> Axes de Progression
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {sampleResult.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-slate-700 dark:text-slate-300 text-xs font-medium flex gap-2 leading-relaxed">
                    <span className="text-rose-500">•</span> {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Criteria Breakdown */}
          <div>
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-3 sm:mb-4 tracking-widest">Détail des Critères</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {Object.entries(sampleResult.criteria).map(([key, value]) => (
                <div key={key} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{key}</span>
                    <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">{value.score}/10</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">{value.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
