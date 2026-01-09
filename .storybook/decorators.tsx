import React, { createContext, useContext, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';

// ============================================
// Theme Provider Wrapper for Storybook
// ============================================
type Theme = 'light' | 'dark';

interface StorybookThemeProviderProps {
  children: ReactNode;
  theme: Theme;
}

// This wrapper uses the real ThemeProvider but syncs with Storybook's toolbar
export const StorybookThemeProvider: React.FC<StorybookThemeProviderProps> = ({ children, theme }) => {
  // Set localStorage before ThemeProvider mounts
  React.useMemo(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Use key to force re-mount ThemeProvider when theme changes
  // This ensures it re-reads from localStorage with the new value
  return (
    <ThemeProvider key={theme}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
};

// ============================================
// Mock User for Auth Context
// ============================================
export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
}

export const mockUser: MockUser = {
  id: 'user_mock_123',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  imageUrl: 'https://ui-avatars.com/api/?name=Test+User&background=6366f1&color=fff',
};

// ============================================
// Clerk Mock Context
// ============================================
interface ClerkMockContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: MockUser | null;
  signOut: () => void;
}

const ClerkMockContext = createContext<ClerkMockContextType>({
  isLoaded: true,
  isSignedIn: true,
  user: mockUser,
  signOut: () => console.log('Sign out (mock)'),
});

export const useClerkMock = () => useContext(ClerkMockContext);

interface ClerkMockProviderProps {
  children: ReactNode;
  isSignedIn?: boolean;
}

export const ClerkMockProvider: React.FC<ClerkMockProviderProps> = ({ 
  children, 
  isSignedIn = true 
}) => {
  return (
    <ClerkMockContext.Provider 
      value={{
        isLoaded: true,
        isSignedIn,
        user: isSignedIn ? mockUser : null,
        signOut: () => console.log('Sign out (mock)'),
      }}
    >
      {children}
    </ClerkMockContext.Provider>
  );
};

// ============================================
// Combined Decorator for Storybook
// ============================================
interface StoryDecoratorProps {
  children: ReactNode;
  theme?: Theme;
  isSignedIn?: boolean;
  initialRoute?: string;
}

export const StoryDecorator: React.FC<StoryDecoratorProps> = ({
  children,
  theme = 'light',
  isSignedIn = true,
  initialRoute = '/',
}) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <StorybookThemeProvider theme={theme}>
        <ClerkMockProvider isSignedIn={isSignedIn}>
          {children}
        </ClerkMockProvider>
      </StorybookThemeProvider>
    </MemoryRouter>
  );
};
