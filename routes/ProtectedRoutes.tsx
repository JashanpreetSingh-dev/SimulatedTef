import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { PracticeView } from '../pages/PracticeView';
import { HistoryView } from '../pages/HistoryView';
import { ResultView } from '../pages/ResultView';
import { ExamView } from '../pages/ExamView';
import { WrittenExamView } from '../pages/WrittenExamView';
import { SubscriptionManagementView } from '../pages/SubscriptionManagementView';
import { TermsOfService } from '../components/TermsOfService';
import { PrivacyPolicy } from '../components/PrivacyPolicy';
import { MockExamView } from '../components/MockExamView';
import { DashboardLayout } from '../layouts/DashboardLayout';

/**
 * Protected routes - only accessible when signed in
 * Trial will be auto-initialized when subscription status is first checked
 * This happens automatically in useSubscription hook when user loads dashboard
 */
export function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/practice" element={<PracticeView />} />
      <Route path="/history" element={<HistoryView />} />
      <Route path="/results/:id" element={<ResultView />} />
      <Route path="/exam/:mode" element={<ExamView />} />
      <Route path="/exam/written/:mode" element={<WrittenExamView />} />
      <Route path="/mock-exam/:mockExamId" element={
        <DashboardLayout>
          <MockExamView />
        </DashboardLayout>
      } />
      <Route path="/mock-exam" element={
        <DashboardLayout>
          <MockExamView />
        </DashboardLayout>
      } />
      <Route path="/dashboard/subscription" element={<SubscriptionManagementView />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
