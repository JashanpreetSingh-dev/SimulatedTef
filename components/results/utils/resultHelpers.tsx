import React from 'react';
import { UpgradedSentence } from '../../../types';

/**
 * Get CECR level background color class
 */
export function getCECRColor(level?: string): string {
  if (!level) return 'bg-indigo-100/700';
  const cecr = level.toUpperCase();
  if (cecr.includes('C2')) return 'bg-purple-400';
  if (cecr.includes('C1')) return 'bg-indigo-400';
  if (cecr.includes('B2')) return 'bg-blue-400';
  if (cecr.includes('B1')) return 'bg-emerald-400';
  if (cecr.includes('A2')) return 'bg-amber-600';
  return 'bg-rose-600';
}

/**
 * Get section badge color classes
 */
export function getSectionBadgeColor(mode: string): string {
  if (mode === 'partA') return 'bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300 border-blue-200 dark:border-blue-700';
  if (mode === 'partB') return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
  return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700';
}

/**
 * Get section label text
 */
export function getSectionLabel(mode: string, t: (key: string) => string): string {
  if (mode === 'partA') return t('results.sectionA');
  if (mode === 'partB') return t('results.sectionB');
  return t('results.complete');
}

/**
 * Get image path with leading slash
 */
export function getImagePath(imagePath: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('/')) return imagePath;
  return '/' + imagePath;
}

/**
 * Highlight mistakes in text using corrections
 */
export function highlightMistakes(text: string, corrections: UpgradedSentence[] | undefined): React.ReactNode {
  if (!corrections || corrections.length === 0) {
    return <span>{text}</span>;
  }

  let highlightedText: React.ReactNode[] = [];
  let remainingText = text;
  let key = 0;

  // Sort corrections by length (longest first) to avoid partial matches
  const sortedCorrections = [...corrections].sort((a, b) => b.weak.length - a.weak.length);

  for (const correction of sortedCorrections) {
    const weakText = correction.weak.trim();
    const index = remainingText.toLowerCase().indexOf(weakText.toLowerCase());
    
    if (index !== -1) {
      // Add text before the mistake
      if (index > 0) {
        highlightedText.push(<span key={key++}>{remainingText.substring(0, index)}</span>);
      }
      
      // Add highlighted mistake
      highlightedText.push(
        <span 
          key={key++} 
          className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-b-2 border-rose-400 dark:border-rose-500 cursor-help"
          title={`Suggestion: "${correction.better}" - ${correction.why}`}
        >
          {remainingText.substring(index, index + weakText.length)}
        </span>
      );
      
      // Continue with remaining text
      remainingText = remainingText.substring(index + weakText.length);
    }
  }

  // Add remaining text
  if (remainingText) {
    highlightedText.push(<span key={key++}>{remainingText}</span>);
  }

  return highlightedText.length > 0 ? <>{highlightedText}</> : <span>{text}</span>;
}
