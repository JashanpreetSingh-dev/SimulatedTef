/**
 * Design Tokens - Sizing Conventions Reference
 * 
 * This file documents the standardized sizing conventions used across the app.
 * All components should follow these conventions for consistency.
 * 
 * Based on Tailwind's default 4px spacing scale.
 */

/**
 * SPACING SCALE (4px base unit)
 * 
 * Use these values for padding, margin, gap, and spacing utilities.
 */
export const SPACING = {
  // Tight spacing - for tight groups, icons
  TIGHT_1: '1',      // 4px
  TIGHT_2: '2',      // 8px
  
  // Small spacing - for compact components, buttons
  SMALL_3: '3',      // 12px
  SMALL_4: '4',      // 16px
  
  // Medium spacing - for cards, sections, default padding
  MEDIUM_6: '6',     // 24px
  MEDIUM_8: '8',     // 32px
  
  // Large spacing - for major sections, page padding
  LARGE_10: '10',    // 40px
  LARGE_12: '12',    // 48px
  
  // Extra large - for hero sections, large gaps
  XL_16: '16',       // 64px
  XL_20: '20',       // 80px
} as const;

/**
 * SPACING STANDARDS
 * 
 * Standardized spacing patterns for common use cases.
 */
export const SPACING_STANDARDS = {
  // Card padding
  CARD_PADDING: 'p-6',           // 24px - standard cards
  CARD_PADDING_LARGE: 'p-8',     // 32px - larger cards
  
  // Section padding
  SECTION_PADDING_X_MOBILE: 'px-6',  // 24px - mobile horizontal padding
  SECTION_PADDING_X_DESKTOP: 'px-8', // 32px - desktop horizontal padding
  
  // Gap between elements
  GAP_STANDARD: 'gap-4',         // 16px - standard gap
  GAP_LARGE: 'gap-6',            // 24px - larger gaps
  
  // Vertical spacing
  SPACE_Y_STANDARD: 'space-y-4', // 16px - standard vertical spacing
  SPACE_Y_SECTION: 'space-y-6',  // 24px - section vertical spacing
  
  // Button padding
  BUTTON_PADDING_STANDARD: 'py-4 px-6',  // Standard buttons
  BUTTON_PADDING_SMALL: 'py-3 px-6',     // Smaller buttons
} as const;

/**
 * TYPOGRAPHY SCALE
 * 
 * Standardized text sizes for consistent typography hierarchy.
 */
export const TYPOGRAPHY = {
  // Micro text
  MICRO: 'text-xs',        // 12px - labels, captions, badges
  
  // Small text
  SMALL: 'text-sm',        // 14px - secondary text, helper text
  
  // Base text
  BASE: 'text-base',       // 16px - body text, default
  
  // Large text
  LARGE: 'text-lg',        // 18px - emphasized body text
  
  // Headings
  HEADING_XL: 'text-xl',   // 20px - h4, small headings
  HEADING_2XL: 'text-2xl', // 24px - h3, card titles
  HEADING_3XL: 'text-3xl', // 30px - h2, section headings
  HEADING_4XL: 'text-4xl', // 36px - h1, page titles
  HEADING_5XL: 'text-5xl', // 48px - hero headings (mobile)
  HEADING_6XL: 'text-6xl', // 60px - hero headings (desktop)
} as const;

/**
 * BORDER RADIUS
 * 
 * Standardized border radius values.
 */
export const BORDER_RADIUS = {
  SMALL: 'rounded-lg',      // 8px - buttons, small elements
  MEDIUM: 'rounded-xl',     // 12px - cards, inputs
  LARGE: 'rounded-2xl',     // 16px - large cards, containers
  XL: 'rounded-3xl',        // 24px - hero sections, featured cards
  FULL: 'rounded-full',      // Full - pills, avatars, circular elements
} as const;

/**
 * CONTAINER WIDTHS
 * 
 * Standardized container width constraints.
 */
export const CONTAINER_WIDTHS = {
  NARROW: 'max-w-2xl',      // 672px - forms, single column content
  STANDARD: 'max-w-5xl',   // 1024px - main content areas, pages
  WIDE: 'max-w-6xl',        // 1152px - landing sections
  XL: 'max-w-7xl',          // 1280px - full-width sections with padding
  SIDEBAR: 'w-64',          // 256px - navigation sidebar
} as const;

/**
 * COMPONENT HEIGHTS
 * 
 * Standardized height values for components.
 */
export const HEIGHTS = {
  SMALL: 'h-8',      // 32px - small buttons, inputs
  MEDIUM: 'h-10',    // 40px - standard buttons, inputs
  LARGE: 'h-12',     // 48px - large buttons, headers
  XL: 'h-14',        // 56px - extra large elements
  XL_2: 'h-16',      // 64px - hero elements
  FULL: 'h-screen',  // Full viewport height
} as const;

/**
 * USAGE EXAMPLES:
 * 
 * // Spacing
 * <div className={`${SPACING_STANDARDS.CARD_PADDING} ${BORDER_RADIUS.LARGE}`}>
 * 
 * // Typography
 * <h1 className={TYPOGRAPHY.HEADING_4XL}>Title</h1>
 * <p className={TYPOGRAPHY.BASE}>Body text</p>
 * 
 * // Container
 * <div className={CONTAINER_WIDTHS.STANDARD}>
 * 
 * // Button
 * <button className={`${SPACING_STANDARDS.BUTTON_PADDING_STANDARD} ${BORDER_RADIUS.SMALL}`}>
 */
