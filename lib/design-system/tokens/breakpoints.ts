/**
 * Design System Breakpoint Tokens
 * 
 * Responsive breakpoints for different viewport sizes.
 * Follows mobile-first approach.
 */

export const breakpoints = {
  // Mobile devices (default, no media query needed)
  mobile: '320px',
  
  // Small tablets and large phones
  sm: '640px',
  
  // Tablets
  md: '768px',
  
  // Desktop
  lg: '1024px',
  
  // Large desktop
  xl: '1280px',
  
  // Extra large desktop
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Helper to get media query string for a breakpoint
 */
export const mediaQuery = {
  mobile: `@media (min-width: ${breakpoints.mobile})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const;
