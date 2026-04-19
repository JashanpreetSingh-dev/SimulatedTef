import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkProviderWithTheme } from './providers/ClerkProviderWithTheme';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoutes } from './routes/ProtectedRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const ArticleOralPreparation = lazy(() =>
  import('./pages/blog/ArticleOralPreparation').then((m) => ({ default: m.ArticleOralPreparation }))
);
const ArticleExpressEntry = lazy(() =>
  import('./pages/blog/ArticleExpressEntry').then((m) => ({ default: m.ArticleExpressEntry }))
);
const ArticleVsTCF = lazy(() => import('./pages/blog/ArticleVsTCF').then((m) => ({ default: m.ArticleVsTCF })));
const TermsOfService = lazy(() => import('./components/TermsOfService').then((m) => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));

function PublicRouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-indigo-100 p-8 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
      Loading…
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary context="Application">
        <LanguageProvider>
          <ThemeProvider>
            <ClerkProviderWithTheme>
              <BrowserRouter>
                <SignedOut>
                  <Suspense fallback={<PublicRouteFallback />}>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/how-to-prepare-tef-canada-oral" element={<ArticleOralPreparation />} />
                      <Route path="/blog/tef-canada-clb-score-express-entry" element={<ArticleExpressEntry />} />
                      <Route path="/blog/tef-canada-vs-tcf-canada" element={<ArticleVsTCF />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </SignedOut>
                <SignedIn>
                  <ProtectedRoutes />
                </SignedIn>
              </BrowserRouter>
            </ClerkProviderWithTheme>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
