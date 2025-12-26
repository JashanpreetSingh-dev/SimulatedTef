import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PricingSection } from './PricingSection';
import { FeatureComparison } from './FeatureComparison';
import { FAQSection } from './FAQSection';
import { Footer } from './Footer';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-indigo-100 flex flex-col">
      <div className="sticky top-0 z-50 bg-indigo-100/50/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors"
        >
          ← Back to Dashboard
        </button>
        <span className="font-black text-lg text-slate-800">Akseli</span>
      </div>

      <div className="flex-1">
        <PricingSection />
        <FeatureComparison />
        <FAQSection />
      </div>
      
      <Footer variant="light" />
    </div>
  );
};

