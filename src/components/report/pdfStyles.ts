// Inline styles for A4 PDF pages
export const A4 = {
  width: 794,
  height: 1123,
  margin: 48,
} as const;

export const PDF_COLORS = {
  bgDark: '#0B0E1A',
  bgPage: '#FFFFFF',
  bgSection: '#F8FAFC',
  accent: '#7C3AED',
  accentLight: '#DDD6FE',
  emerald: '#10B981',
  text: '#1E293B',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  border: '#E2E8F0',
  tableHeader: '#F1F5F9',
  tableAlt: '#F8FAFC',
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#06B6D4',
  low: '#10B981',
} as const;

export const PDF_FONT = {
  display: 32,
  h1: 22,
  h2: 16,
  h3: 13,
  body: 11,
  small: 9.5,
  caption: 8.5,
} as const;

export const pageStyle: React.CSSProperties = {
  width: `${A4.width}px`,
  minHeight: 'auto',
  backgroundColor: PDF_COLORS.bgPage,
  position: 'relative',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  color: PDF_COLORS.text,
  boxSizing: 'border-box',
  pageBreakAfter: 'always',
};

export const coverStyle: React.CSSProperties = {
  ...pageStyle,
  background: 'linear-gradient(135deg, #0B0E1A 0%, #1A0B3B 100%)',
  color: '#FFFFFF',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: `${A4.margin}px`,
};

export const contentPadding: React.CSSProperties = {
  padding: `24px ${A4.margin}px`,
};

import type React from 'react';
