import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkProviderWithTheme } from './providers/ClerkProviderWithTheme';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { BlogPage } from './pages/BlogPage';
import { ArticleOralPreparation } from './pages/blog/ArticleOralPreparation';
import { ArticleExpressEntry } from './pages/blog/ArticleExpressEntry';
import { ArticleVsTCF } from './pages/blog/ArticleVsTCF';
import { ProtectedRoutes } from './routes/ProtectedRoutes';
import { TermsOfService } from './components/TermsOfService';
import { PrivacyPolicy } from './components/PrivacyPolicy';

function App() {
  return (
    <HelmetProvider>
    <LanguageProvider>
      <ThemeProvider>
        <ClerkProviderWithTheme>
          <BrowserRouter>
            <SignedOut>
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
            </SignedOut>
            <SignedIn>
              <ProtectedRoutes />
            </SignedIn>
          </BrowserRouter>
        </ClerkProviderWithTheme>
      </ThemeProvider>
    </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
