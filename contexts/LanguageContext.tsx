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
    'dashboard.mockExamDescription': 'Examen complet en 4 modules : Expression Orale, Compréhension Écrite, Compréhension Orale et Expression Écrite',
    
    // Back buttons
    'back.dashboard': 'Retour au tableau de bord',
    'back.history': 'Retour à l\'historique',
    'back.toList': 'Retour à la liste',
    'back.practice': 'Retour à la pratique',
    'back.back': 'Retour',
    
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
    'common.startPracticing': 'Commencer à pratiquer',
    'common.practice': 'Pratique',
    'common.history': 'Historique',
    
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
    'status.loadingExam': 'Chargement de l\'examen...',
    'status.checkingSubscription': 'Vérification de l\'abonnement...',
    
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
    'modules.writtenExpression': 'Expression Écrite',
    'modules.reading': 'Compréhension Écrite',
    'modules.listening': 'Compréhension Orale',
    'modules.oralExpressionDescription': 'Examen complet avec Section A (EO1) et Section B (EO2), conversation IA en temps réel',
    'modules.writtenExpressionDescription': 'Pratiquez l\'expression écrite avec Section A, Section B et Examens Complets.',
    'modules.readingDescription': '60 minutes, 40 questions à choix multiples (format question par question)',
    'modules.listeningDescription': 'Questions avec lecture automatique et lecture audio, 40 questions à choix multiples',
    'modules.oralExpressionDuration': '~30 minutes',
    'modules.readingDuration': '60 minutes',
    'modules.listeningDuration': '~40 minutes',
    
    // History
    'history.title': 'Historique',
    'history.subtitle': 'Consultez vos résultats de pratique précédents',
    'history.tabA': 'A',
    'history.tabB': 'B',
    'history.tabComplete': 'Complet',
    'history.syncing': 'Synchronisation cloud...',
    'history.empty': 'Aucun historique',
    'history.emptyDescription': 'Passez votre premier examen blanc pour commencer à suivre vos progrès !',
    'history.noResults': 'Aucun résultat pour ce filtre.',
    'history.endOfResults': 'Tous les résultats ont été chargés',
    'history.loadingMore': 'Chargement...',
    
    // Results
    'results.sectionA': 'A',
    'results.sectionB': 'B',
    'results.complete': 'Complet',
    'results.viewDetails': 'Voir les détails',
    'results.readingResults': 'Résultats de Compréhension Écrite',
    'results.listeningResults': 'Résultats de Compréhension Orale',
    'results.section': 'Section',
    'results.sectionAFaitDivers': 'Section A - Fait divers',
    'results.sectionBArgumentation': 'Section B - Argumentation',
    'results.detailedDataUnavailable': 'Les données détaillées ne sont pas disponibles pour ce résultat. Seule l\'évaluation globale est affichée.',
    'results.subject': 'Sujet',
    'results.subjectLabel': 'Sujet :',
    'results.yourWriting': 'Votre rédaction',
    'results.corrections': 'Corrections',
    'results.original': 'Original',
    'results.corrected': 'Corrigé',
    'results.noCorrectionsAvailable': 'Aucune correction disponible pour cette section. Les corrections détaillées sont disponibles uniquement pour les évaluations récentes.',
    'results.modelAnswer': 'Réponse modèle',
    'results.modelAnswerUnavailable': 'Réponse modèle non disponible pour cette section. Les réponses modèles détaillées sont disponibles uniquement pour les évaluations récentes.',
    'results.modelAnswerLevel': 'Réponse Modèle (Niveau B2-C1)',
    'results.overallComment': 'Commentaire général',
    'results.globalEvaluation': 'Évaluation Globale',
    'results.criteriaDetail': 'Détail des Critères',
    'results.improvementPriorities': 'Priorités d\'Amélioration',
    'results.improvementExamples': 'Exemples d\'Amélioration',
    'results.originalVersion': 'Version Originale',
    'results.improvedVersion': 'Version Améliorée',
    'results.explanation': 'Explication',
    'results.transcriptTitle': 'Transcription de votre discours',
    'results.transcriptSubtitle': 'Transcription automatique de votre performance',
    'results.officialDocument': 'Document Officiel',
    'results.instruction': 'Consigne',
    'results.instructionLabel': 'Consigne :',
    'results.audioLoading': 'Chargement de l\'audio...',
    'results.audioError': 'Erreur:',
    'results.audioNotSupported': 'Votre navigateur ne supporte pas la lecture audio.',
    
    // Written Expression
    'writtenExpression.step': 'Étape',
    'writtenExpression.stepOf': 'sur',
    'writtenExpression.submit': 'Soumettre ma rédaction',
    'writtenExpression.placeholder': 'Commencez à rédiger ici...',
    'writtenExpression.accents': 'Accents:',
    'writtenExpression.insert': 'Insérer',
    'writtenExpression.evaluating': 'Évaluation en cours...',
    'writtenExpression.analyzing': 'Analyse en cours...',
    'writtenExpression.analyzingWriting': 'Analyse de votre rédaction',
    'writtenExpression.evaluatingPerformance': 'Évaluation de votre performance',
    'writtenExpression.generatingCorrections': 'Génération des corrections et modèles',
    'writtenExpression.savingResults': 'Sauvegarde des résultats',
    'writtenExpression.processingAudio': 'Traitement de l\'enregistrement audio',
    'writtenExpression.transcribingAudio': 'Transcription de l\'audio',
    
    // Practice
    'practice.title': 'Pratique',
    'practice.oralSubtitle': 'Prêt à pratiquer votre expression orale aujourd\'hui ?',
    'practice.writtenSubtitle': 'Prêt à pratiquer votre expression écrite aujourd\'hui ?',
    'practice.oralExpression': 'Expression Orale',
    'practice.writtenExpression': 'Expression Écrite',
    'practice.oralExpressionDescription': 'Pratiquez l\'expression orale avec Section A, Section B et Examens Complets.',
    'practice.writtenExpressionDescription': 'Pratiquez l\'expression écrite avec Section A, Section B et Examens Complets.',
    'practice.completeExam': 'Entraînement Complet',
    'practice.sectionA': 'Section A',
    'practice.sectionB': 'Section B',
    'practice.writtenCompleteExam': 'Entraînement Complet - Expression Écrite',
    'practice.writtenSectionA': 'Section A - Expression Écrite',
    'practice.writtenSectionB': 'Section B - Expression Écrite',
    'practice.cardDescription': 'Pratiquez l\'expression orale avec Section A, Section B et Examens Complets. Consultez votre historique de pratique.',
    
    // Errors
    'errors.loadFailed': 'Échec du chargement. Veuillez réessayer.',
    'errors.startFailed': 'Échec du démarrage de l\'examen blanc. Veuillez réessayer.',
    'errors.creditsNeeded': 'Vous avez besoin de crédits pour commencer un examen blanc. Veuillez acheter un pack.',
    'errors.loadingSubscription': 'Chargement du statut d\'abonnement...',
    'errors.subscriptionExpired': 'L\'abonnement a expiré',
    'errors.packExpired': 'Le pack a expiré',
    'errors.fullTestLimitReached': 'Limite quotidienne d\'examens complets atteinte et aucun crédit de pack disponible',
    'errors.sectionALimitReached': 'Limite quotidienne de Section A atteinte et aucun crédit de pack disponible',
    'errors.sectionBLimitReached': 'Limite quotidienne de Section B atteinte et aucun crédit de pack disponible',
    'errors.examSessionExpired': 'Cette session d\'examen a expiré. L\'utilisation a déjà été consommée lorsque l\'examen a commencé.',
    
    // Subscription Management
    'subscription.title': 'Gestion de l\'abonnement',
    'subscription.subtitle': 'Gérez votre abonnement et consultez l\'utilisation',
    'subscription.currentStatus': 'Statut actuel',
    'subscription.availablePacks': 'Packs disponibles',
    'subscription.freeTrial': 'Essai gratuit',
    'subscription.active': 'Actif',
    'subscription.current': 'Actuel',
    'subscription.trialDaysRemaining': 'Jours d\'essai restants',
    'subscription.daysRemaining': 'Jours restants',
    'subscription.expirationDate': 'Date d\'expiration',
    'subscription.dailyUsage': 'Utilisation quotidienne',
    'subscription.packCredits': 'Crédits du pack',
    'subscription.resetsAtMidnight': 'Réinitialisation à minuit UTC',
    'subscription.noActivePlan': 'Aucun plan actif',
    'subscription.purchasePackToStart': 'Achetez un pack pour commencer',
    'subscription.starterPack': 'Pack Starter',
    'subscription.examReadyPack': 'Pack Exam Ready',
    'subscription.oneTime': 'unique',
    'subscription.validFor': 'Valide pour',
    'subscription.days': 'jours',
    'subscription.total': 'total',
    'subscription.buyStarterPack': 'Acheter le Pack Starter',
    'subscription.buyExamReadyPack': 'Acheter le Pack Exam Ready',
    'subscription.upgradeToStarterPack': 'Passer au Pack Starter',
    'subscription.upgradeToExamReadyPack': 'Passer au Pack Exam Ready',
    'subscription.currentPack': 'Pack actuel',
    'subscription.upgradingReplacesPack': '⚠️ La mise à niveau remplace le pack actuel',
    'subscription.fullTests': 'Tests Complets',
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
    'back.practice': 'Back to Practice',
    'back.back': 'Back',
    
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
    'common.startPracticing': 'Start Practicing',
    'common.practice': 'Practice',
    'common.history': 'History',
    
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
    'status.loadingExam': 'Loading exam...',
    'status.checkingSubscription': 'Checking subscription...',
    
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
    'modules.writtenExpression': 'Written Expression',
    'modules.reading': 'Reading Comprehension',
    'modules.listening': 'Listening Comprehension',
    'modules.oralExpressionDescription': 'Full exam with Section A (EO1) and Section B (EO2), real-time AI conversation',
    'modules.writtenExpressionDescription': 'Practice written expression with Section A, Section B, and Complete Exams.',
    'modules.readingDescription': '60 minutes, 40 multiple-choice questions (question-by-question format)',
    'modules.listeningDescription': 'Auto-advancing questions with audio playback, 40 multiple-choice questions',
    'modules.oralExpressionDuration': '~30 minutes',
    'modules.readingDuration': '60 minutes',
    'modules.listeningDuration': '~40 minutes',
    
    // History
    'history.title': 'History',
    'history.subtitle': 'View your previous practice results',
    'history.tabA': 'A',
    'history.tabB': 'B',
    'history.tabComplete': 'Complete',
    'history.syncing': 'Syncing to cloud...',
    'history.empty': 'No history',
    'history.emptyDescription': 'Take your first mock exam to start tracking your progress!',
    'history.noResults': 'No results for this filter.',
    'history.endOfResults': 'All results loaded',
    'history.loadingMore': 'Loading...',
    
    // Results
    'results.sectionA': 'A',
    'results.sectionB': 'B',
    'results.complete': 'Complete',
    'results.viewDetails': 'View Details',
    'results.readingResults': 'Reading Comprehension Results',
    'results.listeningResults': 'Listening Comprehension Results',
    'results.section': 'Section',
    'results.sectionAFaitDivers': 'Section A - News Story',
    'results.sectionBArgumentation': 'Section B - Argumentation',
    'results.detailedDataUnavailable': 'Detailed data is not available for this result. Only the overall evaluation is displayed.',
    'results.subject': 'Subject',
    'results.subjectLabel': 'Subject:',
    'results.yourWriting': 'Your Writing',
    'results.corrections': 'Corrections',
    'results.original': 'Original',
    'results.corrected': 'Corrected',
    'results.noCorrectionsAvailable': 'No corrections available for this section. Detailed corrections are only available for recent evaluations.',
    'results.modelAnswer': 'Model Answer',
    'results.modelAnswerUnavailable': 'Model answer not available for this section. Detailed model answers are only available for recent evaluations.',
    'results.modelAnswerLevel': 'Model Answer (Level B2-C1)',
    'results.overallComment': 'Overall Comment',
    'results.globalEvaluation': 'Global Evaluation',
    'results.criteriaDetail': 'Criteria Breakdown',
    'results.improvementPriorities': 'Improvement Priorities',
    'results.improvementExamples': 'Improvement Examples',
    'results.originalVersion': 'Original Version',
    'results.improvedVersion': 'Improved Version',
    'results.explanation': 'Explanation',
    'results.transcriptTitle': 'Transcript of Your Speech',
    'results.transcriptSubtitle': 'Automatic transcription of your performance',
    'results.officialDocument': 'Official Document',
    'results.instruction': 'Instruction',
    'results.instructionLabel': 'Instruction:',
    'results.audioLoading': 'Loading audio...',
    'results.audioError': 'Error:',
    'results.audioNotSupported': 'Your browser does not support audio playback.',
    
    // Written Expression
    'writtenExpression.step': 'Step',
    'writtenExpression.stepOf': 'of',
    'writtenExpression.submit': 'Submit My Writing',
    'writtenExpression.placeholder': 'Start writing here...',
    'writtenExpression.accents': 'Accents:',
    'writtenExpression.insert': 'Insert',
    'writtenExpression.evaluating': 'Evaluating...',
    'writtenExpression.analyzing': 'Analyzing...',
    'writtenExpression.analyzingWriting': 'Analyzing your writing',
    'writtenExpression.evaluatingPerformance': 'Evaluating your performance',
    'writtenExpression.generatingCorrections': 'Generating corrections and models',
    'writtenExpression.savingResults': 'Saving results',
    'writtenExpression.processingAudio': 'Processing audio recording',
    'writtenExpression.transcribingAudio': 'Transcribing audio',
    
    // Practice
    'practice.title': 'Practice',
    'practice.oralSubtitle': 'Ready to practice your oral expression today?',
    'practice.writtenSubtitle': 'Ready to practice your written expression today?',
    'practice.oralExpression': 'Oral Expression',
    'practice.writtenExpression': 'Written Expression',
    'practice.oralExpressionDescription': 'Practice oral expression with Section A, Section B, and Complete Exams.',
    'practice.writtenExpressionDescription': 'Practice written expression with Section A, Section B, and Complete Exams.',
    'practice.completeExam': 'Complete Exam',
    'practice.sectionA': 'Section A',
    'practice.sectionB': 'Section B',
    'practice.writtenCompleteExam': 'Complete Exam - Written Expression',
    'practice.writtenSectionA': 'Section A - Written Expression',
    'practice.writtenSectionB': 'Section B - Written Expression',
    'practice.cardDescription': 'Practice oral expression with Section A, Section B, and Complete Exams. View your practice history.',
    
    // Errors
    'errors.loadFailed': 'Failed to load. Please try again.',
    'errors.startFailed': 'Failed to start mock exam. Please try again.',
    'errors.creditsNeeded': 'You need credits to start a mock exam. Please purchase a pack.',
    'errors.loadingSubscription': 'Loading subscription status...',
    'errors.subscriptionExpired': 'Subscription has expired',
    'errors.packExpired': 'Pack has expired',
    'errors.fullTestLimitReached': 'Daily full test limit reached and no pack credits available',
    'errors.sectionALimitReached': 'Daily Section A limit reached and no pack credits available',
    'errors.sectionBLimitReached': 'Daily Section B limit reached and no pack credits available',
    'errors.examSessionExpired': 'This exam session has expired. Usage was already consumed when the exam started.',
    
    // Subscription Management
    'subscription.title': 'Subscription Management',
    'subscription.subtitle': 'Manage your subscription and view usage',
    'subscription.currentStatus': 'Current Status',
    'subscription.availablePacks': 'Available Packs',
    'subscription.freeTrial': 'Free Trial',
    'subscription.active': 'Active',
    'subscription.current': 'Current',
    'subscription.trialDaysRemaining': 'Trial Days Remaining',
    'subscription.daysRemaining': 'Days Remaining',
    'subscription.expirationDate': 'Expiration Date',
    'subscription.dailyUsage': 'Daily Usage',
    'subscription.packCredits': 'Pack Credits',
    'subscription.resetsAtMidnight': 'Resets at midnight UTC',
    'subscription.noActivePlan': 'No Active Plan',
    'subscription.purchasePackToStart': 'Purchase a pack to get started',
    'subscription.starterPack': 'Starter Pack',
    'subscription.examReadyPack': 'Exam Ready Pack',
    'subscription.oneTime': 'one-time',
    'subscription.validFor': 'Valid for',
    'subscription.days': 'days',
    'subscription.total': 'total',
    'subscription.buyStarterPack': 'Buy Starter Pack',
    'subscription.buyExamReadyPack': 'Buy Exam Ready Pack',
    'subscription.upgradeToStarterPack': 'Upgrade to Starter Pack',
    'subscription.upgradeToExamReadyPack': 'Upgrade to Exam Ready Pack',
    'subscription.currentPack': 'Current Pack',
    'subscription.upgradingReplacesPack': '⚠️ Upgrading replaces current pack',
    'subscription.fullTests': 'Full Tests',
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

