import React from 'react';
import { useScrollAnimation } from '../utils/animations';

export const ResultsDashboardShowcase: React.FC = () => {
  const [ref, isVisible] = useScrollAnimation();

  // Color functions matching actual components
  const getCECRColor = (level: string) => {
    const cecr = level.toUpperCase();
    if (cecr.includes('C2')) return 'bg-purple-400';
    if (cecr.includes('C1')) return 'bg-indigo-400';
    if (cecr.includes('B2')) return 'bg-blue-400';
    if (cecr.includes('B1')) return 'bg-emerald-400';
    if (cecr.includes('A2')) return 'bg-amber-600';
    return 'bg-rose-600';
  };

  // Sample written text with "errors" to highlight
  const sampleWrittenText = {
    original: `Madame, Monsieur,

Je vous écris pour exprimer mon intérêt pour le poste de responsable marketing. J'ai travaillé pendant cinq années dans le domaine du marketing digital et je pense que mes compétences correspondent aux exigences du poste.

Dans mon travail actuel, je suis responsable de développer des stratégies et de augmenter la visibilité en ligne. J'ai réussi à améliorer le trafic de 40%.`,
    corrections: [
      { weak: "J'ai travaillé pendant cinq années", better: "J'ai travaillé pendant cinq ans", why: "On utilise 'ans' et non 'années' avec un nombre précis" },
      { weak: "de développer des stratégies et de augmenter", better: "de développer des stratégies et d'augmenter", why: "Élision obligatoire devant une voyelle" },
    ]
  };

  // Function to highlight errors in text
  const highlightErrors = (text: string, corrections: typeof sampleWrittenText.corrections) => {
    let result = text;
    corrections.forEach((correction, index) => {
      result = result.replace(
        correction.weak,
        `<span class="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-b-2 border-rose-400 dark:border-rose-500 cursor-help" title="${correction.better}">${correction.weak}</span>`
      );
    });
    return result;
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 xl:px-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-700 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em]">
            Detailed AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Feedback</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-[1.6]">
            Get CLB scores, CECR levels, and actionable insights. Written expression includes error highlighting and corrections.
          </p>
        </div>

        {/* Two Column Grid: Oral Results + Written Results */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* Oral Expression Results Card */}
          <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-emerald-500 dark:bg-emerald-600 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎙️</span>
                <span className="text-white font-black text-sm md:text-base">Expression Orale - Résultats</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
                  CLB 7
                </div>
                <div className={`${getCECRColor('B2')} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                  B2
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 space-y-4">
              {/* Audio Player */}
              <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">🎙️</span>
                  <button className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className="w-2/5 h-full bg-emerald-400 dark:bg-emerald-500 rounded-full" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">1:42 / 4:12</span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <h4 className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-3 tracking-widest">
                  Score: 542/699
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Excellente fluidité et vocabulaire riche. Continuez à pratiquer les structures grammaticales complexes.
                </p>
              </div>

              {/* Mini Criteria */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Fluidité</span>
                    <span className="text-sm font-black text-emerald-500 dark:text-emerald-400">8/10</span>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Grammaire</span>
                    <span className="text-sm font-black text-emerald-500 dark:text-emerald-400">6/10</span>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Vocabulaire</span>
                    <span className="text-sm font-black text-emerald-500 dark:text-emerald-400">8/10</span>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Cohérence</span>
                    <span className="text-sm font-black text-emerald-500 dark:text-emerald-400">7/10</span>
                  </div>
                </div>
              </div>

              {/* Strengths Preview */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <h5 className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-2 tracking-wider flex items-center gap-1">
                  <span>✓</span> Points Forts
                </h5>
                <ul className="space-y-1">
                  <li className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-500">•</span> Fluidité excellente
                  </li>
                  <li className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-500">•</span> Vocabulaire varié
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Written Expression Results Card */}
          <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-amber-500 dark:bg-amber-600 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✍️</span>
                <span className="text-white font-black text-sm md:text-base">Expression Écrite - Résultats</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
                  CLB 8
                </div>
                <div className={`${getCECRColor('B2')} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                  B2
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 space-y-4">
              {/* Your Writing with Highlighted Errors - matching WrittenExpressionSection */}
              <div>
                <h5 className="text-[9px] font-black uppercase text-indigo-400 dark:text-indigo-300 mb-2 tracking-widest">
                  Votre Texte (erreurs surlignées)
                </h5>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-300 dark:border-slate-600 max-h-[140px] overflow-y-auto">
                  <p 
                    className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightErrors(sampleWrittenText.original, sampleWrittenText.corrections) }}
                  />
                </div>
              </div>

              {/* Corrections - matching WrittenExpressionSection */}
              <div>
                <h5 className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 mb-2 tracking-widest">
                  Corrections
                </h5>
                <div className="space-y-2">
                  {sampleWrittenText.corrections.map((correction, i) => (
                    <div key={i} className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <div className="text-[8px] font-black uppercase text-rose-600 dark:text-rose-400 mb-1 tracking-wider">
                            Original
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 italic line-through">
                            "{correction.weak}"
                          </p>
                        </div>
                        <div>
                          <div className="text-[8px] font-black uppercase text-emerald-500 dark:text-emerald-400 mb-1 tracking-wider">
                            Corrigé
                          </div>
                          <p className="text-[10px] text-slate-800 dark:text-slate-100 font-medium">
                            "{correction.better}"
                          </p>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 pt-2 border-t border-amber-200 dark:border-amber-700">
                        💡 {correction.why}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Answer Preview */}
              <div>
                <h5 className="text-[9px] font-black uppercase text-emerald-500 dark:text-emerald-400 mb-2 tracking-widest">
                  Réponse Modèle
                </h5>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-3">
                    Madame, Monsieur, Je me permets de vous adresser ma candidature pour le poste de responsable marketing. Fort d'une expérience de cinq ans dans le marketing digital...
                  </p>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                    ↓ Voir le modèle complet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom notice */}
        <div className="mt-8 text-center">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 inline-flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-sm">ℹ️</span>
            <p className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-medium">
              This is a sample preview. Sign up to access full AI evaluation with detailed feedback.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
