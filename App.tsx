import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { ClerkProviderWithTheme } from './providers/ClerkProviderWithTheme';
import { LandingPage } from './pages/LandingPage';
import { ProtectedRoutes } from './routes/ProtectedRoutes';
import { TermsOfService } from './components/TermsOfService';
import { PrivacyPolicy } from './components/PrivacyPolicy';

function App() {
  return (
    <ClerkProviderWithTheme>
      <BrowserRouter>
        <SignedOut>
          <Routes>
            <Route path="/" element={<LandingPage />} />
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
  );
}

export default App;
