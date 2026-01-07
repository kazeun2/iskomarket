import React from 'react';

// College Frame Styles
export const COLLEGE_FRAME_STYLES: Record<string, {
  light: { bg: string; border: string; accent: string };
  dark: { bg: string; border: string; accent: string; shadow: string };
}> = {
  'CEIT': {
    light: { bg: 'linear-gradient(135deg, #FF6B00 0%, #FF8C3A 100%)', border: '#FF6B00', accent: '#FFFFFF' },
    dark: { bg: 'linear-gradient(135deg, #FF6B00 0%, #B34E00 100%)', border: '#FF6B00', accent: '#FFFFFF', shadow: '0 0 25px rgba(255, 107, 0, 0.3), 0 8px 32px rgba(255, 107, 0, 0.2), inset 0 1px 0 rgba(255, 107, 0, 0.2)' }
  },
  'CEMDS': {
    light: { bg: 'linear-gradient(135deg, #1E3A8A 0%, #3B5998 100%)', border: '#FFD700', accent: '#FFD700' },
    dark: { bg: 'linear-gradient(135deg, #1E3A8A 0%, #0F1F47 100%)', border: '#FFD700', accent: '#C0C0C0', shadow: '0 0 25px rgba(255, 215, 0, 0.25), 0 8px 32px rgba(30, 58, 138, 0.4), inset 0 1px 0 rgba(255, 215, 0, 0.15)' }
  },
  'CON': {
    light: { bg: 'linear-gradient(135deg, #60A5FA 0%, #93C5FD 100%)', border: '#93C5FD', accent: '#60A5FA' },
    dark: { bg: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)', border: '#93C5FD', accent: '#FFFFFF', shadow: '0 0 25px rgba(96, 165, 250, 0.3), 0 8px 32px rgba(96, 165, 250, 0.2), inset 0 1px 0 rgba(147, 197, 253, 0.15)' }
  },
  'CAS': {
    light: { bg: 'linear-gradient(135deg, #991B1B 0%, #B91C1C 100%)', border: '#DC2626', accent: '#FFD700' },
    dark: { bg: 'linear-gradient(135deg, #991B1B 0%, #450a0a 100%)', border: '#DC2626', accent: '#FFD700', shadow: '0 0 25px rgba(220, 38, 38, 0.3), 0 8px 32px rgba(153, 27, 27, 0.4), inset 0 1px 0 rgba(220, 38, 38, 0.2)' }
  },
  'CAFENR': {
    light: { bg: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)', border: '#22C55E', accent: '#22C55E' },
    dark: { bg: 'linear-gradient(135deg, #15803D 0%, #052e16 100%)', border: '#22C55E', accent: '#92400E', shadow: '0 0 25px rgba(34, 197, 94, 0.3), 0 8px 32px rgba(21, 128, 61, 0.4), inset 0 1px 0 rgba(34, 197, 94, 0.15)' }
  },
  'CED': {
    light: { bg: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', border: '#3B82F6', accent: '#FFD700' },
    dark: { bg: 'linear-gradient(135deg, #1E3A8A 0%, #0F1F47 100%)', border: '#3B82F6', accent: '#FFD700', shadow: '0 0 25px rgba(59, 130, 246, 0.3), 0 8px 32px rgba(30, 58, 138, 0.4), inset 0 1px 0 rgba(59, 130, 246, 0.15)' }
  },
  'CVMBS': {
    light: { bg: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)', border: '#06B6D4', accent: '#06B6D4' },
    dark: { bg: 'linear-gradient(135deg, #0891B2 0%, #164e63 100%)', border: '#06B6D4', accent: '#FFFFFF', shadow: '0 0 25px rgba(6, 182, 212, 0.3), 0 8px 32px rgba(8, 145, 178, 0.4), inset 0 1px 0 rgba(6, 182, 212, 0.15)' }
  },
  'CSPEAR': {
    light: { bg: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)', border: '#EF4444', accent: '#FFFFFF' },
    dark: { bg: 'linear-gradient(135deg, #DC2626 0%, #7f1d1d 100%)', border: '#EF4444', accent: '#FFFFFF', shadow: '0 0 25px rgba(239, 68, 68, 0.3), 0 8px 32px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(239, 68, 68, 0.2)' }
  },
  'CTHM': {
    light: { bg: 'linear-gradient(135deg, #06B6D4 0%, #14B8A6 100%)', border: '#14B8A6', accent: '#F59E0B' },
    dark: { bg: 'linear-gradient(135deg, #06B6D4 0%, #0e7490 100%)', border: '#14B8A6', accent: '#F59E0B', shadow: '0 0 25px rgba(20, 184, 166, 0.3), 0 8px 32px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(20, 184, 166, 0.15)' }
  }
};

export function getCollegeFrameStyles(frameEffect: any, isDarkMode: boolean) {
  if (!frameEffect?.active || !frameEffect?.college) {
    return null;
  }

  // Check expiration
  if (frameEffect.expiresAt && new Date(frameEffect.expiresAt) < new Date()) {
    return null;
  }

  const styles = COLLEGE_FRAME_STYLES[frameEffect.college];
  if (!styles) return null;

  return isDarkMode ? styles.dark : styles.light;
}
