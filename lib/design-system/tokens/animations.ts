/**
 * Design System Animation Tokens
 * 
 * Duration and easing values for consistent animations and transitions.
 */

export const animations = {
  // Animation durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Easing functions for natural motion
  easing: {
    // Accelerating from zero velocity
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    
    // Decelerating to zero velocity
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    
    // Accelerating and decelerating
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Linear motion
    linear: 'linear',
  },
  
  // Common animation presets
  presets: {
    fadeIn: {
      duration: '300ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      keyframes: 'fadeIn',
    },
    fadeOut: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      keyframes: 'fadeOut',
    },
    slideIn: {
      duration: '300ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      keyframes: 'slideIn',
    },
    slideOut: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      keyframes: 'slideOut',
    },
    scaleIn: {
      duration: '150ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      keyframes: 'scaleIn',
    },
  },
} as const;

export type AnimationDuration = keyof typeof animations.duration;
export type AnimationEasing = keyof typeof animations.easing;
export type AnimationPreset = keyof typeof animations.presets;
