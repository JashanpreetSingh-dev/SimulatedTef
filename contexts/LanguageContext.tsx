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
    'dashboard.sectionA': 'Section A',
    'dashboard.sectionB': 'Section B',
    'dashboard.oralExpressionComplete': 'Expression Orale - Complet',
    'dashboard.mockExam': 'Mock Exam',
    'dashboard.sectionADescription': 'Posez des questions pour obtenir des informations. (4 min)',
    'dashboard.sectionBDescription': 'Argumentez pour convaincre un ami. (8 min)',
    'dashboard.oralExpressionDescription': 'Enchaînez les deux sections pour une simulation réelle. (12 min)',
    'dashboard.mockExamDescription': 'Examen complet en 3 modules : Expression Orale, Compréhension Écrite et Compréhension Orale',
    
    // Back buttons
    'back.dashboard': 'Retour au tableau de bord',
    'back.history': 'Retour à l\'historique',
    'back.toList': 'Retour à la liste',
    
    // Landing page
    'landing.startFree': 'Commencer gratuitement',
    'landing.signIn': 'Se connecter',
    'landing.buildBetter': 'Améliorez votre français, plus rapidement',
    'landing.description': 'Le simulateur d\'examen de confiance pour les candidats préparant l\'immigration canadienne. Pratiquez avec des scénarios réels et évaluez-vous avec une IA formée sur le cadre officiel de la CCI Paris.',
    
    // Common
    'common.available': 'Disponible',
    'common.daily': 'Quotidien',
    'common.pack': 'Pack',
    'common.duration': 'Durée',
    'common.score': 'Score',
    'common.clbLevel': 'Niveau CLB',
    'common.commencer': 'Commencer',
    'common.start': 'Commencer',
    'common.startMockExam': 'Commencer l\'examen blanc',
    
    // Actions
    'actions.start': 'Commencer',
    'actions.resume': 'Reprendre',
    'actions.retake': 'Refaire',
    'actions.viewResults': 'Voir les résultats',
    'actions.seeResults': 'Voir les résultats',
    'actions.details': 'Détails',
    
    // Status
    'status.completed': 'Terminé',
    'status.incomplete': 'Incomplet',
    'status.new': 'Nouveau',
    'status.evaluating': 'Évaluation en cours...',
    'status.loading': 'Chargement...',
    'status.checking': 'Vérification...',
    
    // Mock Exam
    'mockExam.title': 'Examen Blanc',
    'mockExam.titlePlural': 'Examen Blancs',
    'mockExam.modules': 'Modules d\'examen blanc',
    'mockExam.mockTests': 'Examen Blancs',
    'mockExam.completed': 'Terminés',
    'mockExam.completedTitle': 'Examen Blanc Terminé',
    'mockExam.loading': 'Chargement des examens blancs...',
    'mockExam.checkingStatus': 'Vérification du statut...',
    'mockExam.allCompleted': 'Tous les examens blancs disponibles ont été terminés. Consultez l\'onglet Terminés pour voir vos résultats.',
    'mockExam.noCompleted': 'Aucun examen blanc terminé pour le moment. Terminez votre premier examen blanc pour le voir ici !',
    'mockExam.allModulesCompleted': 'Tous les modules sont terminés ! Vous pouvez consulter vos résultats ou terminer l\'examen blanc.',
    'mockExam.moduleCompleted': 'module terminé avec succès !',
    
    // Modules
    'modules.oralExpression': 'Expression Orale',
    'modules.reading': 'Compréhension Écrite',
    'modules.listening': 'Compréhension Orale',
    'modules.oralExpressionDescription': 'Examen complet avec Section A (EO1) et Section B (EO2), conversation IA en temps réel',
    'modules.readingDescription': '60 minutes, 40 questions à choix multiples (format question par question)',
    'modules.listeningDescription': 'Questions avec lecture automatique et lecture audio, 40 questions à choix multiples',
    'modules.oralExpressionDuration': '~30 minutes',
    'modules.readingDuration': '60 minutes',
    'modules.listeningDuration': '~40 minutes',
    
    // History
    'history.tabA': 'A',
    'history.tabB': 'B',
    'history.tabComplete': 'Complet',
    'history.syncing': 'Synchronisation cloud...',
    'history.empty': 'Aucun historique',
    'history.emptyDescription': 'Passez votre premier examen blanc pour commencer à suivre vos progrès !',
    'history.noResults': 'Aucun résultat pour ce filtre.',
    
    // Results
    'results.sectionA': 'A',
    'results.sectionB': 'B',
    'results.complete': 'Complet',
    'results.viewDetails': 'Voir les détails',
    
    // Errors
    'errors.loadFailed': 'Échec du chargement. Veuillez réessayer.',
    'errors.startFailed': 'Échec du démarrage de l\'examen blanc. Veuillez réessayer.',
    'errors.creditsNeeded': 'Vous avez besoin de crédits pour commencer un examen blanc. Veuillez acheter un pack.',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.history': 'History',
    'nav.signOut': 'Sign Out',
    
    // Dashboard
    'dashboard.greeting': 'Hello',
    'dashboard.subtitle': 'Ready to practice your oral expression today?',
    'dashboard.sectionA': 'Section A',
    'dashboard.sectionB': 'Section B',
    'dashboard.oralExpressionComplete': 'Oral Expression - Complete',
    'dashboard.mockExam': 'Mock Exam',
    'dashboard.sectionADescription': 'Ask questions to get information. (4 min)',
    'dashboard.sectionBDescription': 'Argue to convince a friend. (8 min)',
    'dashboard.oralExpressionDescription': 'Chain both sections for a real simulation. (12 min)',
    'dashboard.mockExamDescription': 'Complete 3-module exam: Oral Expression, Reading, and Listening',
    
    // Back buttons
    'back.dashboard': 'Back to Dashboard',
    'back.history': 'Back to History',
    'back.toList': 'Back to list',
    
    // Landing page
    'landing.startFree': 'Start for free',
    'landing.signIn': 'Sign in',
    'landing.buildBetter': 'Build better French, faster',
    'landing.description': 'The exam simulator trusted by candidates preparing for Canadian immigration. Practice with real scenarios and get evaluated by AI trained on the official CCI Paris framework.',
    
    // Common
    'common.available': 'Available',
    'common.daily': 'Daily',
    'common.pack': 'Pack',
    'common.duration': 'Duration',
    'common.score': 'Score',
    'common.clbLevel': 'CLB Level',
    'common.commencer': 'Start',
    'common.start': 'Start',
    'common.startMockExam': 'Start Mock Exam',
    
    // Actions
    'actions.start': 'Start',
    'actions.resume': 'Resume',
    'actions.retake': 'Retake',
    'actions.viewResults': 'View Results',
    'actions.seeResults': 'See Results',
    'actions.details': 'Details',
    
    // Status
    'status.completed': 'Completed',
    'status.incomplete': 'Incomplete',
    'status.new': 'New',
    'status.evaluating': 'Evaluating...',
    'status.loading': 'Loading...',
    'status.checking': 'Checking...',
    
    // Mock Exam
    'mockExam.title': 'Mock Exam',
    'mockExam.titlePlural': 'Mock Exams',
    'mockExam.modules': 'Mock Exam Modules',
    'mockExam.mockTests': 'Mock Tests',
    'mockExam.completed': 'Completed',
    'mockExam.completedTitle': 'Mock Exam Completed',
    'mockExam.loading': 'Loading mock exams...',
    'mockExam.checkingStatus': 'Checking exam status...',
    'mockExam.allCompleted': 'All available mock exams have been completed. Check the Completed tab to view your results.',
    'mockExam.noCompleted': 'No completed mock exams yet. Complete your first mock exam to see it here!',
    'mockExam.allModulesCompleted': 'All modules completed! You can review your results or finish the mock exam.',
    'mockExam.moduleCompleted': 'module completed successfully!',
    
    // Modules
    'modules.oralExpression': 'Oral Expression',
    'modules.reading': 'Reading Comprehension',
    'modules.listening': 'Listening Comprehension',
    'modules.oralExpressionDescription': 'Full exam with Section A (EO1) and Section B (EO2), real-time AI conversation',
    'modules.readingDescription': '60 minutes, 40 multiple-choice questions (question-by-question format)',
    'modules.listeningDescription': 'Auto-advancing questions with audio playback, 40 multiple-choice questions',
    'modules.oralExpressionDuration': '~30 minutes',
    'modules.readingDuration': '60 minutes',
    'modules.listeningDuration': '~40 minutes',
    
    // History
    'history.tabA': 'A',
    'history.tabB': 'B',
    'history.tabComplete': 'Complete',
    'history.syncing': 'Syncing to cloud...',
    'history.empty': 'No history',
    'history.emptyDescription': 'Take your first mock exam to start tracking your progress!',
    'history.noResults': 'No results for this filter.',
    
    // Results
    'results.sectionA': 'A',
    'results.sectionB': 'B',
    'results.complete': 'Complete',
    'results.viewDetails': 'View Details',
    
    // Errors
    'errors.loadFailed': 'Failed to load. Please try again.',
    'errors.startFailed': 'Failed to start mock exam. Please try again.',
    'errors.creditsNeeded': 'You need credits to start a mock exam. Please purchase a pack.',
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

