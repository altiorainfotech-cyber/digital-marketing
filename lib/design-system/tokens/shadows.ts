/**
 * Design System Shadow Tokens
 * 
 * Shadow levels for elevation and depth effects.
 * Provides consistent shadow styling across components.
 */

export const shadows = {
  // No shadow
  none: 'none',
  
  // Small shadow - subtle elevation
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  
  // Base shadow - default elevation
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  
  // Medium shadow - moderate elevation
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  
  // Large shadow - high elevation
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  
  // Extra large shadow - very high elevation
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  
  // 2XL shadow - maximum elevation
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // Inner shadow - inset effect
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

export type ShadowLevel = keyof typeof shadows;
