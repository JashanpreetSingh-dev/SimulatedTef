import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { getClerkAppearance } from '../utils/clerkTheme';

const PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

/**
 * Wrapper component to access theme context and sync Clerk appearance with app theme
 */
export function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  // Get theme from localStorage initially, then sync with DOM
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      return savedTheme || 'light';
    }
    return 'light';
  });

  // Listen to DOM class changes to sync with ThemeContext
  React.useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    // Initial check
    updateTheme();

    // Watch for class changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Also listen to storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        updateTheme();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={getClerkAppearance(theme)}
      signInUrl="/"
      signUpUrl="/"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}
