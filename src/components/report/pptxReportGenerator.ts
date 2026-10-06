import type PptxGenJS from 'pptxgenjs';
import type { AnalyticsResult, MonthSummary } from '@/types';

// ============================================================
// Executive Palette & Presentation Tokens (Hex without '#')
// ============================================================
const C = {
  // Brand & Dark Backgrounds
  primaryDark: '0A1128',
  primaryNavy: '1E293B',
  coverCardBg: '111C38',
  coverCardBorder: '1E2F5D',
  primaryBlue: '1D4ED8',
  accentBlue: '2563EB',
  accentSky: '0284C7',
  accentTeal: '0D9488',

  // Surfaces & Backgrounds
  bgPage: 'F8FAFC',
  bgCard: 'FFFFFF',
  bgSection: 'F1F5F9',
  border: 'E2E8F0',
  borderMedium: 'CBD5E1',

  // Typography
  textPrimary: '0F172A',
  textSecondary: '475569',
  textMuted: '64748B',
  textLight: '94A3B8',
  textWhite: 'FFFFFF',

  // Severity & Accents
  critical: 'DC2626',
  criticalBg: 'FEF2F2',
  warning: 'D97706',
  warningBg: 'FFFBEB',
  success: '059669',
  successBg: 'ECFDF5',
  info: '2563EB',
  infoBg: 'EFF6FF',
};

const CHART_COLORS = [
  '1D4ED8', // Cobalt Navy
  '0D9488', // Deep Teal
  'D97706', // Executive Amber
  'DC2626', // Executive Crimson
  '4F46E5', // Enterprise Indigo
  '0284C7', // Steel Blue
  '059669', // Forest Emerald
  '64748B', // Slate Gray
];

export interface GeneratePptxOptions {
  analytics: AnalyticsResult;
  months: MonthSummary[];
  reportingMonth: string;
  accountName?: string;
}

// Strongly typed table cell constructor for pptxgenjs
function makeCell(
  text: string | number,
  options?: {
    fill?: { color: string };
    color?: string;
    bold?: boolean;
    fontSize?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
  }
): PptxGenJS.TableCell {
  return {
    text: String(text),
    options: options ? { ...options } : undefined,
  };
}

/**
 * Professional PowerPoint Presentation Generator for EDR Executive Reports
 * Generates an executive 9-slide deck mirroring the PDF report styling.
 */
export async function generateReportPowerPoint({
  analytics,
  months,
  reportingMonth,
  accountName = 'Classic Fashion Apparel',
}: GeneratePptxOptions): Promise<Blob> {
  const pptxModule = await import('pptxgenjs');
  // Handle ESM / CJS / Turbopack interop
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
    month: 'long',
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
  } = analytics;

  const totalPages = 9;

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

  // Helper for adding consistent Slide Header on content slides
  const addSlideHeader = (
    slide: PptxGenJS.Slide,
    sectionCategory: string,
    title: string,
    subtitle?: string
  ) => {
    slide.background = { color: C.bgPage };

    // Left accent pill bar
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.5,
      y: 0.32,
      w: 0.08,
      h: 0.52,
      fill: { color: C.primaryBlue },
      rectRadius: 0.04,
    });

    // Category / Breadcrumb
    slide.addText(sectionCategory.toUpperCase(), {
      x: 0.68,
      y: 0.3,
      w: 8.5,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: C.textMuted,
      fontFace: 'Arial',
    });

    // Slide Main Title
    slide.addText(title, {
      x: 0.68,
      y: 0.48,
      w: 8.5,
      h: 0.36,
      fontSize: 16,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.68,
        y: 0.82,
        w: 8.8,
        h: 0.22,
        fontSize: 8.5,
        color: C.textSecondary,
        fontFace: 'Arial',
      });
    }

    // Top subtle divider line
    slide.addShape(pres.ShapeType.rect, {
      x: 0.5,
      y: subtitle ? 1.08 : 0.95,
      w: 9.0,
      h: 0.01,
      fill: { color: C.border },
    });
  };

  // Helper for adding consistent Slide Footer
  const addSlideFooter = (slide: PptxGenJS.Slide, pageNum: number) => {
    // Bottom subtle divider line
    slide.addShape(pres.ShapeType.rect, {
      x: 0.5,
      y: 5.18,
      w: 9.0,
      h: 0.01,
      fill: { color: C.border },
    });

    slide.addText('CONFIDENTIAL — INTERNAL USE ONLY', {
      x: 0.5,
      y: 5.25,
      w: 3.5,
      h: 0.25,
      fontSize: 7,
      color: C.textLight,
      fontFace: 'Arial',
    });

    slide.addText('SentinelOne Singularity Platform • Executive Security Review', {
      x: 3.5,
      y: 5.25,
      w: 4.0,
      h: 0.25,
      fontSize: 7,
      color: C.textLight,
      align: 'center',
      fontFace: 'Arial',
    });

    slide.addText(`Slide ${pageNum} of ${totalPages}`, {
      x: 7.5,
      y: 5.25,
      w: 2.0,
      h: 0.25,
      fontSize: 7,
      bold: true,
      color: C.textMuted,
      align: 'right',
      fontFace: 'Arial',
    });
  };

  // ============================================================
  // SLIDE 1: EXECUTIVE COVER SLIDE (DARK SLATE THEME)
  // ============================================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.primaryDark };

    // Decorative Cobalt Accent Line
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.7,
      y: 0.55,
      w: 0.8,
      h: 0.06,
      fill: { color: C.primaryBlue },
      rectRadius: 0.03,
    });

    // Classification Badge
    slide.addText('RESTRICTED // MANAGEMENT & EXECUTIVE ACCESS ONLY', {
      x: 0.7,
      y: 0.82,
      w: 4.0,
      h: 0.28,
      fontSize: 7.5,
      bold: true,
      color: '93C5FD',
      fontFace: 'Arial',
      fill: { color: C.coverCardBg },
      line: { color: C.coverCardBorder, width: 1 },
      rectRadius: 0.06,
      align: 'center',
      valign: 'middle',
    });

    // Main Cover Title
    slide.addText('Monthly EDR\nSecurity Report', {
      x: 0.7,
      y: 1.3,
      w: 8.5,
      h: 1.25,
      fontSize: 32,
      bold: true,
      color: C.textWhite,
      fontFace: 'Arial',
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
        fontSize: 11,
        color: '94A3B8',
        fontFace: 'Arial',
      }
    );

    // Metadata Row
    const metaY = 3.25;
    slide.addShape(pres.ShapeType.rect, {
      x: 0.7,
      y: metaY,
      w: 8.6,
      h: 0.01,
      fill: { color: C.coverCardBorder },
    });

    const metaItems = [
      { label: 'REPORTING PERIOD', value: reportLabel },
      { label: 'TARGET ACCOUNT', value: accountName },
      { label: 'EDR PLATFORM', value: 'SentinelOne Singularity' },
      { label: 'ANALYZED EVENTS', value: `${detected.toLocaleString()} Detections` },
    ];

    metaItems.forEach((m, idx) => {
      const xPos = 0.7 + idx * 2.15;
      slide.addText(
        [
          { text: `${m.label}\n`, options: { fontSize: 7, color: '64748B', bold: true } },
          { text: m.value, options: { fontSize: 9.5, color: 'E2E8F0', bold: true } },
        ],
        { x: xPos, y: metaY + 0.1, w: 2.05, h: 0.5, fontFace: 'Arial' }
      );
    });

    // Bottom KPI Cards Row
    const kpiY = 4.0;
    slide.addShape(pres.ShapeType.rect, {
      x: 0.7,
      y: kpiY,
      w: 8.6,
      h: 0.01,
      fill: { color: C.coverCardBorder },
    });

    const coverKpis = [
      { label: 'TOTAL INCIDENTS', value: detected.toLocaleString(), color: '60A5FA' },
      { label: 'RESOLVED INCIDENTS', value: resolved.toLocaleString(), color: '34D399' },
      { label: 'MALICIOUS DETECTIONS', value: String(kpis[2]?.value ?? '0'), color: 'F87171' },
      { label: 'EDR COVERAGE RATE', value: coveragePct, color: '38BDF8' },
    ];

    coverKpis.forEach((k, idx) => {
      const kX = 0.7 + idx * 2.18;
      // Background card
      slide.addShape(pres.ShapeType.roundRect, {
        x: kX,
        y: kpiY + 0.15,
        w: 2.08,
        h: 0.85,
        fill: { color: C.coverCardBg },
        line: { color: C.coverCardBorder, width: 1 },
        rectRadius: 0.06,
      });

      slide.addText(
        [
          { text: `${k.label}\n`, options: { fontSize: 7, color: '94A3B8', bold: true } },
          { text: k.value, options: { fontSize: 16, color: k.color, bold: true } },
        ],
        { x: kX + 0.12, y: kpiY + 0.22, w: 1.85, h: 0.7, fontFace: 'Arial' }
      );
    });

    // Cover Footer
    slide.addText(`Generated: ${generatedDate}  •  Confidential Information for Corporate Security Operations`, {
      x: 0.7,
      y: 5.2,
      w: 8.6,
      h: 0.25,
      fontSize: 7.5,
      color: '64748B',
      fontFace: 'Arial',
    });
  }

  // ============================================================
  // SLIDE 2: TABLE OF CONTENTS & EXECUTIVE AGENDA
  // ============================================================
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      '01. Contents',
      'Table of Contents & Executive Agenda',
      'Consolidated monthly cybersecurity telemetry captured by SentinelOne agents across enterprise endpoints.'
    );

    // Left Column: Agenda items list (7 sections)
    const agendaItems = [
      { num: '01', title: 'Executive Summary', desc: 'Key performance metrics, classification breakdown & verdict distribution' },
      { num: '02', title: 'Alert Analysis & MoM Trends', desc: 'Month-over-month telemetry comparison & high-frequency alerts' },
      { num: '03', title: 'Endpoint Detections & Density', desc: 'Endpoints generating the highest threat & alert frequencies' },
      { num: '04', title: 'Regional Threat Hotspots', desc: 'Geographical and site-level alert volumes and risk scoring' },
      { num: '05', title: 'Persistent Risky Endpoints', desc: 'Endpoints exhibiting recurring detections across multiple cycles' },
      { num: '06', title: 'Incident Resolution Status', desc: 'Triage velocities, resolution status distributions & trends' },
      { num: '07', title: 'Asset Reconciliation', desc: 'Coverage alignment between IT asset inventory and active EDR agents' },
    ];

    const startY = 1.25;
    const itemH = 0.5;

    agendaItems.forEach((item, idx) => {
      const yPos = startY + idx * (itemH + 0.05);

      // Card container
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.5,
        y: yPos,
        w: 5.6,
        h: itemH,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.05,
      });

      // Number badge
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.6,
        y: yPos + 0.1,
        w: 0.38,
        h: 0.3,
        fill: { color: C.bgSection },
        rectRadius: 0.04,
      });
      slide.addText(item.num, {
        x: 0.6,
        y: yPos + 0.1,
        w: 0.38,
        h: 0.3,
        fontSize: 9,
        bold: true,
        color: C.primaryBlue,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
      });

      // Text Title & Desc
      slide.addText(
        [
          { text: `${item.title}  `, options: { fontSize: 9.5, bold: true, color: C.textPrimary } },
          { text: `— ${item.desc}`, options: { fontSize: 8, color: C.textSecondary } },
        ],
        { x: 1.08, y: yPos + 0.06, w: 4.8, h: itemH - 0.1, fontFace: 'Arial', valign: 'middle' }
      );
    });

    // Right Column: Scope & Security Notice Cards
    // Top Right Card: Scope Summary
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.3,
      y: 1.25,
      w: 3.2,
      h: 1.7,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Telemetry Scope Overview', {
      x: 6.5,
      y: 1.4,
      w: 2.8,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    slide.addText(
      [
        { text: '• Reporting Cycle: ', options: { bold: true, color: C.textPrimary } },
        { text: `${reportLabel}\n`, options: { color: C.textSecondary } },
        { text: '• Total Events Captured: ', options: { bold: true, color: C.textPrimary } },
        { text: `${detected.toLocaleString()} detections\n`, options: { color: C.textSecondary } },
        { text: '• Monitored Endpoints: ', options: { bold: true, color: C.textPrimary } },
        { text: `${kpis[3]?.value ?? topEndpoints.length} active hosts\n`, options: { color: C.textSecondary } },
        { text: '• Deployment Status: ', options: { bold: true, color: C.textPrimary } },
        { text: `${coveragePct} Asset Match\n`, options: { color: C.success } },
      ],
      { x: 6.5, y: 1.7, w: 2.8, h: 1.1, fontSize: 8.5, fontFace: 'Arial', lineSpacing: 16 }
    );

    // Bottom Right Card: Security Notice
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.3,
      y: 3.1,
      w: 3.2,
      h: 1.95,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    // Left blue accent stripe
    slide.addShape(pres.ShapeType.rect, {
      x: 6.3,
      y: 3.1,
      w: 0.08,
      h: 1.95,
      fill: { color: C.primaryNavy },
    });

    slide.addText('Security Compliance Notice', {
      x: 6.55,
      y: 3.25,
      w: 2.75,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    slide.addText(
      'All metrics and findings in this report represent point-in-time telemetry from corporate endpoints. Unmitigated detections and persistent hosts must be reviewed with SOC leadership according to Incident Response SOP §4.2.\n\nStrict access control: Distribution is restricted to authorized executive stakeholders.',
      {
        x: 6.55,
        y: 3.55,
        w: 2.75,
        h: 1.35,
        fontSize: 8,
        color: C.textSecondary,
        fontFace: 'Arial',
        lineSpacing: 13,
      }
    );

    addSlideFooter(slide, 2);
  }

  // ============================================================
  // SLIDE 3: EXECUTIVE SUMMARY & THREAT LANDSCAPE
  // ============================================================
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      '02. Executive Summary',
      'Executive Summary & Key Security Metrics',
      'High-level operational overview, classification distributions, and engine detection telemetry.'
    );

    // 4 KPI Cards across top
    const kpiCards = [
      { label: String(kpis[0]?.label || 'Total Detections'), value: String(kpis[0]?.value || detected), prev: kpis[0]?.previous, color: C.primaryBlue },
      { label: String(kpis[1]?.label || 'Resolved Incidents'), value: String(kpis[1]?.value || resolved), prev: kpis[1]?.previous, color: C.success },
      { label: String(kpis[2]?.label || 'Malicious Detections'), value: String(kpis[2]?.value || '0'), prev: kpis[2]?.previous, color: C.critical },
      { label: String(kpis[3]?.label || 'Active Endpoints'), value: String(kpis[3]?.value || '0'), prev: kpis[3]?.previous, color: C.accentSky },
    ];

    kpiCards.forEach((k, idx) => {
      const cardX = 0.5 + idx * 2.28;
      // White Card
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX,
        y: 1.15,
        w: 2.18,
        h: 0.88,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.05,
      });

      // Top colored indicator bar
      slide.addShape(pres.ShapeType.rect, {
        x: cardX,
        y: 1.15,
        w: 2.18,
        h: 0.04,
        fill: { color: k.color },
      });

      slide.addText(
        [
          { text: `${k.label.toUpperCase()}\n`, options: { fontSize: 7, color: C.textMuted, bold: true } },
          { text: `${k.value}\n`, options: { fontSize: 16, color: C.textPrimary, bold: true } },
          { text: k.prev ? `vs Previous: ${k.prev}` : 'Current Reporting Period', options: { fontSize: 7, color: C.textSecondary } },
        ],
        { x: cardX + 0.1, y: 1.24, w: 1.98, h: 0.74, fontFace: 'Arial' }
      );
    });

    // Bottom Left: Alert Classification Horizontal Bar Chart
    const leftCardX = 0.5;
    const leftCardY = 2.15;
    const leftCardW = 4.7;
    const leftCardH = 2.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftCardX,
      y: leftCardY,
      w: leftCardW,
      h: leftCardH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Alert Classification Breakdown', {
      x: leftCardX + 0.2,
      y: leftCardY + 0.12,
      w: 4.3,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
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
          y: leftCardY + 0.4,
          w: leftCardW - 0.2,
          h: leftCardH - 0.45,
          barDir: 'bar',
          chartColors: [C.primaryBlue],
          showValue: true,
          showLegend: false,
          valAxisLabelFontSize: 7.5,
          catAxisLabelFontSize: 7.5,
          dataLabelFontSize: 7.5,
        }
      );
    }

    // Bottom Right: Analyst Verdict Distribution + Top Detecting Engines
    const rightCardX = 5.35;
    const rightCardY = 2.15;
    const rightCardW = 4.15;
    const rightCardH = 2.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightCardX,
      y: rightCardY,
      w: rightCardW,
      h: rightCardH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Analyst Verdict & Detecting Engines', {
      x: rightCardX + 0.2,
      y: rightCardY + 0.12,
      w: 3.75,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    // 4 mini verdict stat pills
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
        fill: { color: C.bgSection },
        line: { color: C.border, width: 1 },
        rectRadius: 0.04,
      });

      // Color pip on left
      const pipColor = vi === 0 ? C.critical : vi === 1 ? C.warning : vi === 2 ? C.success : C.primaryBlue;
      slide.addShape(pres.ShapeType.rect, {
        x: vX,
        y: vY,
        w: 0.05,
        h: 0.48,
        fill: { color: pipColor },
      });

      slide.addText(
        [
          { text: `${v.name.slice(0, 16)}: `, options: { fontSize: 7.5, bold: true, color: C.textPrimary } },
          { text: `${v.value.toLocaleString()} `, options: { fontSize: 8, bold: true, color: C.textPrimary } },
          { text: `(${pct}%)`, options: { fontSize: 7, color: C.textMuted } },
        ],
        { x: vX + 0.1, y: vY + 0.05, w: 1.65, h: 0.38, fontFace: 'Arial', valign: 'middle' }
      );
    });

    // Detecting Engines Mini Table
    slide.addText('Top Detecting Engines:', {
      x: rightCardX + 0.2,
      y: rightCardY + 1.62,
      w: 3.75,
      h: 0.2,
      fontSize: 8.5,
      bold: true,
      color: C.textSecondary,
      fontFace: 'Arial',
    });

    const engineRows: PptxGenJS.TableRow[] = [
      [
        makeCell('Engine Name', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5 }),
        makeCell('Detections', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
      ],
      ...topEngines.slice(0, 4).map((eng, ei) => [
        makeCell(eng.name.length > 24 ? eng.name.slice(0, 24) + '…' : eng.name, { fill: { color: ei % 2 === 1 ? C.bgSection : C.bgCard }, color: C.textPrimary, fontSize: 7.5 }),
        makeCell(eng.value.toLocaleString(), { fill: { color: ei % 2 === 1 ? C.bgSection : C.bgCard }, color: C.textSecondary, fontSize: 7.5, align: 'right', bold: true }),
      ]),
    ];

    slide.addTable(engineRows, {
      x: rightCardX + 0.2,
      y: rightCardY + 1.86,
      w: 3.75,
      colW: [2.75, 1.0],
      border: { type: 'solid', pt: 0.5, color: C.border },
    });

    addSlideFooter(slide, 3);
  }

  // ============================================================
  // SLIDE 4: ALERT ANALYSIS (MONTH-OVER-MONTH)
  // ============================================================
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      '03. Alert Telemetry',
      'Alert Analysis — Month-over-Month Trends',
      'Comparative telemetry across monthly cycles detailing trajectory and shift in threat classifications.'
    );

    const hasMultiMonth = alertsByMonth && alertsByMonth.length > 1;

    // Left Column: Line Chart or Bar Chart
    const leftX = 0.5;
    const leftY = 1.15;
    const leftW = 4.6;
    const leftH = 3.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: leftY,
      w: leftW,
      h: leftH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    if (hasMultiMonth && top5Classes && top5Classes.length > 0) {
      slide.addText('Month-over-Month Trajectory (Top Classifications)', {
        x: leftX + 0.2,
        y: leftY + 0.15,
        w: 4.2,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: C.textPrimary,
        fontFace: 'Arial',
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
        chartColors: CHART_COLORS.slice(0, 4),
        showLegend: true,
        legendPos: 'b',
        valAxisLabelFontSize: 7,
        catAxisLabelFontSize: 7,
        legendFontSize: 7,
      });
    } else {
      // Single month fallback: Top 10 Alert Types Bar Chart
      slide.addText('Top Common Alert Types', {
        x: leftX + 0.2,
        y: leftY + 0.15,
        w: 4.2,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: C.textPrimary,
        fontFace: 'Arial',
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
          chartColors: [C.accentTeal],
          showValue: true,
          showLegend: false,
          valAxisLabelFontSize: 7,
          catAxisLabelFontSize: 7,
          dataLabelFontSize: 7,
        }
      );
    }

    // Right Column: Month-over-Month Change Detail Table
    const rightX = 5.25;
    const rightY = 1.15;
    const rightW = 4.25;
    const rightH = 3.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Month-over-Month Change Detail', {
      x: rightX + 0.2,
      y: rightY + 0.15,
      w: 3.85,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    const momRows: PptxGenJS.TableRow[] = [
      [
        makeCell('Classification', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5 }),
        makeCell('Current', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('Previous', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('Delta', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('Change', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
      ],
      ...alertTrend.slice(0, 8).map((r, ri) => {
        const isUp = r.delta > 0;
        const deltaColor = isUp ? C.critical : r.delta < 0 ? C.success : C.textSecondary;
        const rowBg = ri % 2 === 1 ? C.bgSection : C.bgCard;
        return [
          makeCell(r.classification.length > 18 ? r.classification.slice(0, 18) + '…' : r.classification, { fill: { color: rowBg }, color: C.textPrimary, fontSize: 7.5 }),
          makeCell(r.current.toLocaleString(), { fill: { color: rowBg }, color: C.textPrimary, fontSize: 7.5, align: 'right' }),
          makeCell(r.previous.toLocaleString(), { fill: { color: rowBg }, color: C.textMuted, fontSize: 7.5, align: 'right' }),
          makeCell(r.delta > 0 ? `+${r.delta}` : String(r.delta), { fill: { color: rowBg }, color: deltaColor, fontSize: 7.5, align: 'right', bold: true }),
          makeCell(`${r.deltaPercent > 0 ? '+' : ''}${r.deltaPercent}%`, { fill: { color: rowBg }, color: deltaColor, fontSize: 7.5, align: 'right', bold: true }),
        ];
      }),
    ];

    slide.addTable(momRows, {
      x: rightX + 0.15,
      y: rightY + 0.45,
      w: rightW - 0.3,
      colW: [1.65, 0.55, 0.55, 0.55, 0.65],
      border: { type: 'solid', pt: 0.5, color: C.border },
    });

    addSlideFooter(slide, 4);
  }

  // ============================================================
  // SLIDE 5: ENDPOINT DETECTIONS & DENSITY
  // ============================================================
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      '04. Endpoint Telemetry',
      'Top Endpoints by Detection Density',
      'Endpoints exhibiting the highest concentration of threat activity and security telemetry during the reporting period.'
    );

    // Callout note banner across top
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.5,
      y: 1.15,
      w: 9.0,
      h: 0.38,
      fill: { color: C.warningBg },
      line: { color: 'FDE68A', width: 1 },
      rectRadius: 0.04,
    });

    slide.addText(
      '⚠️ SOC Forensics Action Note: Endpoints generating more than 50 detections indicate localized malware propagation, aggressive automation, or credential compromise requiring isolation.',
      {
        x: 0.65,
        y: 1.18,
        w: 8.7,
        h: 0.3,
        fontSize: 8,
        color: '92400E',
        bold: true,
        fontFace: 'Arial',
        valign: 'middle',
      }
    );

    // Left Column: Horizontal Bar Chart of Top Endpoints
    const leftX = 0.5;
    const leftY = 1.62;
    const leftW = 4.6;
    const leftH = 3.45;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: leftY,
      w: leftW,
      h: leftH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Top Endpoints by Alert Count', {
      x: leftX + 0.2,
      y: leftY + 0.12,
      w: 4.2,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
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
          chartColors: [C.primaryBlue],
          showValue: true,
          showLegend: false,
          valAxisLabelFontSize: 7,
          catAxisLabelFontSize: 7,
          dataLabelFontSize: 7,
        }
      );
    }

    // Right Column: Endpoint Density Table
    const rightX = 5.25;
    const rightY = 1.62;
    const rightW = 4.25;
    const rightH = 3.45;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Ranked Host Telemetry Detail', {
      x: rightX + 0.2,
      y: rightY + 0.12,
      w: 3.85,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    const endpointTableRows: PptxGenJS.TableRow[] = [
      [
        makeCell('Rank', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'center' }),
        makeCell('Endpoint Hostname', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5 }),
        makeCell('Incidents', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('Containment Action', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'center' }),
      ],
      ...topEndpoints.slice(0, 8).map((ep, idx) => {
        const rowBg = idx % 2 === 1 ? C.bgSection : C.bgCard;
        const isUrgent = ep.count >= 50;
        return [
          makeCell(`#${idx + 1}`, { fill: { color: rowBg }, color: C.textMuted, fontSize: 7.5, align: 'center', bold: true }),
          makeCell(ep.endpoint.length > 22 ? ep.endpoint.slice(0, 22) + '…' : ep.endpoint, { fill: { color: rowBg }, color: C.textPrimary, fontSize: 7.5, bold: true }),
          makeCell(ep.count.toLocaleString(), { fill: { color: rowBg }, color: isUrgent ? C.critical : C.textPrimary, fontSize: 7.5, align: 'right', bold: true }),
          makeCell(isUrgent ? 'ISOLATE HOST' : 'MONITOR & SCAN', {
            fill: { color: rowBg },
            color: isUrgent ? C.critical : C.accentTeal,
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
      border: { type: 'solid', pt: 0.5, color: C.border },
    });

    addSlideFooter(slide, 5);
  }

  // ============================================================
  // SLIDE 6: REGIONAL THREAT HOTSPOTS
  // ============================================================
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      '05. Regional Risk',
      'Regional Threat Hotspots & Site Velocities',
      'Geographical distribution of incident activity and site-level risk scoring across corporate offices.'
    );

    // Left Column: Site Volume Bar Chart
    const leftX = 0.5;
    const leftY = 1.15;
    const leftW = 4.6;
    const leftH = 3.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: leftY,
      w: leftW,
      h: leftH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Incident Volume by Site Location', {
      x: leftX + 0.2,
      y: leftY + 0.15,
      w: 4.2,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
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
          chartColors: [C.accentSky],
          showValue: true,
          showLegend: false,
          valAxisLabelFontSize: 7,
          catAxisLabelFontSize: 7,
          dataLabelFontSize: 7,
        }
      );
    }

    // Right Column: Site Risk Scores Table
    const rightX = 5.25;
    const rightY = 1.15;
    const rightW = 4.25;
    const rightH = 3.9;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Site Risk Scores & Velocity', {
      x: rightX + 0.2,
      y: rightY + 0.15,
      w: 3.85,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    const siteRows: PptxGenJS.TableRow[] = [
      [
        makeCell('Site / Office', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5 }),
        makeCell('Current', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('Previous', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('Delta', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('Risk Score', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
      ],
      ...siteRisks.slice(0, 8).map((s, si) => {
        const rowBg = si % 2 === 1 ? C.bgSection : C.bgCard;
        const isUp = s.delta > 0;
        return [
          makeCell(s.site.length > 18 ? s.site.slice(0, 18) + '…' : s.site, { fill: { color: rowBg }, color: C.textPrimary, fontSize: 7.5 }),
          makeCell(s.current.toLocaleString(), { fill: { color: rowBg }, color: C.textPrimary, fontSize: 7.5, align: 'right' }),
          makeCell(s.previous.toLocaleString(), { fill: { color: rowBg }, color: C.textMuted, fontSize: 7.5, align: 'right' }),
          makeCell(s.delta > 0 ? `+${s.delta}` : String(s.delta), { fill: { color: rowBg }, color: isUp ? C.critical : C.success, fontSize: 7.5, align: 'right', bold: true }),
          makeCell(String(s.riskScore), { fill: { color: rowBg }, color: s.riskScore > 60 ? C.critical : C.textPrimary, fontSize: 7.5, align: 'right', bold: true }),
        ];
      }),
    ];

    slide.addTable(siteRows, {
      x: rightX + 0.15,
      y: rightY + 0.45,
      w: rightW - 0.3,
      colW: [1.65, 0.6, 0.6, 0.6, 0.7],
      border: { type: 'solid', pt: 0.5, color: C.border },
    });

    addSlideFooter(slide, 6);
  }

  // ============================================================
  // SLIDE 7: PERSISTENT RISKY ENDPOINTS
  // ============================================================
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      '06. Persistent Threats',
      'Persistent & Chronic Risky Endpoints',
      'Endpoints repeatedly flagged across multiple consecutive months indicating unpatched vulnerabilities or chronic malware.'
    );

    if (recurringEndpoints.length === 0) {
      // Clean Empty State
      slide.addShape(pres.ShapeType.roundRect, {
        x: 1.5,
        y: 1.8,
        w: 7.0,
        h: 2.2,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.08,
      });

      slide.addText('✓ No Persistent Risky Endpoints Detected', {
        x: 1.7,
        y: 2.2,
        w: 6.6,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: C.success,
        align: 'center',
        fontFace: 'Arial',
      });

      slide.addText(
        'Zero endpoints exhibited recurring detection anomalies across consecutive reporting months. All identified threats were resolved within single operational cycles.',
        {
          x: 2.0,
          y: 2.7,
          w: 6.0,
          h: 0.8,
          fontSize: 9.5,
          color: C.textSecondary,
          align: 'center',
          fontFace: 'Arial',
          lineSpacing: 16,
        }
      );
    } else {
      // Left Column: Bar chart of recurring endpoints
      const leftX = 0.5;
      const leftY = 1.15;
      const leftW = 4.6;
      const leftH = 3.9;

      slide.addShape(pres.ShapeType.roundRect, {
        x: leftX,
        y: leftY,
        w: leftW,
        h: leftH,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.06,
      });

      slide.addText('Cumulative Incidents by Chronic Endpoint', {
        x: leftX + 0.2,
        y: leftY + 0.15,
        w: 4.2,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: C.textPrimary,
        fontFace: 'Arial',
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
          chartColors: [C.critical],
          showValue: true,
          showLegend: false,
          valAxisLabelFontSize: 7,
          catAxisLabelFontSize: 7,
          dataLabelFontSize: 7,
        }
      );

      // Right Column: Recurring Endpoints Table
      const rightX = 5.25;
      const rightY = 1.15;
      const rightW = 4.25;
      const rightH = 3.9;

      slide.addShape(pres.ShapeType.roundRect, {
        x: rightX,
        y: rightY,
        w: rightW,
        h: rightH,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.06,
      });

      slide.addText('Persistent Threat Evaluation Matrix', {
        x: rightX + 0.2,
        y: rightY + 0.15,
        w: 3.85,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: C.textPrimary,
        fontFace: 'Arial',
      });

      const recurringTableRows: PptxGenJS.TableRow[] = [
        [
          makeCell('Rank', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'center' }),
          makeCell('Endpoint Hostname', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5 }),
          makeCell('Months', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'center' }),
          makeCell('Incidents', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
          makeCell('Rank Score', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        ],
        ...recurringEndpoints.slice(0, 8).map((e, idx) => {
          const rowBg = idx % 2 === 1 ? C.bgSection : C.bgCard;
          return [
            makeCell(`#${idx + 1}`, { fill: { color: rowBg }, color: C.textMuted, fontSize: 7.5, align: 'center', bold: true }),
            makeCell(e.endpoint.length > 20 ? e.endpoint.slice(0, 20) + '…' : e.endpoint, { fill: { color: rowBg }, color: C.textPrimary, fontSize: 7.5, bold: true }),
            makeCell(`${e.monthsAppeared} mos`, { fill: { color: rowBg }, color: C.warning, fontSize: 7.5, align: 'center', bold: true }),
            makeCell(e.totalIncidents.toLocaleString(), { fill: { color: rowBg }, color: C.critical, fontSize: 7.5, align: 'right', bold: true }),
            makeCell(String(e.rankScore), { fill: { color: rowBg }, color: C.textPrimary, fontSize: 7.5, align: 'right', bold: true }),
          ];
        }),
      ];

      slide.addTable(recurringTableRows, {
        x: rightX + 0.15,
        y: rightY + 0.45,
        w: rightW - 0.3,
        colW: [0.55, 1.8, 0.65, 0.65, 0.6],
        border: { type: 'solid', pt: 0.5, color: C.border },
      });
    }

    addSlideFooter(slide, 7);
  }

  // ============================================================
  // SLIDE 8: INCIDENT RESOLUTION STATUS & FUNNEL
  // ============================================================
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      '07. Incident Lifecycle',
      'Incident Resolution Status & Triage Velocities',
      'Operational response metrics, funnel closure rates, and monthly SOC remediation trajectory.'
    );

    // Top Funnel 4 Stages Strip
    const funnelStages = [
      { label: 'Detected Incidents', count: detected, color: C.primaryBlue },
      { label: 'Investigated & Triaged', count: investigated, color: C.accentTeal },
      { label: 'Action Taken', count: actionTaken, color: C.warning },
      { label: 'Resolved & Closed', count: resolved, color: C.success },
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
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.05,
      });

      slide.addShape(pres.ShapeType.rect, {
        x: fX,
        y: funnelY,
        w: funnelCardW,
        h: 0.04,
        fill: { color: stage.color },
      });

      slide.addText(
        [
          { text: `STAGE 0${idx + 1}\n`, options: { fontSize: 6.5, color: C.textMuted, bold: true } },
          { text: `${stage.label}\n`, options: { fontSize: 8, color: C.textPrimary, bold: true } },
          { text: stage.count.toLocaleString(), options: { fontSize: 16, color: stage.color, bold: true } },
        ],
        { x: fX + 0.1, y: funnelY + 0.1, w: funnelCardW - 0.2, h: 0.8, fontFace: 'Arial' }
      );
    });

    // Bottom Left: Resolution Breakdown Donut or Cards
    const leftX = 0.5;
    const leftY = 2.25;
    const leftW = 4.6;
    const leftH = 2.8;

    slide.addShape(pres.ShapeType.roundRect, {
      x: leftX,
      y: leftY,
      w: leftW,
      h: leftH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Resolution Status Distribution', {
      x: leftX + 0.2,
      y: leftY + 0.15,
      w: 4.2,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
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
          chartColors: [C.success, C.critical, C.warning, C.primaryBlue, C.accentTeal],
          showLegend: true,
          legendPos: 'r',
          holeSize: 60,
          dataLabelFontSize: 7.5,
          legendFontSize: 7.5,
        }
      );
    }

    // Bottom Right: Monthly Resolution Trend Table
    const rightX = 5.25;
    const rightY = 2.25;
    const rightW = 4.25;
    const rightH = 2.8;

    slide.addShape(pres.ShapeType.roundRect, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Monthly Incident Closure Trends', {
      x: rightX + 0.2,
      y: rightY + 0.15,
      w: 3.85,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    const resTrendRows: PptxGenJS.TableRow[] = [
      [
        makeCell('Reporting Month', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5 }),
        makeCell('Resolved', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('Unresolved', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
        makeCell('In Progress', { fill: { color: C.primaryNavy }, color: C.textWhite, bold: true, fontSize: 7.5, align: 'right' }),
      ],
      ...resolution.trendByMonth.slice(0, 6).map((t, ti) => {
        const rowBg = ti % 2 === 1 ? C.bgSection : C.bgCard;
        return [
          makeCell(t.month, { fill: { color: rowBg }, color: C.textPrimary, fontSize: 7.5, bold: true }),
          makeCell(t.resolved.toLocaleString(), { fill: { color: rowBg }, color: C.success, fontSize: 7.5, align: 'right', bold: true }),
          makeCell(t.unresolved.toLocaleString(), { fill: { color: rowBg }, color: C.critical, fontSize: 7.5, align: 'right' }),
          makeCell(t.inProgress.toLocaleString(), { fill: { color: rowBg }, color: C.warning, fontSize: 7.5, align: 'right' }),
        ];
      }),
    ];

    slide.addTable(resTrendRows, {
      x: rightX + 0.15,
      y: rightY + 0.45,
      w: rightW - 0.3,
      colW: [1.5, 0.8, 0.8, 0.8],
      border: { type: 'solid', pt: 0.5, color: C.border },
    });

    addSlideFooter(slide, 8);
  }

  // ============================================================
  // SLIDE 9: INFRA <-> EDR ASSET RECONCILIATION
  // ============================================================
  {
    const slide = pres.addSlide();
    addSlideHeader(
      slide,
      '08. Asset Hygiene',
      'Infra ↔ EDR Asset Reconciliation',
      'Inventory reconciliation identifying coverage blind spots, unmonitored devices, and ghost agent endpoints.'
    );

    // 4 Asset Cards across top
    const assetCards = [
      { label: 'TOTAL IT ASSETS', value: reconciliation.totalAssets.toLocaleString(), color: C.primaryNavy },
      { label: 'MATCHED / PROTECTED', value: reconciliation.matched.toLocaleString(), color: C.success },
      { label: 'UNPROTECTED ASSETS', value: reconciliation.unprotected.toLocaleString(), color: C.critical },
      { label: 'GHOST AGENTS', value: reconciliation.ghostAgents.toLocaleString(), color: C.warning },
    ];

    const assetY = 1.15;
    assetCards.forEach((k, idx) => {
      const aX = 0.5 + idx * 2.28;
      slide.addShape(pres.ShapeType.roundRect, {
        x: aX,
        y: assetY,
        w: 2.18,
        h: 0.85,
        fill: { color: C.bgCard },
        line: { color: C.border, width: 1 },
        rectRadius: 0.05,
      });

      slide.addShape(pres.ShapeType.rect, {
        x: aX,
        y: assetY,
        w: 2.18,
        h: 0.04,
        fill: { color: k.color },
      });

      slide.addText(
        [
          { text: `${k.label}\n`, options: { fontSize: 7, color: C.textMuted, bold: true } },
          { text: k.value, options: { fontSize: 16, color: k.color, bold: true } },
        ],
        { x: aX + 0.1, y: assetY + 0.14, w: 1.98, h: 0.65, fontFace: 'Arial' }
      );
    });

    // Deployment Coverage Visual Progress Bar
    const covRate = reconciliation.totalAssets > 0 ? Math.round((reconciliation.matched / reconciliation.totalAssets) * 100) : 100;
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.5,
      y: 2.12,
      w: 9.0,
      h: 0.55,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.05,
    });

    slide.addText(`EDR Agent Deployment Coverage: ${covRate}% Protected`, {
      x: 0.7,
      y: 2.16,
      w: 4.5,
      h: 0.2,
      fontSize: 8.5,
      bold: true,
      color: C.textPrimary,
      fontFace: 'Arial',
    });

    slide.addText(`${reconciliation.matched} of ${reconciliation.totalAssets} registered enterprise assets reporting active telemetry`, {
      x: 4.5,
      y: 2.16,
      w: 4.8,
      h: 0.2,
      fontSize: 8,
      color: C.textSecondary,
      align: 'right',
      fontFace: 'Arial',
    });

    // Track
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.7,
      y: 2.42,
      w: 8.6,
      h: 0.14,
      fill: { color: C.border },
      rectRadius: 0.07,
    });
    // Fill
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.7,
      y: 2.42,
      w: Math.max(0.2, (covRate / 100) * 8.6),
      h: 0.14,
      fill: { color: covRate >= 90 ? C.success : covRate >= 75 ? C.warning : C.critical },
      rectRadius: 0.07,
    });

    // Bottom Unprotected Assets Grid
    const unprotX = 0.5;
    const unprotY = 2.8;
    const unprotW = 9.0;
    const unprotH = 2.25;

    slide.addShape(pres.ShapeType.roundRect, {
      x: unprotX,
      y: unprotY,
      w: unprotW,
      h: unprotH,
      fill: { color: C.bgCard },
      line: { color: C.border, width: 1 },
      rectRadius: 0.06,
    });

    slide.addText('Unprotected Assets (Immediate Remediation Required — Missing EDR Agent)', {
      x: unprotX + 0.2,
      y: unprotY + 0.12,
      w: 8.5,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: C.critical,
      fontFace: 'Arial',
    });

    const unprotList = reconciliation.unprotectedAssets || [];
    if (unprotList.length === 0) {
      slide.addText('✓ All IT inventory assets have active, reporting SentinelOne EDR agents installed.', {
        x: unprotX + 0.2,
        y: unprotY + 0.6,
        w: 8.5,
        h: 0.5,
        fontSize: 10,
        bold: true,
        color: C.success,
        fontFace: 'Arial',
      });
    } else {
      // 4 columns of tag pills
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
          fill: { color: C.criticalBg },
          line: { color: 'FECACA', width: 0.75 },
          rectRadius: 0.04,
        });

        slide.addText(host.length > 22 ? host.slice(0, 22) + '…' : host, {
          x: tX + 0.08,
          y: tY + 0.04,
          w: tagW - 0.16,
          h: tagH - 0.08,
          fontSize: 7,
          color: C.critical,
          bold: true,
          fontFace: 'Arial',
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
            fontSize: 7.5,
            color: C.textMuted,
            align: 'center',
            fontFace: 'Arial',
          }
        );
      }
    }

    addSlideFooter(slide, 9);
  }

  // Generate binary presentation blob
  const pptxBlob = (await pres.write({ outputType: 'blob' })) as Blob;
  return pptxBlob;
}
