import { StyleSheet } from '@react-pdf/renderer';

// ============================================================
// Professional Executive Color Palette
// Dignified, high-contrast, enterprise-grade cybersecurity styling
// ============================================================
export const PDF_COLORS = {
  // Brand & Primary Identifiers
  primaryDark: '#0A1128',       // Midnight Slate (Cover & deep headers)
  primaryNavy: '#1E293B',       // Corporate Slate Navy
  primaryBlue: '#1D4ED8',       // Executive Cobalt Blue
  accentBlue: '#2563EB',        // Bright Corporate Blue
  accentSky: '#0284C7',         // Steel Sky Blue
  accentTeal: '#0D9488',        // Professional Teal
  
  // Surfaces & Backgrounds
  bgDark: '#0A1128',            // Dark Cover page background
  bgCoverCard: '#111C38',       // Cover KPI card background
  bgCoverCardBorder: '#1E2F5D', // Cover KPI card border
  bgPage: '#FFFFFF',            // Crisp white standard page
  bgSection: '#F8FAFC',         // Slate 50 background fill
  bgMuted: '#F1F5F9',           // Slate 100 subtle container fill
  
  // Borders & Dividers
  border: '#E2E8F0',            // Slate 200 clean border
  borderMedium: '#CBD5E1',      // Slate 300 divider
  borderDark: '#1E293B',        // Slate 800 dark border
  
  // Typography
  textPrimary: '#0F172A',       // Slate 900 (High contrast dark ink)
  textSecondary: '#475569',     // Slate 600 (Secondary information)
  textMuted: '#64748B',         // Slate 500 (Footnotes, captions)
  textLight: '#94A3B8',         // Slate 400 (Hairline, watermarks)
  textWhite: '#FFFFFF',         // Crisp White
  textWhiteMuted: '#94A3B8',    // Muted on dark backgrounds
  
  // Enterprise Security Severity Scale
  critical: '#DC2626',          // Red 600 - High urgency
  criticalBg: '#FEF2F2',
  high: '#D97706',              // Amber 600 - Warning
  highBg: '#FFFBEB',
  medium: '#2563EB',            // Blue 600 - Informational
  mediumBg: '#EFF6FF',
  low: '#059669',               // Emerald 600 - Safe / Resolved
  lowBg: '#ECFDF5',
  neutral: '#64748B',           // Slate 500
  neutralBg: '#F8FAFC',

  // Table rows
  tableHeader: '#F1F5F9',
  tableRowEven: '#FFFFFF',
  tableRowOdd: '#F8FAFC',
} as const;

// Professional Categorical Chart Palette (Harmonious Corporate Palette)
export const CHART_PALETTE = [
  '#1D4ED8', // Cobalt Navy
  '#0D9488', // Deep Teal
  '#D97706', // Executive Amber
  '#DC2626', // Executive Crimson
  '#4F46E5', // Enterprise Indigo
  '#0284C7', // Steel Blue
  '#059669', // Forest Emerald
  '#64748B', // Slate Gray
] as const;

// Typographic Scale (points)
export const PDF_FONT = {
  display: 26,
  h1: 17,
  h2: 12.5,
  h3: 10,
  body: 8.5,
  small: 7.5,
  caption: 7,
  tiny: 6,
} as const;

// Layout Dimensions (A4 in points: 595.28 x 841.89)
export const A4_DIMENSIONS = {
  width: 595.28,
  height: 841.89,
  paddingH: 36,
  paddingV: 30,
} as const;

// ============================================================
// Global React-PDF StyleSheet
// ============================================================
export const pdfStyles = StyleSheet.create({
  // Page Containers
  page: {
    paddingTop: A4_DIMENSIONS.paddingV,
    paddingBottom: A4_DIMENSIONS.paddingV + 6,
    paddingHorizontal: A4_DIMENSIONS.paddingH,
    fontFamily: 'Helvetica',
    fontSize: PDF_FONT.body,
    color: PDF_COLORS.textPrimary,
    backgroundColor: PDF_COLORS.bgPage,
  },
  coverPage: {
    padding: 44,
    fontFamily: 'Helvetica',
    backgroundColor: PDF_COLORS.bgDark,
    color: PDF_COLORS.textWhite,
    justifyContent: 'space-between',
  },

  // Running Header & Footer
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    paddingBottom: 6,
    marginBottom: 14,
  },
  headerBrand: {
    fontSize: PDF_FONT.tiny + 0.5,
    color: PDF_COLORS.textMuted,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerSection: {
    fontSize: PDF_FONT.tiny + 0.5,
    color: PDF_COLORS.textSecondary,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: A4_DIMENSIONS.paddingH,
    right: A4_DIMENSIONS.paddingH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 5,
  },
  footerText: {
    fontSize: PDF_FONT.tiny,
    color: PDF_COLORS.textLight,
  },
  footerPage: {
    fontSize: PDF_FONT.tiny,
    color: PDF_COLORS.textMuted,
    fontWeight: 'bold',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionAccentBar: {
    width: 3.5,
    height: 16,
    backgroundColor: PDF_COLORS.primaryBlue,
    borderRadius: 1.5,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: PDF_FONT.h1,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
  },
  subSectionTitle: {
    fontSize: PDF_FONT.h3,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },

  // Metric Cards
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: PDF_COLORS.bgSection,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderTopWidth: 3,
    borderTopColor: PDF_COLORS.primaryBlue,
    borderRadius: 4,
    padding: 10,
  },
  metricCardLabel: {
    fontSize: PDF_FONT.tiny + 0.5,
    color: PDF_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  metricCardValue: {
    fontSize: PDF_FONT.h1 - 1,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
  },
  metricCardSub: {
    fontSize: PDF_FONT.tiny,
    color: PDF_COLORS.textSecondary,
    marginTop: 2,
  },

  // Data Tables
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.tableHeader,
    borderBottomWidth: 1.5,
    borderBottomColor: PDF_COLORS.borderMedium,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: PDF_FONT.caption,
    fontWeight: 'bold',
    color: PDF_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: PDF_COLORS.border,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: PDF_FONT.small,
    color: PDF_COLORS.textPrimary,
  },

  // Horizontal Bar Chart
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4.5,
  },
  barLabel: {
    width: 145,
    fontSize: PDF_FONT.caption,
    color: PDF_COLORS.textSecondary,
    textAlign: 'right',
    paddingRight: 8,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: PDF_COLORS.bgMuted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barValue: {
    width: 42,
    fontSize: PDF_FONT.small,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
    textAlign: 'right',
    paddingLeft: 6,
  },

  // Color Stat Row (Verdict badges)
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 110,
    backgroundColor: PDF_COLORS.bgSection,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    borderLeftWidth: 3.5,
    borderRadius: 4,
    padding: 8,
  },
  statLabel: {
    fontSize: PDF_FONT.caption,
    color: PDF_COLORS.textMuted,
    marginBottom: 3,
  },
  statValue: {
    fontSize: PDF_FONT.h2,
    fontWeight: 'bold',
    color: PDF_COLORS.textPrimary,
  },
  statPercent: {
    fontSize: PDF_FONT.caption,
    color: PDF_COLORS.textSecondary,
    marginTop: 2,
  },
});
