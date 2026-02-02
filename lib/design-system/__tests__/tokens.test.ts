/**
 * Design System Tokens Tests
 * 
 * Basic tests to verify design tokens are properly exported and accessible.
 */

import { describe, it, expect } from 'vitest';
import { colors, typography, spacing, shadows, animations, breakpoints } from '../tokens';

describe('Design System Tokens', () => {
  describe('Colors', () => {
    it('should export all color categories', () => {
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('neutral');
      expect(colors).toHaveProperty('success');
      expect(colors).toHaveProperty('warning');
      expect(colors).toHaveProperty('error');
      expect(colors).toHaveProperty('info');
    });

    it('should have all shades for primary color', () => {
      const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
      shades.forEach(shade => {
        expect(colors.primary).toHaveProperty(String(shade));
        expect(typeof colors.primary[shade as keyof typeof colors.primary]).toBe('string');
      });
    });
  });

  describe('Typography', () => {
    it('should export font families', () => {
      expect(typography.fontFamily).toHaveProperty('sans');
      expect(typography.fontFamily).toHaveProperty('mono');
      expect(Array.isArray(typography.fontFamily.sans)).toBe(true);
    });

    it('should export font sizes', () => {
      expect(typography.fontSize).toHaveProperty('base');
      expect(typography.fontSize.base).toBe('1rem');
    });

    it('should export font weights', () => {
      expect(typography.fontWeight).toHaveProperty('normal');
      expect(typography.fontWeight).toHaveProperty('bold');
    });
  });

  describe('Spacing', () => {
    it('should export spacing scale', () => {
      expect(spacing).toHaveProperty('0');
      expect(spacing).toHaveProperty('4');
      expect(spacing[4]).toBe('1rem');
    });

    it('should follow 4px base unit', () => {
      // Spacing 4 should be 16px (1rem)
      expect(spacing[4]).toBe('1rem');
      // Spacing 8 should be 32px (2rem)
      expect(spacing[8]).toBe('2rem');
    });
  });

  describe('Shadows', () => {
    it('should export shadow levels', () => {
      expect(shadows).toHaveProperty('sm');
      expect(shadows).toHaveProperty('base');
      expect(shadows).toHaveProperty('md');
      expect(shadows).toHaveProperty('lg');
    });
  });

  describe('Animations', () => {
    it('should export animation durations', () => {
      expect(animations.duration).toHaveProperty('fast');
      expect(animations.duration).toHaveProperty('normal');
      expect(animations.duration).toHaveProperty('slow');
      expect(animations.duration.fast).toBe('150ms');
      expect(animations.duration.normal).toBe('300ms');
      expect(animations.duration.slow).toBe('500ms');
    });

    it('should export easing functions', () => {
      expect(animations.easing).toHaveProperty('easeIn');
      expect(animations.easing).toHaveProperty('easeOut');
      expect(animations.easing).toHaveProperty('easeInOut');
    });
  });

  describe('Breakpoints', () => {
    it('should export responsive breakpoints', () => {
      expect(breakpoints).toHaveProperty('mobile');
      expect(breakpoints).toHaveProperty('sm');
      expect(breakpoints).toHaveProperty('md');
      expect(breakpoints).toHaveProperty('lg');
      expect(breakpoints).toHaveProperty('xl');
    });
  });
});
