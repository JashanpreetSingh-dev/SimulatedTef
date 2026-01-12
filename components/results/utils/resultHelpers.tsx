import React from 'react';
import { UpgradedSentence } from '../../../types';
import { CorrectionTooltip } from '../components/CorrectionTooltip';

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
 * Finds ALL matches first, then builds the highlighted text in order
 */
export function highlightMistakes(text: string, corrections: UpgradedSentence[] | undefined): React.ReactNode {
  if (!corrections || corrections.length === 0) {
    return <span>{text}</span>;
  }

  // Find all matches with their positions first
  interface Match {
    start: number;
    end: number;
    correction: UpgradedSentence;
  }
  
  const matches: Match[] = [];
  const textLower = text.toLowerCase();
  
  for (const correction of corrections) {
    const weakText = correction.weak.trim().toLowerCase();
    const index = textLower.indexOf(weakText);
    
    if (index !== -1) {
      matches.push({
        start: index,
        end: index + correction.weak.trim().length,
        correction
      });
    }
  }
  
  // If no matches found, return plain text
  if (matches.length === 0) {
    return <span>{text}</span>;
  }
  
  // Sort matches by position (start index)
  matches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (keep the first one in each overlap)
  const nonOverlapping: Match[] = [];
  for (const match of matches) {
    const lastMatch = nonOverlapping[nonOverlapping.length - 1];
    if (!lastMatch || match.start >= lastMatch.end) {
      nonOverlapping.push(match);
    }
  }
  
  // Build the highlighted text
  const highlightedText: React.ReactNode[] = [];
  let currentPos = 0;
  let key = 0;
  
  for (const match of nonOverlapping) {
    // Add text before this match
    if (match.start > currentPos) {
      highlightedText.push(
        <span key={key++}>{text.substring(currentPos, match.start)}</span>
      );
    }
    
    // Add highlighted mistake with custom tooltip
    highlightedText.push(
      <CorrectionTooltip key={key++} correction={match.correction}>
        <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-b-2 border-rose-400 dark:border-rose-500 cursor-help hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
          {text.substring(match.start, match.end)}
        </span>
      </CorrectionTooltip>
    );
    
    currentPos = match.end;
  }
  
  // Add remaining text after last match
  if (currentPos < text.length) {
    highlightedText.push(<span key={key++}>{text.substring(currentPos)}</span>);
  }

  return <>{highlightedText}</>;
}
