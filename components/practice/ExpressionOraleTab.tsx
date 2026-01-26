import React from 'react';
import { ExamCard } from './ExamCard';

interface ExpressionOraleTabProps {
  onStartExam: (mode: 'partA' | 'partB' | 'full') => void;
}

export function ExpressionOraleTab({ onStartExam }: ExpressionOraleTabProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile: Stacked cards */}
      <div className="md:hidden space-y-4">
        <ExamCard mode="partA" onStart={onStartExam} variant="mobile" />
        <ExamCard mode="partB" onStart={onStartExam} variant="mobile" />
      </div>

      {/* Desktop: 2-column grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        <ExamCard mode="partA" onStart={onStartExam} variant="desktop" />
        <ExamCard mode="partB" onStart={onStartExam} variant="desktop" />
      </div>
    </div>
  );
}
