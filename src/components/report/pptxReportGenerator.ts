import type PptxGenJS from 'pptxgenjs';
import type { AnalyticsResult, MonthSummary } from '@/types';

// ============================================================
// Modern Executive Palette & JetBrains Mono Typography Tokens
// Slide 1: High-Impact Dark Command Center Cover
// Slides 2–9: Modern Crisp Light-Mode Corporate Theme
// ============================================================
const FONT = 'JetBrains Mono';

// Slide 1 (Cover) Dark Palette
const DARK = {
  bgBase: '0A1128',
  bgCard: '111C38',
  border: '1E2F5D',
  purple: '8B5CF6',
  cyan: '38BDF8',
  emerald: '34D399',
  red: 'F87171',
  textWhite: 'FFFFFF',
  textSecondary: '94A3B8',
  textMuted: '64748B',
};

// Slides 2–9 Modern Crisp Light Palette
const LIGHT = {
  bgPage: 'F8FAFC',        // Slate 50 clean surface
  bgCard: 'FFFFFF',        // Pure white card
  bgCardAlt: 'F1F5F9',     // Slate 100 alternating container fill
  bgHeader: '1E293B',      // Dark slate navy table header
  border: 'E2E8F0',        // Slate 200 border
  borderMedium: 'CBD5E1',  // Slate 300
  gridLine: 'E2E8F0',      // Light clean gridline for charts

  // High-contrast vibrant brand accents (tuned for white backgrounds)
  purple: '7C3AED',        // Deep Vivid Purple
  cyan: '0284C7',          // Steel Sky / Cyan
  emerald: '059669',       // Fresh Emerald
  amber: 'D97706',         // Warm Amber
  red: 'DC2626',           // Crimson Red
  rose: 'E11D48',          // Vivid Rose
  blue: '2563EB',          // Royal Blue
  pink: 'DB2777',          // Hot Pink
  teal: '0D9488',          // Deep Teal

  // Typography for light mode
  textPrimary: '0F172A',   // Slate 900 (High contrast)
  textSecondary: '475569', // Slate 600
  textMuted: '64748B',     // Slate 500
  textLight: '94A3B8',     // Slate 400
  textWhite: 'FFFFFF',

  // Alert & Chip fills
  chipRedBg: 'FEF2F2',
  chipRedBorder: 'FECACA',
  chipRedText: 'B91C1C',
  chipAmberBg: 'FFFBEB',
  chipAmberBorder: 'FDE68A',
  chipAmberText: '92400E',
  chipGreenBg: 'ECFDF5',
  chipGreenBorder: 'A7F3D0',
  chipGreenText: '047857',
};

// High-contrast categorical palette for light-mode charts
const LIGHT_CHART_COLORS = [
  '7C3AED', // Deep Purple
  '0284C7', // Vivid Cyan
  '059669', // Fresh Emerald
  'D97706', // Warm Amber
  'DC2626', // Crimson Red
  '2563EB', // Royal Blue
  'DB2777', // Hot Pink
  '0D9488', // Deep Teal
];

// Semantic verdict colors tuned for light backgrounds
const VERDICT_LIGHT_COLORS: Record<string, string> = {
  'true positive': 'DC2626',
  'true_positive': 'DC2626',
  malicious: 'DC2626',
  'false positive': '059669',
  'false_positive': '059669',
  benign: '059669',
  suspicious: 'D97706',
  undefined: '7C3AED',
  unknown: '64748B',
};

export interface GeneratePptxOptions {
  analytics: AnalyticsResult;
  months: MonthSummary[];
  reportingMonth: string;
  accountName?: string;
}

// Strongly typed table cell constructor with JetBrains Mono font
function makeCell(
  text: string | number,
  options?: {
    fill?: { color: string };
    color?: string;
    bold?: boolean;
    fontSize?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
    fontFace?: string;
  }
): PptxGenJS.TableCell {
  return {
    text: String(text),
    options: {
      fontFace: FONT,
      color: LIGHT.textPrimary,
      ...options,
    },
  };
}

/**
 * Modern PowerPoint Presentation Generator for EDR Executive Reports
 * Generates an executive 9-slide deck:
 * - Slide 1: High-impact dark cover slide
 * - Slides 2–9: Crisp modern light-mode slides with JetBrains Mono typography & light-mode styled charts
 */
export async function generateReportPowerPoint({
  analytics,
  months,
  reportingMonth,
  accountName = 'Classic Fashion Apparel',
}: GeneratePptxOptions): Promise<Blob> {
  const pptxModule = await import('pptxgenjs');
  const rawDefault = (pptxModule as Record<string, unknown>).default;
  const PptxGenJSClass = (
    typeof pptxModule === 'function'
      ? pptxModule
    : typeof rawDefault === 'function'
      ? rawDefault
    : typeof (rawDefault as Record<string, unknown>)?.default === 'function'
      ? (rawDefault as Record<string, unknown>).default
    : pptxModule
  ) as unknown as typeof PptxGenJS;

  const pres = new PptxGenJSClass();

  // Standard 16:9 widescreen layout (10" x 5.625")
  pres.layout = 'LAYOUT_16x9';

  const reportLabel = months.find((m) => m.key === reportingMonth)?.label ?? reportingMonth;
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const {
    kpis,
    classificationDist,
    analystVerdictDist,
    topEngines,
    alertTrend,
    top10Alerts,
    topEndpoints,
    siteRisks,
    recurringEndpoints,
    resolution,
    reconciliation,
    top5Classes,
    alertsByMonth,
    topThreatFiles,
    topOriginatingApps,
  } = analytics;

  const totalPages = 10;

  // Funnel calculations
  const totalDetected = kpis[0]?.value;
  const detected = typeof totalDetected === 'number' ? totalDetected : Number(totalDetected) || 0;
  const investigated = (resolution?.statusCounts || [])
    .filter((s) => !s.name.toLowerCase().includes('undefined') && !s.name.toLowerCase().includes('unknown'))
    .reduce((acc, s) => acc + s.value, 0);
  const resolved = (resolution?.statusCounts || []).find((s) => s.name.toLowerCase().includes('resolved'))?.value ?? 0;
  const actionTaken = Math.round((investigated + resolved) / 2);

  const coveragePct =
    reconciliation.totalAssets > 0
      ? `${Math.round((reconciliation.matched / reconciliation.totalAssets) * 100)}%`
      : '100%';

  // Helper for adding consistent Modern Light Slide Header
  const addLightSlideHeader = (
    slide: PptxGenJS.Slide,
    sectionCategory: string,
    title: string,
    subtitle?: string
  ) => {
    slide.background = { color: LIGHT.bgPage };

    // Left vivid accent pillar
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.5,
      y: 0.32,
      w: 0.08,
      h: 0.52,
      fill: { color: LIGHT.purple },
      rectRadius: 0.04,
    });

    // Category / Breadcrumb with Terminal Syntax
    slide.addText(`// ${sectionCategory.toUpperCase()}`, {
      x: 0.68,
      y: 0.3,
      w: 8.5,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: LIGHT.cyan,
      fontFace: FONT,
    });

    // Slide Main Title (Dark High-Contrast)
    slide.addText(title, {
      x: 0.68,
      y: 0.48,
      w: 8.5,
      h: 0.36,
      fontSize: 16,
      bold: true,
      color: LIGHT.textPrimary,
      fontFace: FONT,
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.68,
        y: 0.82,
        w: 8.8,
        h: 0.22,
        fontSize: 8.5,
        color: LIGHT.textSecondary,
        fontFace: FONT,
      });
    }

    // Top subtle divider line
    slide.addShape(pres.ShapeType.rect, {
      x: 0.5,
      y: subtitle ? 1.08 : 0.95,
      w: 9.0,
      h: 0.01,
      fill: { color: LIGHT.border },
    });
  };

  // Helper for adding consistent Modern Light Slide Footer
  const addLightSlideFooter = (slide: PptxGenJS.Slide, pageNum: number) => {
    // Bottom subtle divider line
    slide.addShape(pres.ShapeType.rect, {
      x: 0.5,
      y: 5.18,
      w: 9.0,
      h: 0.01,
      fill: { color: LIGHT.border },
    });

    slide.addText('[CONFIDENTIAL // INTERNAL SOC USE ONLY]', {
      x: 0.5,
      y: 5.25,
      w: 3.5,
      h: 0.25,
      fontSize: 7,
      color: LIGHT.textMuted,
      fontFace: FONT,
    });

    slide.addText('SentinelOne Singularity • Threat Intelligence Telemetry', {
      x: 3.5,
      y: 5.25,
      w: 4.0,
      h: 0.25,
      fontSize: 7,
      color: LIGHT.textMuted,
      align: 'center',
      fontFace: FONT,
    });

    slide.addText(`SLIDE ${String(pageNum).padStart(2, '0')} // ${String(totalPages).padStart(2, '0')}`, {
      x: 7.5,
      y: 5.25,
      w: 2.0,
      h: 0.25,
      fontSize: 7.5,
      bold: true,
      color: LIGHT.purple,
      align: 'right',
      fontFace: FONT,
    });
  };

  // ============================================================
  // SLIDE 1: EXECUTIVE COVER SLIDE (DARK COMMAND CENTER THEME)
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: DARK.bgBase };

    // Dual Glowing Neon Accent Lines
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.7,
      y: 0.55,
      w: 0.8,
      h: 0.05,
      fill: { color: DARK.purple },
      rectRadius: 0.03,
    });
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.55,
      y: 0.55,
      w: 0.4,
      h: 0.05,
      fill: { color: DARK.cyan },
      rectRadius: 0.03,
    });

    // Classification Badge (Cyber Chip)
    slide.addText('// RESTRICTED // SOC MANAGEMENT & EXECUTIVE BRIEFING', {
      x: 0.7,
      y: 0.82,
      w: 4.5,
      h: 0.28,
      fontSize: 7.5,
      bold: true,
      color: DARK.cyan,
      fontFace: FONT,
      fill: { color: DARK.bgCard },
      line: { color: DARK.border, width: 1 },
      rectRadius: 0.06,
      align: 'center',
      valign: 'middle',
    });

    // Main Cover Title
    slide.addText('MONTHLY EDR\nSECURITY REPORT', {
      x: 0.7,
      y: 1.3,
      w: 8.5,
      h: 1.25,
      fontSize: 32,
      bold: true,
      color: DARK.textWhite,
      fontFace: FONT,
      lineSpacing: 38,
    });

    // Subtitle
    slide.addText(
      'Executive Endpoint Threat Detection, Mitigation Velocities, and Infrastructure Asset Reconciliation Overview.',
      {
        x: 0.7,
        y: 2.65,
        w: 7.5,
        h: 0.45,
        fontSize: 10.5,
        color: DARK.textSecondary,
        fontFace: FONT,
      }
    );

    // Metadata Row
    const metaY = 3.25;
    slide.addShape(pres.ShapeType.rect, {
      x: 0.7,
      y: metaY,
      w: 8.6,
      h: 0.01,
      fill: { color: DARK.border },
    });

    const metaItems = [
      { label: 'REPORTING PERIOD', value: reportLabel, color: DARK.cyan },
      { label: 'TARGET ACCOUNT', value: accountName, color: DARK.textWhite },
      { label: 'EDR PLATFORM', value: 'SentinelOne Singularity', color: DARK.purple },
      { label: 'ANALYZED EVENTS', value: `${detected.toLocaleString()} Detections`, color: DARK.emerald },
    ];

    metaItems.forEach((m, idx) => {
      const xPos = 0.7 + idx * 2.15;
      slide.addText(
        [
          { text: `[${m.label}]\n`, options: { fontSize: 6.5, color: DARK.textMuted, bold: true } },
          { text: m.value, options: { fontSize: 9.5, color: m.color, bold: true } },
        ],
        { x: xPos, y: metaY + 0.1, w: 2.05, h: 0.5, fontFace: FONT }
      );
    });

    // Bottom Cyber KPI Cards Row
    const kpiY = 4.0;
    slide.addShape(pres.ShapeType.rect, {
      x: 0.7,
      y: kpiY,
      w: 8.6,
      h: 0.01,
      fill: { color: DARK.border },
    });

    const coverKpis = [
      { label: 'TOTAL INCIDENTS', value: detected.toLocaleString(), color: DARK.purple },
      { label: 'RESOLVED INCIDENTS', value: resolved.toLocaleString(), color: DARK.emerald },
      { label: 'MALICIOUS DETECTIONS', value: String(kpis[2]?.value ?? '0'), color: DARK.red },
      { label: 'EDR COVERAGE RATE', value: coveragePct, color: DARK.cyan },
    ];

    coverKpis.forEach((k, idx) => {
      const kX = 0.7 + idx * 2.18;
      // Background card
      slide.addShape(pres.ShapeType.roundRect, {
        x: kX,
        y: kpiY + 0.15,
        w: 2.08,
        h: 0.85,
        fill: { color: DARK.bgCard },
        line: { color: DARK.border, width: 1 },
        rectRadius: 0.06,
      });

      // Top colored indicator neon strip
      slide.addShape(pres.ShapeType.rect, {
        x: kX,
        y: kpiY + 0.15,
        w: 2.08,
        h: 0.03,
        fill: { color: k.color },
      });

      slide.addText(
        [
          { text: `${k.label}\n`, options: { fontSize: 6.5, color: DARK.textSecondary, bold: true } },
          { text: k.value, options: { fontSize: 16, color: k.color, bold: true } },
        ],
        { x: kX + 0.12, y: kpiY + 0.22, w: 1.85, h: 0.7, fontFace: FONT }
      );
    });

    // Cover Footer
    slide.addText(`TELEMETRY COMPILED: ${generatedDate}  •  AUTOMATED REPORT ENGINE v4.0  •  JETBRAINS MONO`, {
      x: 0.7,
      y: 5.2,
      w: 8.6,
      h: 0.25,
      fontSize: 7,
      color: DARK.textMuted,
      fontFace: FONT,
    });
  }

  // ============================================================
  // SLIDE 2: TABLE OF CONTENTS (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '01. CONTENTS',
      'Table of Contents & Executive Agenda',
      'Consolidated monthly cybersecurity telemetry captured by SentinelOne agents across enterprise endpoints.'
    );

    // Left Column: Agenda items list (8 sections)
    const agendaItems = [
      { num: '01', title: 'Executive Summary', desc: 'Key performance metrics, classification breakdown & verdict distribution' },
      { num: '02', title: 'Alert Analysis & MoM Trends', desc: 'Month-over-month telemetry comparison & high-frequency alerts' },
      { num: '03', title: 'Top Threat Files & Payloads', desc: 'High-frequency malicious binaries, payloads, and detection counts' },
      { num: '04', title: 'Endpoint Detections & Density', desc: 'Endpoints generating the highest threat & alert frequencies' },
      { num: '05', title: 'Regional Threat Hotspots', desc: 'Geographical and site-level alert volumes and risk scoring' },
      { num: '06', title: 'Persistent Risky Endpoints', desc: 'Endpoints exhibiting recurring detections across multiple cycles' },
      { num: '07', title: 'Incident Resolution Status', desc: 'Triage velocities, resolution status distributions & trends' },
      { num: '08', title: 'Asset Reconciliation', desc: 'Coverage alignment between IT asset inventory and active EDR agents' },
    ];

    const startY = 1.22;
    const itemH = 0.43;

    agendaItems.forEach((item, idx) => {
      const yPos = startY + idx * (itemH + 0.04);

      // White card container
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.5,
        y: yPos,
        w: 5.6,
        h: itemH,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.05,
      });

      // Number badge pill
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.6,
        y: yPos + 0.07,
        w: 0.38,
        h: 0.29,
        fill: { color: LIGHT.bgCardAlt },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.04,
      });
      slide.addText(item.num, {
        x: 0.6,
        y: yPos + 0.07,
        w: 0.38,
        h: 0.29,
        fontSize: 8,
        bold: true,
        color: LIGHT.purple,
        align: 'center',
        valign: 'middle',
        fontFace: FONT,
      });

      // Text Title & Desc
      slide.addText(
        [
          { text: `${item.title}  `, options: { fontSize: 8.5, bold: true, color: LIGHT.textPrimary } },
          { text: `— ${item.desc}`, options: { fontSize: 7.2, color: LIGHT.textSecondary } },
        ],
        { x: 1.08, y: yPos + 0.04, w: 4.8, h: itemH - 0.08, fontFace: FONT, valign: 'middle' }
      );
    });

    // Right Column: Scope & Security Notice Cards
    // Top Right Card: Scope Summary
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.3,
      y: 1.25,
      w: 3.2,
      h: 1.7,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// TELEMETRY SCOPE', {
      x: 6.5,
      y: 1.4,
      w: 2.8,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.cyan,
      fontFace: FONT,
    });

    slide.addText(
      [
        { text: '• REPORTING CYCLE: ', options: { bold: true, color: LIGHT.textPrimary } },
        { text: `${reportLabel}\n`, options: { color: LIGHT.textSecondary } },
        { text: '• EVENTS CAPTURED: ', options: { bold: true, color: LIGHT.textPrimary } },
        { text: `${detected.toLocaleString()} detections\n`, options: { color: LIGHT.purple, bold: true } },
        { text: '• ACTIVE HOSTS: ', options: { bold: true, color: LIGHT.textPrimary } },
        { text: `${kpis[3]?.value ?? topEndpoints.length} monitored\n`, options: { color: LIGHT.textSecondary } },
        { text: '• EDR MATCH RATE: ', options: { bold: true, color: LIGHT.textPrimary } },
        { text: `${coveragePct} Protected\n`, options: { color: LIGHT.emerald, bold: true } },
      ],
      { x: 6.5, y: 1.7, w: 2.8, h: 1.1, fontSize: 8, fontFace: FONT, lineSpacing: 16 }
    );

    // Bottom Right Card: Security Notice
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.3,
      y: 3.1,
      w: 3.2,
      h: 1.95,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    // Left purple accent stripe
    slide.addShape(pres.ShapeType.rect, {
      x: 6.3,
      y: 3.1,
      w: 0.06,
      h: 1.95,
      fill: { color: LIGHT.purple },
    });

    slide.addText('// COMPLIANCE PROTOCOL', {
      x: 6.55,
      y: 3.25,
      w: 2.75,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.purple,
      fontFace: FONT,
    });

    slide.addText(
      'All metrics represent point-in-time endpoint telemetry. Detections tagged as True Positive and persistent risky hosts must be escalated according to Incident Response SOP §4.2.\n\nStrict confidentiality: Access is restricted to designated security operations leadership.',
      {
        x: 6.55,
        y: 3.55,
        w: 2.75,
        h: 1.35,
        fontSize: 7.5,
        color: LIGHT.textSecondary,
        fontFace: FONT,
        lineSpacing: 13,
      }
    );

    addLightSlideFooter(slide, 2);
  }

  // ============================================================
  // SLIDE 3: EXECUTIVE SUMMARY & THREAT LANDSCAPE (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '02. EXECUTIVE SUMMARY',
      'Executive Summary & Threat Landscape',
      'High-level operational overview, classification distributions, and engine detection telemetry.'
    );

    // 4 KPI Cards across top (Pure White with Light Borders)
    const kpiCards = [
      { label: String(kpis[0]?.label || 'Total Detections'), value: String(kpis[0]?.value || detected), prev: kpis[0]?.previous, color: LIGHT.purple },
      { label: String(kpis[1]?.label || 'Resolved Incidents'), value: String(kpis[1]?.value || resolved), prev: kpis[1]?.previous, color: LIGHT.emerald },
      { label: String(kpis[2]?.label || 'Malicious Detections'), value: String(kpis[2]?.value || '0'), prev: kpis[2]?.previous, color: LIGHT.red },
      { label: String(kpis[3]?.label || 'Active Endpoints'), value: String(kpis[3]?.value || '0'), prev: kpis[3]?.previous, color: LIGHT.cyan },
    ];

    kpiCards.forEach((k, idx) => {
      const cardX = 0.5 + idx * 2.28;
      // White Card
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX,
        y: 1.15,
        w: 2.18,
        h: 0.88,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.05,
      });

      // Top colored indicator neon bar
      slide.addShape(pres.ShapeType.rect, {
        x: cardX,
        y: 1.15,
        w: 2.18,
        h: 0.03,
        fill: { color: k.color },
      });

      slide.addText(
        [
          { text: `${k.label.toUpperCase()}\n`, options: { fontSize: 6.5, color: LIGHT.textMuted, bold: true } },
          { text: `${k.value}\n`, options: { fontSize: 16, color: LIGHT.textPrimary, bold: true } },
          { text: k.prev ? `vs Prev: ${k.prev}` : 'Current Reporting Cycle', options: { fontSize: 6.5, color: LIGHT.textSecondary } },
        ],
        { x: cardX + 0.1, y: 1.24, w: 1.98, h: 0.74, fontFace: FONT }
      );
    });

    // Bottom Left: Alert Classification Modern Light Horizontal Bar Chart
    const leftCardX = 0.5;
    const leftCardY = 2.15;
    const leftCardW = 4.7;
    const leftCardH = 2.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftCardX,
      y: leftCardY,
      w: leftCardW,
      h: leftCardH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// ALERT CLASSIFICATION BREAKDOWN', {
      x: leftCardX + 0.2,
      y: leftCardY + 0.12,
      w: 4.3,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.purple,
      fontFace: FONT,
    });

    const topClasses = classificationDist.slice(0, 7);
    if (topClasses.length > 0) {
      slide.addChart(
        pres.ChartType.bar,
        [
          {
            name: 'Incidents',
            labels: topClasses.map((c) => (c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name)),
            values: topClasses.map((c) => c.value),
          },
        ],
        {
          x: leftCardX + 0.1,
          y: leftCardY + 0.38,
          w: leftCardW - 0.2,
          h: leftCardH - 0.45,
          barDir: 'bar',
          barGapWidthPct: 50,
          chartColors: [LIGHT.purple],
          showValue: true,
          showLegend: false,
          dataLabelColor: LIGHT.textPrimary,
          dataLabelFontFace: FONT,
          dataLabelFontSize: 7.5,
          dataLabelFontBold: true,
          catAxisLabelColor: LIGHT.textSecondary,
          catAxisLabelFontFace: FONT,
          catAxisLabelFontSize: 7,
          valAxisLabelColor: LIGHT.textMuted,
          valAxisLabelFontFace: FONT,
          valAxisLabelFontSize: 7,
          valGridLine: { color: LIGHT.gridLine, size: 0.75, style: 'dash' },
        }
      );
    }

    // Bottom Right: Analyst Verdict Distribution + Top Detecting Engines (Light Mode)
    const rightCardX = 5.35;
    const rightCardY = 2.15;
    const rightCardW = 4.15;
    const rightCardH = 2.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightCardX,
      y: rightCardY,
      w: rightCardW,
      h: rightCardH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// VERDICT & DETECTING ENGINES', {
      x: rightCardX + 0.2,
      y: rightCardY + 0.12,
      w: 3.75,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.cyan,
      fontFace: FONT,
    });

    // 4 verdict chips (Light Mode)
    const totalVerdictCount = analystVerdictDist.reduce((acc, v) => acc + v.value, 0) || 1;
    const verdictSlice = analystVerdictDist.slice(0, 4);

    verdictSlice.forEach((v, vi) => {
      const vCol = vi % 2;
      const vRow = Math.floor(vi / 2);
      const vX = rightCardX + 0.2 + vCol * 1.9;
      const vY = rightCardY + 0.45 + vRow * 0.55;
      const pct = Math.round((v.value / totalVerdictCount) * 100);

      slide.addShape(pres.ShapeType.roundRect, {
        x: vX,
        y: vY,
        w: 1.8,
        h: 0.48,
        fill: { color: LIGHT.bgCardAlt },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.04,
      });

      // Semantic pip color
      const pipColor =
        VERDICT_LIGHT_COLORS[v.name.toLowerCase().trim()] ||
        (vi === 0 ? LIGHT.red : vi === 1 ? LIGHT.amber : vi === 2 ? LIGHT.emerald : LIGHT.purple);

      slide.addShape(pres.ShapeType.rect, {
        x: vX,
        y: vY,
        w: 0.04,
        h: 0.48,
        fill: { color: pipColor },
      });

      slide.addText(
        [
          { text: `${v.name.slice(0, 15)}\n`, options: { fontSize: 7, color: LIGHT.textSecondary, bold: true } },
          { text: `${v.value.toLocaleString()} `, options: { fontSize: 8.5, bold: true, color: pipColor } },
          { text: `(${pct}%)`, options: { fontSize: 7, color: LIGHT.textMuted } },
        ],
        { x: vX + 0.1, y: vY + 0.03, w: 1.65, h: 0.42, fontFace: FONT, valign: 'middle' }
      );
    });

    // Detecting Engines Table (Light Mode)
    slide.addText('[TOP DETECTING ENGINES]', {
      x: rightCardX + 0.2,
      y: rightCardY + 1.62,
      w: 3.75,
      h: 0.2,
      fontSize: 7.5,
      bold: true,
      color: LIGHT.textSecondary,
      fontFace: FONT,
    });

    const engineRows: PptxGenJS.TableRow[] = [
      [
        makeCell('ENGINE NAME', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7 }),
        makeCell('DETECTIONS', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
      ],
      ...topEngines.slice(0, 4).map((eng, ei) => [
        makeCell(eng.name.length > 24 ? eng.name.slice(0, 24) + '…' : eng.name, { fill: { color: ei % 2 === 1 ? LIGHT.bgCardAlt : LIGHT.bgCard }, color: LIGHT.textPrimary, fontSize: 7 }),
        makeCell(eng.value.toLocaleString(), { fill: { color: ei % 2 === 1 ? LIGHT.bgCardAlt : LIGHT.bgCard }, color: LIGHT.purple, fontSize: 7, align: 'right', bold: true }),
      ]),
    ];

    slide.addTable(engineRows, {
      x: rightCardX + 0.2,
      y: rightCardY + 1.86,
      w: 3.75,
      colW: [2.75, 1.0],
      border: { type: 'solid', pt: 0.5, color: LIGHT.border },
    });

    addLightSlideFooter(slide, 3);
  }

  // ============================================================
  // SLIDE 4: ALERT ANALYSIS (MONTH-OVER-MONTH) (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '03. ALERT TELEMETRY',
      'Alert Analysis — Month-over-Month Trends',
      'Comparative telemetry across monthly cycles detailing trajectory and shift in threat classifications.'
    );

    const hasMultiMonth = alertsByMonth && alertsByMonth.length > 1;

    // Left Column: Modern Light Line Chart or Bar Chart
    const leftX = 0.5;
    const leftY = 1.15;
    const leftW = 4.6;
    const leftH = 3.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: leftY,
      w: leftW,
      h: leftH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    if (hasMultiMonth && top5Classes && top5Classes.length > 0) {
      slide.addText('// MOM TRAJECTORY (TOP CLASSIFICATIONS)', {
        x: leftX + 0.2,
        y: leftY + 0.15,
        w: 4.2,
        h: 0.25,
        fontSize: 9.5,
        bold: true,
        color: LIGHT.purple,
        fontFace: FONT,
      });

      const lineSeries = top5Classes.slice(0, 4).map((cls) => ({
        name: cls.length > 18 ? cls.slice(0, 18) + '…' : cls,
        labels: alertsByMonth.map((m) => m.month),
        values: alertsByMonth.map((m) => (typeof m[cls] === 'number' ? (m[cls] as number) : 0)),
      }));

      slide.addChart(pres.ChartType.line, lineSeries, {
        x: leftX + 0.15,
        y: leftY + 0.45,
        w: leftW - 0.3,
        h: leftH - 0.6,
        chartColors: LIGHT_CHART_COLORS.slice(0, 4),
        lineSmooth: true,
        lineDataSymbol: 'circle',
        lineDataSymbolSize: 6,
        showLegend: true,
        legendPos: 'b',
        legendColor: LIGHT.textPrimary,
        legendFontFace: FONT,
        legendFontSize: 7,
        catAxisLabelColor: LIGHT.textSecondary,
        catAxisLabelFontFace: FONT,
        catAxisLabelFontSize: 7,
        valAxisLabelColor: LIGHT.textMuted,
        valAxisLabelFontFace: FONT,
        valAxisLabelFontSize: 7,
        valGridLine: { color: LIGHT.gridLine, size: 0.75, style: 'dash' },
      });
    } else {
      // Single month fallback: Top Common Alert Types Light Bar Chart
      slide.addText('// TOP COMMON ALERT TYPES', {
        x: leftX + 0.2,
        y: leftY + 0.15,
        w: 4.2,
        h: 0.25,
        fontSize: 9.5,
        bold: true,
        color: LIGHT.cyan,
        fontFace: FONT,
      });

      const topAlertsSlice = top10Alerts.slice(0, 7);
      slide.addChart(
        pres.ChartType.bar,
        [
          {
            name: 'Alerts',
            labels: topAlertsSlice.map((a) => (a.name.length > 20 ? a.name.slice(0, 20) + '…' : a.name)),
            values: topAlertsSlice.map((a) => a.value),
          },
        ],
        {
          x: leftX + 0.15,
          y: leftY + 0.45,
          w: leftW - 0.3,
          h: leftH - 0.6,
          barDir: 'bar',
          barGapWidthPct: 50,
          chartColors: [LIGHT.cyan],
          showValue: true,
          showLegend: false,
          dataLabelColor: LIGHT.textPrimary,
          dataLabelFontFace: FONT,
          dataLabelFontSize: 7,
          dataLabelFontBold: true,
          catAxisLabelColor: LIGHT.textSecondary,
          catAxisLabelFontFace: FONT,
          catAxisLabelFontSize: 7,
          valAxisLabelColor: LIGHT.textMuted,
          valAxisLabelFontFace: FONT,
          valAxisLabelFontSize: 7,
          valGridLine: { color: LIGHT.gridLine, size: 0.75, style: 'dash' },
        }
      );
    }

    // Right Column: Month-over-Month Change Detail Table (Light Mode)
    const rightX = 5.25;
    const rightY = 1.15;
    const rightW = 4.25;
    const rightH = 3.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// MOM DELTA & VARIANCE DETAIL', {
      x: rightX + 0.2,
      y: rightY + 0.15,
      w: 3.85,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.cyan,
      fontFace: FONT,
    });

    const momRows: PptxGenJS.TableRow[] = [
      [
        makeCell('CLASSIFICATION', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7 }),
        makeCell('CURRENT', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('PREV', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('DELTA', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('CHANGE', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
      ],
      ...alertTrend.slice(0, 8).map((r, ri) => {
        const isUp = r.delta > 0;
        const deltaColor = isUp ? LIGHT.red : r.delta < 0 ? LIGHT.emerald : LIGHT.textSecondary;
        const rowBg = ri % 2 === 1 ? LIGHT.bgCardAlt : LIGHT.bgCard;
        return [
          makeCell(r.classification.length > 18 ? r.classification.slice(0, 18) + '…' : r.classification, { fill: { color: rowBg }, color: LIGHT.textPrimary, fontSize: 7 }),
          makeCell(r.current.toLocaleString(), { fill: { color: rowBg }, color: LIGHT.textPrimary, fontSize: 7, align: 'right', bold: true }),
          makeCell(r.previous.toLocaleString(), { fill: { color: rowBg }, color: LIGHT.textMuted, fontSize: 7, align: 'right' }),
          makeCell(r.delta > 0 ? `+${r.delta}` : String(r.delta), { fill: { color: rowBg }, color: deltaColor, fontSize: 7, align: 'right', bold: true }),
          makeCell(`${r.deltaPercent > 0 ? '+' : ''}${r.deltaPercent}%`, { fill: { color: rowBg }, color: deltaColor, fontSize: 7, align: 'right', bold: true }),
        ];
      }),
    ];

    slide.addTable(momRows, {
      x: rightX + 0.15,
      y: rightY + 0.45,
      w: rightW - 0.3,
      colW: [1.65, 0.55, 0.55, 0.55, 0.65],
      border: { type: 'solid', pt: 0.5, color: LIGHT.border },
    });

    addLightSlideFooter(slide, 4);
  }

  // ============================================================
  // SLIDE 5: TOP THREAT FILES & PAYLOADS (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '04. THREAT INTELLIGENCE',
      'Top Threat Files & Payloads',
      'High-frequency binaries, malicious payloads, and target execution telemetry ranked by detection count.'
    );

    const threatFiles = (topThreatFiles || []).filter((f) => f && f.fileName);
    const totalThreatDetections = threatFiles.reduce((acc, f) => acc + (f.count || 0), 0);
    const topFile = threatFiles[0];
    const topPayloadName = topFile?.fileName || 'None Detected';
    const topPayloadCount = topFile?.count ?? 0;
    const topApp = (topOriginatingApps || [])[0];

    // 4 KPI Summary Cards across top (Light Mode)
    const kpiCards = [
      {
        label: 'ACTIVE THREAT FILES',
        value: `${threatFiles.length} Binaries`,
        sub: 'Unique payload files',
        color: LIGHT.purple,
      },
      {
        label: 'TOTAL FILE DETECTIONS',
        value: totalThreatDetections.toLocaleString(),
        sub: 'Aggregated hit count',
        color: LIGHT.red,
      },
      {
        label: 'TOP THREAT PAYLOAD',
        value: `${topPayloadCount.toLocaleString()} Detections`,
        sub: topPayloadName.length > 22 ? topPayloadName.slice(0, 22) + '…' : topPayloadName,
        color: LIGHT.rose,
      },
      {
        label: 'TOP EXECUTION VECTOR',
        value: topApp ? (topApp.appName.length > 16 ? topApp.appName.slice(0, 16) + '…' : topApp.appName) : (topFile?.topEndpoint || 'N/A'),
        sub: topApp ? `${topApp.count.toLocaleString()} originating hits` : 'Target host vector',
        color: LIGHT.cyan,
      },
    ];

    const kpiY = 1.15;
    kpiCards.forEach((k, idx) => {
      const kX = 0.5 + idx * 2.28;
      // White Card Container
      slide.addShape(pres.ShapeType.roundRect, {
        x: kX,
        y: kpiY,
        w: 2.18,
        h: 0.72,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.05,
      });

      // Top colored indicator bar
      slide.addShape(pres.ShapeType.rect, {
        x: kX,
        y: kpiY,
        w: 2.18,
        h: 0.03,
        fill: { color: k.color },
      });

      slide.addText(
        [
          { text: `${k.label}\n`, options: { fontSize: 6.2, color: LIGHT.textMuted, bold: true } },
          { text: `${k.value}\n`, options: { fontSize: 13, color: k.color, bold: true } },
          { text: k.sub, options: { fontSize: 6.5, color: LIGHT.textSecondary } },
        ],
        { x: kX + 0.1, y: kpiY + 0.08, w: 1.98, h: 0.6, fontFace: FONT }
      );
    });

    if (threatFiles.length === 0) {
      // Empty state
      slide.addShape(pres.ShapeType.roundRect, {
        x: 1.5,
        y: 2.3,
        w: 7.0,
        h: 2.0,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.08,
      });
      slide.addText('✓ ZERO ACTIVE THREAT PAYLOADS DETECTED', {
        x: 1.5,
        y: 2.7,
        w: 7.0,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: LIGHT.emerald,
        align: 'center',
        fontFace: FONT,
      });
      slide.addText(
        'No high-frequency binaries, scripts, or malicious payload files were flagged during this reporting cycle.',
        {
          x: 1.8,
          y: 3.1,
          w: 6.4,
          h: 0.4,
          fontSize: 8.5,
          color: LIGHT.textSecondary,
          align: 'center',
          fontFace: FONT,
        }
      );
    } else {
      const contentY = 1.98;
      const contentH = 3.1;

      // Left Column: Horizontal Bar Chart of Top Payloads by Detection Count
      const leftX = 0.5;
      const leftW = 4.4;

      slide.addShape(pres.ShapeType.roundRect, {
        x: leftX,
        y: contentY,
        w: leftW,
        h: contentH,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.06,
      });

      slide.addText('// PAYLOAD DETECTION FREQUENCY', {
        x: leftX + 0.2,
        y: contentY + 0.12,
        w: 4.0,
        h: 0.22,
        fontSize: 9.5,
        bold: true,
        color: LIGHT.rose,
        fontFace: FONT,
      });

      slide.addText('Top binaries ranked by aggregate detection count', {
        x: leftX + 0.2,
        y: contentY + 0.32,
        w: 4.0,
        h: 0.18,
        fontSize: 7,
        color: LIGHT.textMuted,
        fontFace: FONT,
      });

      const chartSlice = threatFiles.slice(0, 6);
      if (chartSlice.length > 0) {
        slide.addChart(
          pres.ChartType.bar,
          [
            {
              name: 'Detections',
              labels: chartSlice.map((f) => (f.fileName.length > 18 ? f.fileName.slice(0, 18) + '…' : f.fileName)),
              values: chartSlice.map((f) => f.count),
            },
          ],
          {
            x: leftX + 0.15,
            y: contentY + 0.52,
            w: leftW - 0.3,
            h: contentH - 1.05,
            barDir: 'bar',
            barGapWidthPct: 45,
            chartColors: [LIGHT.rose],
            showValue: true,
            showLegend: false,
            dataLabelColor: LIGHT.textPrimary,
            dataLabelFontFace: FONT,
            dataLabelFontSize: 7,
            dataLabelFontBold: true,
            catAxisLabelColor: LIGHT.textSecondary,
            catAxisLabelFontFace: FONT,
            catAxisLabelFontSize: 6.8,
            valAxisLabelColor: LIGHT.textMuted,
            valAxisLabelFontFace: FONT,
            valAxisLabelFontSize: 6.8,
            valGridLine: { color: LIGHT.gridLine, size: 0.75, style: 'dash' },
          }
        );
      }

      // Execution context badge footer under chart
      slide.addShape(pres.ShapeType.roundRect, {
        x: leftX + 0.15,
        y: contentY + contentH - 0.44,
        w: leftW - 0.3,
        h: 0.34,
        fill: { color: LIGHT.bgCardAlt },
        line: { color: LIGHT.border, width: 0.75 },
        rectRadius: 0.03,
      });

      slide.addText(
        `⚡ Top Host: ${topFile?.topEndpoint || 'N/A'} • Class: ${topFile?.classifications[0] || 'Malicious'} • ${topFile?.count ?? 0} hits`,
        {
          x: leftX + 0.22,
          y: contentY + contentH - 0.43,
          w: leftW - 0.44,
          h: 0.32,
          fontSize: 6.5,
          color: LIGHT.textSecondary,
          fontFace: FONT,
          valign: 'middle',
        }
      );

      // Right Column: Ranked Threat Files & Payloads Table
      const rightX = 5.05;
      const rightW = 4.45;

      slide.addShape(pres.ShapeType.roundRect, {
        x: rightX,
        y: contentY,
        w: rightW,
        h: contentH,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.06,
      });

      slide.addText('// RANKED THREAT FILES & PAYLOADS', {
        x: rightX + 0.2,
        y: contentY + 0.12,
        w: 4.0,
        h: 0.22,
        fontSize: 9.5,
        bold: true,
        color: LIGHT.purple,
        fontFace: FONT,
      });

      slide.addText('Telemetry metrics including detection count & target host', {
        x: rightX + 0.2,
        y: contentY + 0.32,
        w: 4.0,
        h: 0.18,
        fontSize: 7,
        color: LIGHT.textMuted,
        fontFace: FONT,
      });

      const threatTableRows: PptxGenJS.TableRow[] = [
        [
          makeCell('RANK', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 6.8, align: 'center' }),
          makeCell('FILE / PAYLOAD', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 6.8 }),
          makeCell('CLASSIFICATION', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 6.8 }),
          makeCell('TARGET HOST', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 6.8 }),
          makeCell('DETECTIONS', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 6.8, align: 'right' }),
        ],
        ...threatFiles.slice(0, 7).map((f, idx) => {
          const rowBg = idx % 2 === 1 ? LIGHT.bgCardAlt : LIGHT.bgCard;
          const isHigh = f.count >= 10;
          const primaryClass = f.classifications[0] || 'Malware';
          return [
            makeCell(`#${idx + 1}`, { fill: { color: rowBg }, color: LIGHT.textMuted, fontSize: 6.5, align: 'center', bold: true }),
            makeCell(f.fileName.length > 20 ? f.fileName.slice(0, 20) + '…' : f.fileName, {
              fill: { color: rowBg },
              color: LIGHT.textPrimary,
              fontSize: 6.5,
              bold: true,
            }),
            makeCell(primaryClass.length > 15 ? primaryClass.slice(0, 15) + '…' : primaryClass, {
              fill: { color: rowBg },
              color: LIGHT.cyan,
              fontSize: 6.5,
              bold: true,
            }),
            makeCell(f.topEndpoint.length > 14 ? f.topEndpoint.slice(0, 14) + '…' : f.topEndpoint, {
              fill: { color: rowBg },
              color: LIGHT.textSecondary,
              fontSize: 6.5,
            }),
            makeCell(f.count.toLocaleString(), {
              fill: { color: rowBg },
              color: isHigh ? LIGHT.red : LIGHT.purple,
              fontSize: 6.8,
              align: 'right',
              bold: true,
            }),
          ];
        }),
      ];

      slide.addTable(threatTableRows, {
        x: rightX + 0.15,
        y: contentY + 0.54,
        w: rightW - 0.3,
        colW: [0.45, 1.45, 1.05, 0.75, 0.45],
        border: { type: 'solid', pt: 0.5, color: LIGHT.border },
      });
    }

    addLightSlideFooter(slide, 5);
  }

  // ============================================================
  // SLIDE 6: ENDPOINT DETECTIONS & DENSITY (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '05. ENDPOINT TELEMETRY',
      'Top Endpoints by Detection Density',
      'Endpoints exhibiting the highest concentration of threat activity and security telemetry during the reporting period.'
    );

    // Callout note banner across top (Light Amber Alert)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.5,
      y: 1.15,
      w: 9.0,
      h: 0.38,
      fill: { color: LIGHT.chipAmberBg },
      line: { color: LIGHT.chipAmberBorder, width: 1 },
      rectRadius: 0.04,
    });

    slide.addText(
      '⚠ SOC ACTION ALERT // Endpoints generating over 50 detections indicate aggressive automation, lateral movement, or malware infection requiring containment.',
      {
        x: 0.65,
        y: 1.18,
        w: 8.7,
        h: 0.3,
        fontSize: 7.5,
        color: LIGHT.chipAmberText,
        bold: true,
        fontFace: FONT,
        valign: 'middle',
      }
    );

    // Left Column: Horizontal Bar Chart of Top Endpoints (Light Mode)
    const leftX = 0.5;
    const leftY = 1.62;
    const leftW = 4.6;
    const leftH = 3.45;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: leftY,
      w: leftW,
      h: leftH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// TOP DETECTED HOSTNAMES', {
      x: leftX + 0.2,
      y: leftY + 0.12,
      w: 4.2,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.purple,
      fontFace: FONT,
    });

    const endpointSlice = topEndpoints.slice(0, 8);
    if (endpointSlice.length > 0) {
      slide.addChart(
        pres.ChartType.bar,
        [
          {
            name: 'Detections',
            labels: endpointSlice.map((e) => (e.endpoint.length > 18 ? e.endpoint.slice(0, 18) + '…' : e.endpoint)),
            values: endpointSlice.map((e) => e.count),
          },
        ],
        {
          x: leftX + 0.15,
          y: leftY + 0.4,
          w: leftW - 0.3,
          h: leftH - 0.5,
          barDir: 'bar',
          barGapWidthPct: 50,
          chartColors: [LIGHT.purple],
          showValue: true,
          showLegend: false,
          dataLabelColor: LIGHT.textPrimary,
          dataLabelFontFace: FONT,
          dataLabelFontSize: 7,
          dataLabelFontBold: true,
          catAxisLabelColor: LIGHT.textSecondary,
          catAxisLabelFontFace: FONT,
          catAxisLabelFontSize: 7,
          valAxisLabelColor: LIGHT.textMuted,
          valAxisLabelFontFace: FONT,
          valAxisLabelFontSize: 7,
          valGridLine: { color: LIGHT.gridLine, size: 0.75, style: 'dash' },
        }
      );
    }

    // Right Column: Endpoint Density Table (Light Mode)
    const rightX = 5.25;
    const rightY = 1.62;
    const rightW = 4.25;
    const rightH = 3.45;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// RANKED HOST TELEMETRY & CONTAINMENT', {
      x: rightX + 0.2,
      y: rightY + 0.12,
      w: 3.85,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.cyan,
      fontFace: FONT,
    });

    const endpointTableRows: PptxGenJS.TableRow[] = [
      [
        makeCell('RANK', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'center' }),
        makeCell('ENDPOINT HOST', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7 }),
        makeCell('INCIDENTS', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('ACTION TIER', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'center' }),
      ],
      ...topEndpoints.slice(0, 8).map((ep, idx) => {
        const rowBg = idx % 2 === 1 ? LIGHT.bgCardAlt : LIGHT.bgCard;
        const isUrgent = ep.count >= 50;
        return [
          makeCell(`#${idx + 1}`, { fill: { color: rowBg }, color: LIGHT.textMuted, fontSize: 7, align: 'center', bold: true }),
          makeCell(ep.endpoint.length > 22 ? ep.endpoint.slice(0, 22) + '…' : ep.endpoint, { fill: { color: rowBg }, color: LIGHT.textPrimary, fontSize: 7, bold: true }),
          makeCell(ep.count.toLocaleString(), { fill: { color: rowBg }, color: isUrgent ? LIGHT.red : LIGHT.purple, fontSize: 7, align: 'right', bold: true }),
          makeCell(isUrgent ? 'ISOLATE HOST' : 'MONITOR & SCAN', {
            fill: { color: rowBg },
            color: isUrgent ? LIGHT.red : LIGHT.teal,
            fontSize: 6.5,
            align: 'center',
            bold: true,
          }),
        ];
      }),
    ];

    slide.addTable(endpointTableRows, {
      x: rightX + 0.15,
      y: rightY + 0.42,
      w: rightW - 0.3,
      colW: [0.55, 1.85, 0.75, 1.0],
      border: { type: 'solid', pt: 0.5, color: LIGHT.border },
    });

    addLightSlideFooter(slide, 6);
  }

  // ============================================================
  // SLIDE 7: REGIONAL THREAT HOTSPOTS (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '06. REGIONAL RISK',
      'Regional Threat Hotspots & Site Velocities',
      'Geographical distribution of incident activity and site-level risk scoring across corporate offices.'
    );

    // Left Column: Site Volume Bar Chart (Light Mode)
    const leftX = 0.5;
    const leftY = 1.15;
    const leftW = 4.6;
    const leftH = 3.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: leftY,
      w: leftW,
      h: leftH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// INCIDENT VOLUME BY SITE LOCATION', {
      x: leftX + 0.2,
      y: leftY + 0.15,
      w: 4.2,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.cyan,
      fontFace: FONT,
    });

    const topSites = siteRisks.slice(0, 7);
    if (topSites.length > 0) {
      slide.addChart(
        pres.ChartType.bar,
        [
          {
            name: 'Incidents',
            labels: topSites.map((s) => (s.site.length > 18 ? s.site.slice(0, 18) + '…' : s.site)),
            values: topSites.map((s) => s.current),
          },
        ],
        {
          x: leftX + 0.15,
          y: leftY + 0.45,
          w: leftW - 0.3,
          h: leftH - 0.6,
          barDir: 'bar',
          barGapWidthPct: 50,
          chartColors: [LIGHT.cyan],
          showValue: true,
          showLegend: false,
          dataLabelColor: LIGHT.textPrimary,
          dataLabelFontFace: FONT,
          dataLabelFontSize: 7,
          dataLabelFontBold: true,
          catAxisLabelColor: LIGHT.textSecondary,
          catAxisLabelFontFace: FONT,
          catAxisLabelFontSize: 7,
          valAxisLabelColor: LIGHT.textMuted,
          valAxisLabelFontFace: FONT,
          valAxisLabelFontSize: 7,
          valGridLine: { color: LIGHT.gridLine, size: 0.75, style: 'dash' },
        }
      );
    }

    // Right Column: Site Risk Scores Table (Light Mode)
    const rightX = 5.25;
    const rightY = 1.15;
    const rightW = 4.25;
    const rightH = 3.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// SITE RISK SCORES & VELOCITY', {
      x: rightX + 0.2,
      y: rightY + 0.15,
      w: 3.85,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.purple,
      fontFace: FONT,
    });

    const siteRows: PptxGenJS.TableRow[] = [
      [
        makeCell('SITE / OFFICE', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7 }),
        makeCell('CURRENT', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('PREV', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('DELTA', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('RISK SCORE', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
      ],
      ...siteRisks.slice(0, 8).map((s, si) => {
        const rowBg = si % 2 === 1 ? LIGHT.bgCardAlt : LIGHT.bgCard;
        const isUp = s.delta > 0;
        return [
          makeCell(s.site.length > 18 ? s.site.slice(0, 18) + '…' : s.site, { fill: { color: rowBg }, color: LIGHT.textPrimary, fontSize: 7 }),
          makeCell(s.current.toLocaleString(), { fill: { color: rowBg }, color: LIGHT.textPrimary, fontSize: 7, align: 'right' }),
          makeCell(s.previous.toLocaleString(), { fill: { color: rowBg }, color: LIGHT.textMuted, fontSize: 7, align: 'right' }),
          makeCell(s.delta > 0 ? `+${s.delta}` : String(s.delta), { fill: { color: rowBg }, color: isUp ? LIGHT.red : LIGHT.emerald, fontSize: 7, align: 'right', bold: true }),
          makeCell(String(s.riskScore), { fill: { color: rowBg }, color: s.riskScore > 60 ? LIGHT.red : LIGHT.cyan, fontSize: 7, align: 'right', bold: true }),
        ];
      }),
    ];

    slide.addTable(siteRows, {
      x: rightX + 0.15,
      y: rightY + 0.45,
      w: rightW - 0.3,
      colW: [1.65, 0.6, 0.6, 0.6, 0.7],
      border: { type: 'solid', pt: 0.5, color: LIGHT.border },
    });

    addLightSlideFooter(slide, 7);
  }

  // ============================================================
  // SLIDE 8: PERSISTENT RISKY ENDPOINTS (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '07. PERSISTENT THREATS',
      'Persistent & Chronic Risky Endpoints',
      'Endpoints repeatedly flagged across multiple consecutive months indicating unpatched vulnerabilities or chronic malware.'
    );

    if (recurringEndpoints.length === 0) {
      // Clean Empty State (Light Mode)
      slide.addShape(pres.ShapeType.roundRect, {
        x: 1.5,
        y: 1.8,
        w: 7.0,
        h: 2.2,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.08,
      });

      slide.addText('✓ ZERO PERSISTENT RISKY ENDPOINTS DETECTED', {
        x: 1.7,
        y: 2.2,
        w: 6.6,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: LIGHT.emerald,
        align: 'center',
        fontFace: FONT,
      });

      slide.addText(
        'Zero endpoints exhibited recurring detection anomalies across consecutive reporting months. All identified threats were resolved within single operational cycles.',
        {
          x: 2.0,
          y: 2.7,
          w: 6.0,
          h: 0.8,
          fontSize: 9,
          color: LIGHT.textSecondary,
          align: 'center',
          fontFace: FONT,
          lineSpacing: 16,
        }
      );
    } else {
      // Left Column: Bar chart of recurring endpoints (Light Mode)
      const leftX = 0.5;
      const leftY = 1.15;
      const leftW = 4.6;
      const leftH = 3.9;

      slide.addShape(pres.ShapeType.roundRect, {
        x: leftX,
        y: leftY,
        w: leftW,
        h: leftH,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.06,
      });

      slide.addText('// CUMULATIVE CHRONIC DETECTIONS', {
        x: leftX + 0.2,
        y: leftY + 0.15,
        w: 4.2,
        h: 0.25,
        fontSize: 9.5,
        bold: true,
        color: LIGHT.red,
        fontFace: FONT,
      });

      const recurringSlice = recurringEndpoints.slice(0, 7);
      slide.addChart(
        pres.ChartType.bar,
        [
          {
            name: 'Total Incidents',
            labels: recurringSlice.map((e) => (e.endpoint.length > 18 ? e.endpoint.slice(0, 18) + '…' : e.endpoint)),
            values: recurringSlice.map((e) => e.totalIncidents),
          },
        ],
        {
          x: leftX + 0.15,
          y: leftY + 0.45,
          w: leftW - 0.3,
          h: leftH - 0.6,
          barDir: 'bar',
          barGapWidthPct: 50,
          chartColors: [LIGHT.red],
          showValue: true,
          showLegend: false,
          dataLabelColor: LIGHT.textPrimary,
          dataLabelFontFace: FONT,
          dataLabelFontSize: 7,
          dataLabelFontBold: true,
          catAxisLabelColor: LIGHT.textSecondary,
          catAxisLabelFontFace: FONT,
          catAxisLabelFontSize: 7,
          valAxisLabelColor: LIGHT.textMuted,
          valAxisLabelFontFace: FONT,
          valAxisLabelFontSize: 7,
          valGridLine: { color: LIGHT.gridLine, size: 0.75, style: 'dash' },
        }
      );

      // Right Column: Recurring Endpoints Table (Light Mode)
      const rightX = 5.25;
      const rightY = 1.15;
      const rightW = 4.25;
      const rightH = 3.9;

      slide.addShape(pres.ShapeType.roundRect, {
        x: rightX,
        y: rightY,
        w: rightW,
        h: rightH,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.06,
      });

      slide.addText('// CHRONIC THREAT EVALUATION MATRIX', {
        x: rightX + 0.2,
        y: rightY + 0.15,
        w: 3.85,
        h: 0.25,
        fontSize: 9.5,
        bold: true,
        color: LIGHT.amber,
        fontFace: FONT,
      });

      const recurringTableRows: PptxGenJS.TableRow[] = [
        [
          makeCell('RANK', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'center' }),
          makeCell('HOST', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7 }),
          makeCell('MOS', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'center' }),
          makeCell('TOTAL', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
          makeCell('SCORE', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        ],
        ...recurringEndpoints.slice(0, 8).map((e, idx) => {
          const rowBg = idx % 2 === 1 ? LIGHT.bgCardAlt : LIGHT.bgCard;
          return [
            makeCell(`#${idx + 1}`, { fill: { color: rowBg }, color: LIGHT.textMuted, fontSize: 7, align: 'center', bold: true }),
            makeCell(e.endpoint.length > 20 ? e.endpoint.slice(0, 20) + '…' : e.endpoint, { fill: { color: rowBg }, color: LIGHT.textPrimary, fontSize: 7, bold: true }),
            makeCell(`${e.monthsAppeared}m`, { fill: { color: rowBg }, color: LIGHT.amber, fontSize: 7, align: 'center', bold: true }),
            makeCell(e.totalIncidents.toLocaleString(), { fill: { color: rowBg }, color: LIGHT.red, fontSize: 7, align: 'right', bold: true }),
            makeCell(String(e.rankScore), { fill: { color: rowBg }, color: LIGHT.cyan, fontSize: 7, align: 'right', bold: true }),
          ];
        }),
      ];

      slide.addTable(recurringTableRows, {
        x: rightX + 0.15,
        y: rightY + 0.45,
        w: rightW - 0.3,
        colW: [0.55, 1.8, 0.65, 0.65, 0.6],
        border: { type: 'solid', pt: 0.5, color: LIGHT.border },
      });
    }

    addLightSlideFooter(slide, 8);
  }

  // ============================================================
  // SLIDE 9: INCIDENT RESOLUTION STATUS & FUNNEL (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '08. INCIDENT LIFECYCLE',
      'Incident Resolution Status & Triage Velocities',
      'Operational response metrics, funnel closure rates, and monthly SOC remediation trajectory.'
    );

    // Top Funnel 4 Stages Strip (Light Mode)
    const funnelStages = [
      { label: 'DETECTED', count: detected, color: LIGHT.purple },
      { label: 'TRIAGED', count: investigated, color: LIGHT.cyan },
      { label: 'ACTION TAKEN', count: actionTaken, color: LIGHT.amber },
      { label: 'RESOLVED & CLOSED', count: resolved, color: LIGHT.emerald },
    ];

    const funnelY = 1.15;
    const funnelCardW = 2.18;

    funnelStages.forEach((stage, idx) => {
      const fX = 0.5 + idx * 2.28;
      slide.addShape(pres.ShapeType.roundRect, {
        x: fX,
        y: funnelY,
        w: funnelCardW,
        h: 0.95,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.05,
      });

      slide.addShape(pres.ShapeType.rect, {
        x: fX,
        y: funnelY,
        w: funnelCardW,
        h: 0.03,
        fill: { color: stage.color },
      });

      slide.addText(
        [
          { text: `STAGE 0${idx + 1}\n`, options: { fontSize: 6.5, color: LIGHT.textMuted, bold: true } },
          { text: `${stage.label}\n`, options: { fontSize: 7.5, color: LIGHT.textSecondary, bold: true } },
          { text: stage.count.toLocaleString(), options: { fontSize: 16, color: stage.color, bold: true } },
        ],
        { x: fX + 0.1, y: funnelY + 0.1, w: funnelCardW - 0.2, h: 0.8, fontFace: FONT }
      );
    });

    // Bottom Left: Resolution Breakdown Modern Light Doughnut Chart
    const leftX = 0.5;
    const leftY = 2.25;
    const leftW = 4.6;
    const leftH = 2.8;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: leftY,
      w: leftW,
      h: leftH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// RESOLUTION STATUS BREAKDOWN', {
      x: leftX + 0.2,
      y: leftY + 0.15,
      w: 4.2,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.emerald,
      fontFace: FONT,
    });

    const statusCounts = resolution.statusCounts || [];
    if (statusCounts.length > 0) {
      slide.addChart(
        pres.ChartType.doughnut,
        [
          {
            name: 'Status',
            labels: statusCounts.map((s) => s.name),
            values: statusCounts.map((s) => s.value),
          },
        ],
        {
          x: leftX + 0.2,
          y: leftY + 0.45,
          w: leftW - 0.4,
          h: leftH - 0.55,
          chartColors: [LIGHT.emerald, LIGHT.red, LIGHT.amber, LIGHT.purple, LIGHT.cyan],
          holeSize: 68,
          showValue: true,
          dataLabelColor: LIGHT.textPrimary,
          dataLabelFontFace: FONT,
          dataLabelFontSize: 7.5,
          dataLabelFontBold: true,
          showLegend: true,
          legendPos: 'r',
          legendColor: LIGHT.textPrimary,
          legendFontFace: FONT,
          legendFontSize: 7.5,
        }
      );
    }

    // Bottom Right: Monthly Resolution Trend Table (Light Mode)
    const rightX = 5.25;
    const rightY = 2.25;
    const rightW = 4.25;
    const rightH = 2.8;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// MONTHLY CLOSURE VELOCITY', {
      x: rightX + 0.2,
      y: rightY + 0.15,
      w: 3.85,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.cyan,
      fontFace: FONT,
    });

    const resTrendRows: PptxGenJS.TableRow[] = [
      [
        makeCell('MONTH', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7 }),
        makeCell('RESOLVED', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('OPEN', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
        makeCell('IN PROGRESS', { fill: { color: LIGHT.bgHeader }, color: LIGHT.textWhite, bold: true, fontSize: 7, align: 'right' }),
      ],
      ...resolution.trendByMonth.slice(0, 6).map((t, ti) => {
        const rowBg = ti % 2 === 1 ? LIGHT.bgCardAlt : LIGHT.bgCard;
        return [
          makeCell(t.month, { fill: { color: rowBg }, color: LIGHT.textPrimary, fontSize: 7, bold: true }),
          makeCell(t.resolved.toLocaleString(), { fill: { color: rowBg }, color: LIGHT.emerald, fontSize: 7, align: 'right', bold: true }),
          makeCell(t.unresolved.toLocaleString(), { fill: { color: rowBg }, color: LIGHT.red, fontSize: 7, align: 'right' }),
          makeCell(t.inProgress.toLocaleString(), { fill: { color: rowBg }, color: LIGHT.amber, fontSize: 7, align: 'right' }),
        ];
      }),
    ];

    slide.addTable(resTrendRows, {
      x: rightX + 0.15,
      y: rightY + 0.45,
      w: rightW - 0.3,
      colW: [1.5, 0.8, 0.8, 0.8],
      border: { type: 'solid', pt: 0.5, color: LIGHT.border },
    });

    addLightSlideFooter(slide, 9);
  }

  // ============================================================
  // SLIDE 10: INFRA <-> EDR ASSET RECONCILIATION (LIGHT MODE)
  // ============================================================
  {
    const slide = pres.addSlide();
    addLightSlideHeader(
      slide,
      '09. ASSET HYGIENE',
      'Infra ↔ EDR Asset Reconciliation',
      'Inventory reconciliation identifying coverage blind spots, unmonitored devices, and ghost agent endpoints.'
    );

    // 4 Asset Cards across top (Light Mode)
    const assetCards = [
      { label: 'TOTAL IT ASSETS', value: reconciliation.totalAssets.toLocaleString(), color: LIGHT.purple },
      { label: 'MATCHED / PROTECTED', value: reconciliation.matched.toLocaleString(), color: LIGHT.emerald },
      { label: 'UNPROTECTED ASSETS', value: reconciliation.unprotected.toLocaleString(), color: LIGHT.red },
      { label: 'GHOST AGENTS', value: reconciliation.ghostAgents.toLocaleString(), color: LIGHT.amber },
    ];

    const assetY = 1.15;
    assetCards.forEach((k, idx) => {
      const aX = 0.5 + idx * 2.28;
      slide.addShape(pres.ShapeType.roundRect, {
        x: aX,
        y: assetY,
        w: 2.18,
        h: 0.85,
        fill: { color: LIGHT.bgCard },
        line: { color: LIGHT.border, width: 1 },
        rectRadius: 0.05,
      });

      slide.addShape(pres.ShapeType.rect, {
        x: aX,
        y: assetY,
        w: 2.18,
        h: 0.03,
        fill: { color: k.color },
      });

      slide.addText(
        [
          { text: `${k.label}\n`, options: { fontSize: 6.5, color: LIGHT.textMuted, bold: true } },
          { text: k.value, options: { fontSize: 16, color: k.color, bold: true } },
        ],
        { x: aX + 0.1, y: assetY + 0.14, w: 1.98, h: 0.65, fontFace: FONT }
      );
    });

    // Deployment Coverage Clean Light Progress Bar
    const covRate = reconciliation.totalAssets > 0 ? Math.round((reconciliation.matched / reconciliation.totalAssets) * 100) : 100;
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.5,
      y: 2.12,
      w: 9.0,
      h: 0.55,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.05,
    });

    slide.addText(`// EDR DEPLOYMENT COVERAGE: ${covRate}% PROTECTED`, {
      x: 0.7,
      y: 2.16,
      w: 4.5,
      h: 0.2,
      fontSize: 8.5,
      bold: true,
      color: LIGHT.textPrimary,
      fontFace: FONT,
    });

    slide.addText(`${reconciliation.matched} of ${reconciliation.totalAssets} registered enterprise assets reporting active telemetry`, {
      x: 4.5,
      y: 2.16,
      w: 4.8,
      h: 0.2,
      fontSize: 7.5,
      color: LIGHT.textSecondary,
      align: 'right',
      fontFace: FONT,
    });

    // Track
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.7,
      y: 2.42,
      w: 8.6,
      h: 0.14,
      fill: { color: LIGHT.border },
      rectRadius: 0.07,
    });
    // Fill
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.7,
      y: 2.42,
      w: Math.max(0.2, (covRate / 100) * 8.6),
      h: 0.14,
      fill: { color: covRate >= 90 ? LIGHT.emerald : covRate >= 75 ? LIGHT.amber : LIGHT.red },
      rectRadius: 0.07,
    });

    // Bottom Unprotected Assets Grid (Clean Light Mode)
    const unprotX = 0.5;
    const unprotY = 2.8;
    const unprotW = 9.0;
    const unprotH = 2.25;

    slide.addShape(pres.ShapeType.roundRect, {
      x: unprotX,
      y: unprotY,
      w: unprotW,
      h: unprotH,
      fill: { color: LIGHT.bgCard },
      line: { color: LIGHT.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('// UNPROTECTED HOSTS (MISSING S1 AGENT — IMMEDIATE REMEDIATION)', {
      x: unprotX + 0.2,
      y: unprotY + 0.12,
      w: 8.5,
      h: 0.25,
      fontSize: 9.5,
      bold: true,
      color: LIGHT.red,
      fontFace: FONT,
    });

    const unprotList = reconciliation.unprotectedAssets || [];
    if (unprotList.length === 0) {
      slide.addText('✓ All IT inventory assets have active, reporting SentinelOne EDR agents installed.', {
        x: unprotX + 0.2,
        y: unprotY + 0.6,
        w: 8.5,
        h: 0.5,
        fontSize: 9.5,
        bold: true,
        color: LIGHT.emerald,
        fontFace: FONT,
      });
    } else {
      // 4 columns of clean light-mode tag chips
      const displayTags = unprotList.slice(0, 24);
      const cols = 4;
      const tagW = 2.05;
      const tagH = 0.28;

      displayTags.forEach((host, hi) => {
        const col = hi % cols;
        const row = Math.floor(hi / cols);
        const tX = unprotX + 0.2 + col * 2.18;
        const tY = unprotY + 0.42 + row * 0.32;

        slide.addShape(pres.ShapeType.roundRect, {
          x: tX,
          y: tY,
          w: tagW,
          h: tagH,
          fill: { color: LIGHT.chipRedBg },
          line: { color: LIGHT.chipRedBorder, width: 0.75 },
          rectRadius: 0.04,
        });

        slide.addText(host.length > 22 ? host.slice(0, 22) + '…' : host, {
          x: tX + 0.08,
          y: tY + 0.04,
          w: tagW - 0.16,
          h: tagH - 0.08,
          fontSize: 7,
          color: LIGHT.chipRedText,
          bold: true,
          fontFace: FONT,
          align: 'center',
          valign: 'middle',
        });
      });

      if (unprotList.length > 24) {
        slide.addText(
          `+${unprotList.length - 24} additional unmonitored hostnames omitted. Export full reconciliation list from the Recon dashboard tab.`,
          {
            x: unprotX + 0.2,
            y: unprotY + unprotH - 0.3,
            w: 8.6,
            h: 0.2,
            fontSize: 7,
            color: LIGHT.textMuted,
            align: 'center',
            fontFace: FONT,
          }
        );
      }
    }

    addLightSlideFooter(slide, 10);
  }

  // Generate binary presentation blob
  const pptxBlob = (await pres.write({ outputType: 'blob' })) as Blob;
  return pptxBlob;
}
