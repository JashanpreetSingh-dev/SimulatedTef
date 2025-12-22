import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PricingSection } from './PricingSection';
import { FeatureComparison } from './FeatureComparison';
import { FAQSection } from './FAQSection';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors"
        >
          ← Back to Dashboard
        </button>
        <span className="font-black text-lg text-white">Akseli</span>
      </div>

      <PricingSection />
      <FeatureComparison />
      <FAQSection />
    </div>
  );
};

