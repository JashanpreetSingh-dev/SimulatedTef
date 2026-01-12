import React from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PricingSection } from './PricingSection';
import { FeatureComparison } from './FeatureComparison';
import { FAQSection } from './FAQSection';

export const PricingPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full">
        <PricingSection />
        <FeatureComparison />
        <FAQSection />
      </div>
    </DashboardLayout>
  );
};

