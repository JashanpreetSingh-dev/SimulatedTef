import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { PracticeView } from '../pages/PracticeView';
import { HistoryView } from '../pages/HistoryView';
import { ResultView } from '../pages/ResultView';
import { ExamView } from '../pages/ExamView';
import { WrittenExamView } from '../pages/WrittenExamView';
import { GuidedWrittenExamView } from '../pages/GuidedWrittenExamView';
import { AssignmentsView } from '../pages/AssignmentsView';
import { AssignmentCreationView } from '../pages/AssignmentCreationView';
import { AssignmentExamView } from '../pages/AssignmentExamView';
import { BatchesView } from '../pages/BatchesView';
import { BatchDetailView } from '../pages/BatchDetailView';
import { TermsOfService } from '../components/TermsOfService';
import { PrivacyPolicy } from '../components/PrivacyPolicy';
import { BlogPage } from '../pages/BlogPage';
import { ArticleOralPreparation } from '../pages/blog/ArticleOralPreparation';
import { ArticleExpressEntry } from '../pages/blog/ArticleExpressEntry';
import { ArticleVsTCF } from '../pages/blog/ArticleVsTCF';
import { MockExamView } from '../components/MockExamView';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminUsageView } from '../pages/AdminUsageView';
import { AdminVoteAnalyticsView } from '../pages/AdminVoteAnalyticsView';
import { AdminOrgConfigView } from '../pages/AdminOrgConfigView';
import { AdminD2CConfigView } from '../pages/AdminD2CConfigView';
import { SubscriptionView } from '../pages/SubscriptionView';
import { DailyRitualView } from '../pages/DailyRitualView';

/**
 * Protected routes - only accessible when signed in
 */
export function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/practice" element={<PracticeView />} />
      <Route path="/practice/daily-ritual" element={<DailyRitualView />} />
      <Route path="/history" element={<HistoryView />} />
      <Route path="/results/:id" element={<ResultView />} />
      <Route path="/exam/:mode" element={<ExamView />} />
      <Route path="/exam/reading" element={<AssignmentExamView />} />
      <Route path="/exam/listening" element={<AssignmentExamView />} />
      <Route path="/exam/written/:mode" element={<WrittenExamView />} />
      <Route path="/practice/guided-written/:mode" element={<GuidedWrittenExamView />} />
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
      <Route path="/admin/usage" element={<AdminUsageView />} />
      <Route path="/admin/vote-analytics" element={<AdminVoteAnalyticsView />} />
      <Route path="/admin/org-config" element={<AdminOrgConfigView />} />
      <Route path="/admin/d2c-config" element={<AdminD2CConfigView />} />
      <Route path="/subscription" element={<SubscriptionView />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/how-to-prepare-tef-canada-oral" element={<ArticleOralPreparation />} />
      <Route path="/blog/tef-canada-clb-score-express-entry" element={<ArticleExpressEntry />} />
      <Route path="/blog/tef-canada-vs-tcf-canada" element={<ArticleVsTCF />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
