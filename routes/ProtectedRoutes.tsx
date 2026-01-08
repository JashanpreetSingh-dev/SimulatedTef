import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { PracticeView } from '../pages/PracticeView';
import { HistoryView } from '../pages/HistoryView';
import { ResultView } from '../pages/ResultView';
import { ExamView } from '../pages/ExamView';
import { WrittenExamView } from '../pages/WrittenExamView';
import { AssignmentsView } from '../pages/AssignmentsView';
import { AssignmentCreationView } from '../pages/AssignmentCreationView';
import { AssignmentExamView } from '../pages/AssignmentExamView';
import { BatchesView } from '../pages/BatchesView';
import { BatchDetailView } from '../pages/BatchDetailView';
import { StudentBatchView } from '../pages/StudentBatchView';
import { TermsOfService } from '../components/TermsOfService';
import { PrivacyPolicy } from '../components/PrivacyPolicy';
import { MockExamView } from '../components/MockExamView';
import { DashboardLayout } from '../layouts/DashboardLayout';

/**
 * Protected routes - only accessible when signed in
 */
export function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/practice" element={<PracticeView />} />
      <Route path="/history" element={<HistoryView />} />
      <Route path="/results/:id" element={<ResultView />} />
      <Route path="/exam/:mode" element={<ExamView />} />
      <Route path="/exam/reading" element={<AssignmentExamView />} />
      <Route path="/exam/listening" element={<AssignmentExamView />} />
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
      <Route path="/dashboard/assignments" element={<AssignmentsView />} />
      <Route path="/dashboard/assignments/create" element={<AssignmentCreationView />} />
      <Route path="/dashboard/assignments/create/:assignmentId" element={<AssignmentCreationView />} />
      <Route path="/dashboard/batches" element={<BatchesView />} />
      <Route path="/dashboard/batches/:batchId" element={<BatchDetailView />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
