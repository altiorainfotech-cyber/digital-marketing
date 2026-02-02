/**
 * Color Utilities
 * 
 * Utilities for color manipulation and accessibility compliance.
 * Includes contrast ratio calculation and WCAG compliance checking.
 */

/**
 * Converts a hex color to RGB values
 * 
 * @param hex - Hex color string (e.g., '#3b82f6' or '3b82f6')
 * @returns RGB object with r, g, b values (0-255)
 * 
 * @example
 * ```ts
 * hexToRgb('#3b82f6') // { r: 59, g: 130, b: 246 }
 * ```
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return null;
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Converts RGB values to hex color
 * 
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string
 * 
 * @example
 * ```ts
 * rgbToHex(59, 130, 246) // '#3b82f6'
 * ```
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates the relative luminance of a color
 * Based on WCAG 2.1 formula
 * 
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  // Convert to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates the contrast ratio between two colors
 * Based on WCAG 2.1 formula
 * 
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @returns Contrast ratio (1-21)
 * 
 * @example
 * ```ts
 * calculateContrastRatio('#000000', '#ffffff') // 21
 * calculateContrastRatio('#3b82f6', '#ffffff') // 3.28
 * ```
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors (e.g., #3b82f6)');
  }

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG compliance levels
 */
export type WCAGLevel = 'AA' | 'AAA';

/**
 * Text size categories for WCAG
 */
export type TextSize = 'normal' | 'large';

/**
 * WCAG contrast requirements
 */
const WCAG_REQUIREMENTS = {
  AA: {
    normal: 4.5,
    large: 3.0,
  },
  AAA: {
    normal: 7.0,
    large: 4.5,
  },
};

/**
 * Checks if a color combination meets WCAG contrast requirements
 * 
 * @param foreground - Foreground color (hex string)
 * @param background - Background color (hex string)
 * @param level - WCAG level ('AA' or 'AAA')
 * @param textSize - Text size ('normal' or 'large')
 * @returns Whether the combination meets requirements
 * 
 * @example
 * ```ts
 * meetsWCAGRequirement('#000000', '#ffffff', 'AA', 'normal') // true
 * meetsWCAGRequirement('#3b82f6', '#ffffff', 'AA', 'normal') // false
 * meetsWCAGRequirement('#3b82f6', '#ffffff', 'AA', 'large') // true
 * ```
 */
export function meetsWCAGRequirement(
  foreground: string,
  background: string,
  level: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const requirement = WCAG_REQUIREMENTS[level][textSize];
  return ratio >= requirement;
}

/**
 * Gets the WCAG compliance level for a color combination
 * 
 * @param foreground - Foreground color (hex string)
 * @param background - Background color (hex string)
 * @param textSize - Text size ('normal' or 'large')
 * @returns Compliance level ('AAA', 'AA', or 'fail')
 * 
 * @example
 * ```ts
 * getWCAGLevel('#000000', '#ffffff', 'normal') // 'AAA'
 * getWCAGLevel('#3b82f6', '#ffffff', 'normal') // 'fail'
 * getWCAGLevel('#3b82f6', '#ffffff', 'large') // 'AA'
 * ```
 */
export function getWCAGLevel(
  foreground: string,
  background: string,
  textSize: TextSize = 'normal'
): 'AAA' | 'AA' | 'fail' {
  const ratio = calculateContrastRatio(foreground, background);

  if (ratio >= WCAG_REQUIREMENTS.AAA[textSize]) {
    return 'AAA';
  } else if (ratio >= WCAG_REQUIREMENTS.AA[textSize]) {
    return 'AA';
  } else {
    return 'fail';
  }
}

/**
 * Checks if a color is light or dark
 * 
 * @param color - Color (hex string)
 * @returns 'light' or 'dark'
 * 
 * @example
 * ```ts
 * isLightOrDark('#ffffff') // 'light'
 * isLightOrDark('#000000') // 'dark'
 * isLightOrDark('#3b82f6') // 'light'
 * ```
 */
export function isLightOrDark(color: string): 'light' | 'dark' {
  const rgb = hexToRgb(color);
  if (!rgb) {
    throw new Error('Invalid color format');
  }

  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? 'light' : 'dark';
}

/**
 * Suggests an accessible text color (black or white) for a background
 * 
 * @param background - Background color (hex string)
 * @returns Suggested text color ('#000000' or '#ffffff')
 * 
 * @example
 * ```ts
 * suggestTextColor('#3b82f6') // '#ffffff'
 * suggestTextColor('#dbeafe') // '#000000'
 * ```
 */
export function suggestTextColor(background: string): '#000000' | '#ffffff' {
  const whiteRatio = calculateContrastRatio('#ffffff', background);
  const blackRatio = calculateContrastRatio('#000000', background);

  return whiteRatio > blackRatio ? '#ffffff' : '#000000';
}

/**
 * Validates all color combinations in a palette for WCAG compliance
 * 
 * @param textColors - Array of text colors (hex strings)
 * @param backgroundColors - Array of background colors (hex strings)
 * @param level - WCAG level to check
 * @param textSize - Text size
 * @returns Array of failing combinations
 * 
 * @example
 * ```ts
 * const textColors = ['#000000', '#3b82f6'];
 * const bgColors = ['#ffffff', '#f5f5f5'];
 * const failures = validateColorPalette(textColors, bgColors, 'AA', 'normal');
 * // Returns array of { text, background, ratio, required } for failing combinations
 * ```
 */
export function validateColorPalette(
  textColors: string[],
  backgroundColors: string[],
  level: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): Array<{
  text: string;
  background: string;
  ratio: number;
  required: number;
  passes: boolean;
}> {
  const results: Array<{
    text: string;
    background: string;
    ratio: number;
    required: number;
    passes: boolean;
  }> = [];

  const required = WCAG_REQUIREMENTS[level][textSize];

  for (const text of textColors) {
    for (const background of backgroundColors) {
      const ratio = calculateContrastRatio(text, background);
      const passes = ratio >= required;

      if (!passes) {
        results.push({
          text,
          background,
          ratio,
          required,
          passes,
        });
      }
    }
  }

  return results;
}

/**
 * Adjusts a color's lightness to meet contrast requirements
 * Note: This is a simplified implementation. For production use,
 * consider using a color manipulation library like chroma.js
 * 
 * @param color - Color to adjust (hex string)
 * @param background - Background color (hex string)
 * @param targetRatio - Target contrast ratio
 * @returns Adjusted color (hex string) or null if not achievable
 */
export function adjustColorForContrast(
  color: string,
  background: string,
  targetRatio: number = 4.5
): string | null {
  const rgb = hexToRgb(color);
  if (!rgb) return null;

  // Try darkening or lightening the color
  const currentRatio = calculateContrastRatio(color, background);
  
  if (currentRatio >= targetRatio) {
    return color; // Already meets requirement
  }

  // Determine if we should darken or lighten
  const shouldDarken = isLightOrDark(background) === 'light';
  
  // Adjust in steps
  let { r, g, b } = rgb;
  const step = shouldDarken ? -10 : 10;
  const limit = shouldDarken ? 0 : 255;
  
  for (let i = 0; i < 25; i++) {
    r = Math.max(0, Math.min(255, r + step));
    g = Math.max(0, Math.min(255, g + step));
    b = Math.max(0, Math.min(255, b + step));
    
    const adjustedColor = rgbToHex(r, g, b);
    const ratio = calculateContrastRatio(adjustedColor, background);
    
    if (ratio >= targetRatio) {
      return adjustedColor;
    }
    
    // Stop if we've reached the limit
    if ((shouldDarken && r === 0 && g === 0 && b === 0) ||
        (!shouldDarken && r === 255 && g === 255 && b === 255)) {
      break;
    }
  }
  
  return null; // Could not achieve target ratio
}
