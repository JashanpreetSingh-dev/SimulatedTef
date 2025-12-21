import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.history': 'Historique',
    'nav.signOut': 'Déconnexion',
    
    // Dashboard
    'dashboard.greeting': 'Bonjour',
    'dashboard.subtitle': 'Prêt à pratiquer votre expression orale aujourd\'hui ?',
    
    // Back buttons
    'back.dashboard': 'Retour au tableau de bord',
    'back.history': 'Retour à l\'historique',
    
    // Landing page
    'landing.startFree': 'Commencer gratuitement',
    'landing.signIn': 'Se connecter',
    'landing.buildBetter': 'Améliorez votre français, plus rapidement',
    'landing.description': 'Le simulateur d\'examen de confiance pour les candidats préparant l\'immigration canadienne. Pratiquez avec des scénarios réels et évaluez-vous avec une IA formée sur le cadre officiel de la CCI Paris.',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.history': 'History',
    'nav.signOut': 'Sign Out',
    
    // Dashboard
    'dashboard.greeting': 'Hello',
    'dashboard.subtitle': 'Ready to practice your oral expression today?',
    
    // Back buttons
    'back.dashboard': 'Back to Dashboard',
    'back.history': 'Back to History',
    
    // Landing page
    'landing.startFree': 'Start for free',
    'landing.signIn': 'Sign in',
    'landing.buildBetter': 'Build better French, faster',
    'landing.description': 'The exam simulator trusted by candidates preparing for Canadian immigration. Practice with real scenarios and get evaluated by AI trained on the official CCI Paris framework.',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get from localStorage or default to French
    const saved = localStorage.getItem('language') as Language;
    return saved && (saved === 'fr' || saved === 'en') ? saved : 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

