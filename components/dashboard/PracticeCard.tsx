import React from 'react';
import { useNavigate } from 'react-router-dom';

export function PracticeCard() {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl md:rounded-3xl p-5 md:p-12 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer"
      onClick={() => navigate('/practice')}
    >
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div className="w-12 h-12 md:w-20 md:h-20 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-4xl group-hover:scale-110 transition-transform">🎯</div>
      </div>
      <h3 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">Practice</h3>
      <p className="text-indigo-100 text-xs md:text-base leading-relaxed mb-4 md:mb-6">
        Practice Expression Orale with Section A, Section B, and Complete Exams. View your practice history.
      </p>
      <div className="flex items-center text-white font-bold text-xs md:text-base">
        Start Practicing <span className="ml-2">→</span>
      </div>
    </div>
  );
}
