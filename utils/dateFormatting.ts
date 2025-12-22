/**
 * Date formatting utilities that use browser's local timezone
 */

/**
 * Formats a timestamp (number) or ISO string to a localized date string
 * Always uses browser's local timezone
 * 
 * @param timestamp - Unix timestamp (number) or ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in browser's local timezone
 */
export function formatDate(
  timestamp: number | string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
): string {
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp) 
    : new Date(timestamp);
  
  // Use browser's locale and timezone
  return date.toLocaleDateString(undefined, options);
}

/**
 * Formats a timestamp to a localized date and time string
 * Always uses browser's local timezone
 * 
 * @param timestamp - Unix timestamp (number) or ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date and time string in browser's local timezone
 */
export function formatDateTime(
  timestamp: number | string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp) 
    : new Date(timestamp);
  
  // Use browser's locale and timezone
  return date.toLocaleString(undefined, options);
}

/**
 * Formats a timestamp to a relative time string (e.g., "2 hours ago")
 * Always uses browser's local timezone
 * 
 * @param timestamp - Unix timestamp (number) or ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number | string): string {
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp) 
    : new Date(timestamp);
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'À l\'instant';
  } else if (diffMins < 60) {
    return `Il y a ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours} ${diffHours === 1 ? 'heure' : 'heures'}`;
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} ${diffDays === 1 ? 'jour' : 'jours'}`;
  } else {
    // For older dates, show actual date
    return formatDate(timestamp);
  }
}

/**
 * Formats a timestamp to French locale date string
 * Always uses browser's local timezone
 * 
 * @param timestamp - Unix timestamp (number) or ISO date string
 * @returns Formatted date string in French locale, browser's timezone
 */
export function formatDateFrench(
  timestamp: number | string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
): string {
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp) 
    : new Date(timestamp);
  
  // Use French locale but browser's timezone
  return date.toLocaleDateString('fr-FR', options);
}

