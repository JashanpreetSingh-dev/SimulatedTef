/**
 * Prebrief instructions for Section A (EO1)
 */
export function getPrebriefSectionA(): string {
  return `Vous allez faire l'épreuve d'expression orale, section A (EO1).
Vous allez voir une image et une consigne.
Je vais vous laisser 60 secondes pour lire et vous préparer. Pendant ce temps, ne parlez pas.
Ensuite, je commencerai l'appel téléphonique et vous poserez vos questions.`;
}

/**
 * Prebrief instructions for Section B (EO2)
 */
export function getPrebriefSectionB(): string {
  return `Vous allez faire l'épreuve d'expression orale, section B (EO2).
Vous allez voir une image et une consigne.
Je vais vous laisser 60 secondes pour lire et vous préparer. Pendant ce temps, ne parlez pas.
Ensuite, vous commencerez à parler en premier pour essayer de me convaincre.`;
}

/**
 * Get prebrief for a specific section
 */
export function getPrebrief(sectionKey: 'A' | 'B'): string {
  return sectionKey === 'A' ? getPrebriefSectionA() : getPrebriefSectionB();
}

