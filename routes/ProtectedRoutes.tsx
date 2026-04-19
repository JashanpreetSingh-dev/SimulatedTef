import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { ErrorBoundary } from '../components/ErrorBoundary';

const PracticeView = lazy(() => import('../pages/PracticeView').then((m) => ({ default: m.PracticeView })));
const HistoryView = lazy(() => import('../pages/HistoryView').then((m) => ({ default: m.HistoryView })));
const ResultView = lazy(() => import('../pages/ResultView').then((m) => ({ default: m.ResultView })));
const ExamView = lazy(() => import('../pages/ExamView').then((m) => ({ default: m.ExamView })));
const WrittenExamView = lazy(() => import('../pages/WrittenExamView').then((m) => ({ default: m.WrittenExamView })));
const GuidedWrittenExamView = lazy(() =>
  import('../pages/GuidedWrittenExamView').then((m) => ({ default: m.GuidedWrittenExamView }))
);
const AssignmentsView = lazy(() => import('../pages/AssignmentsView').then((m) => ({ default: m.AssignmentsView })));
const AssignmentCreationView = lazy(() =>
  import('../pages/AssignmentCreationView').then((m) => ({ default: m.AssignmentCreationView }))
);
const AssignmentExamView = lazy(() =>
  import('../pages/AssignmentExamView').then((m) => ({ default: m.AssignmentExamView }))
);
const BatchesView = lazy(() => import('../pages/BatchesView').then((m) => ({ default: m.BatchesView })));
const BatchDetailView = lazy(() => import('../pages/BatchDetailView').then((m) => ({ default: m.BatchDetailView })));
const TermsOfService = lazy(() => import('../components/TermsOfService').then((m) => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import('../components/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const BlogPage = lazy(() => import('../pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const ArticleOralPreparation = lazy(() =>
  import('../pages/blog/ArticleOralPreparation').then((m) => ({ default: m.ArticleOralPreparation }))
);
const ArticleExpressEntry = lazy(() =>
  import('../pages/blog/ArticleExpressEntry').then((m) => ({ default: m.ArticleExpressEntry }))
);
const ArticleVsTCF = lazy(() => import('../pages/blog/ArticleVsTCF').then((m) => ({ default: m.ArticleVsTCF })));
const MockExamRoute = lazy(() => import('./MockExamRoute'));
const AdminUsageView = lazy(() => import('../pages/AdminUsageView').then((m) => ({ default: m.AdminUsageView })));
const AdminVoteAnalyticsView = lazy(() =>
  import('../pages/AdminVoteAnalyticsView').then((m) => ({ default: m.AdminVoteAnalyticsView }))
);
const AdminOrgConfigView = lazy(() =>
  import('../pages/AdminOrgConfigView').then((m) => ({ default: m.AdminOrgConfigView }))
);
const AdminD2CConfigView = lazy(() =>
  import('../pages/AdminD2CConfigView').then((m) => ({ default: m.AdminD2CConfigView }))
);
const SubscriptionView = lazy(() => import('../pages/SubscriptionView').then((m) => ({ default: m.SubscriptionView })));
const DailyRitualView = lazy(() => import('../pages/DailyRitualView').then((m) => ({ default: m.DailyRitualView })));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8 text-slate-600 dark:text-slate-400">
      Loading…
    </div>
  );
}

/**
 * Protected routes - only accessible when signed in
 */
export function ProtectedRoutes() {
  return (
    <ErrorBoundary context="Signed-in area">
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<PracticeView />} />
          <Route path="/practice/daily-ritual" element={<DailyRitualView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/results/:id" element={<ResultView />} />
          <Route
            path="/exam/:mode"
            element={
              <ErrorBoundary context="Exam session">
                <ExamView />
              </ErrorBoundary>
            }
          />
          <Route
            path="/exam/reading"
            element={
              <ErrorBoundary context="Exam session">
                <AssignmentExamView />
              </ErrorBoundary>
            }
          />
          <Route
            path="/exam/listening"
            element={
              <ErrorBoundary context="Exam session">
                <AssignmentExamView />
              </ErrorBoundary>
            }
          />
          <Route
            path="/exam/written/:mode"
            element={
              <ErrorBoundary context="Exam session">
                <WrittenExamView />
              </ErrorBoundary>
            }
          />
          <Route
            path="/practice/guided-written/:mode"
            element={
              <ErrorBoundary context="Exam session">
                <GuidedWrittenExamView />
              </ErrorBoundary>
            }
          />
          <Route
            path="/mock-exam/:mockExamId"
            element={
              <ErrorBoundary context="Mock exam">
                <MockExamRoute />
              </ErrorBoundary>
            }
          />
          <Route
            path="/mock-exam"
            element={
              <ErrorBoundary context="Mock exam">
                <MockExamRoute />
              </ErrorBoundary>
            }
          />
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
      </Suspense>
    </ErrorBoundary>
  );
}
