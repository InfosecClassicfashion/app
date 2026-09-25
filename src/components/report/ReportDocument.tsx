import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Line,
  Polyline,
  Circle,
  Rect,
} from '@react-pdf/renderer';
import type { AnalyticsResult, MonthSummary } from '@/types';
import {
  PDF_COLORS,
  CHART_PALETTE,
  PDF_FONT,
  pdfStyles,
} from './pdfStyles';

// ============================================================
// Sub-components for React-PDF
// ============================================================

function PageHeader({ section }: { section: string }) {
  return (
    <View style={pdfStyles.header} fixed>
      <Text style={pdfStyles.headerBrand}>EDR MONTHLY SECURITY REPORT</Text>
      <Text style={pdfStyles.headerSection}>{section}</Text>
    </View>
  );
}

function PageFooter({ page, total }: { page: number; total: number }) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>CONFIDENTIAL — INTERNAL USE ONLY</Text>
      <Text style={pdfStyles.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={pdfStyles.sectionHeaderRow}>
      <View style={pdfStyles.sectionAccentBar} />
      <Text style={pdfStyles.sectionTitle}>{children}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  color = PDF_COLORS.primaryBlue,
  subtext,
}: {
  label: string;
  value: string | number;
  color?: string;
  subtext?: string;
}) {
  return (
    <View style={[pdfStyles.metricCard, { borderTopColor: color }]}>
      <Text style={pdfStyles.metricCardLabel}>{label}</Text>
      <Text style={pdfStyles.metricCardValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      {subtext ? <Text style={pdfStyles.metricCardSub}>{subtext}</Text> : null}
    </View>
  );
}

function DataTable({
  headers,
  rows,
  colWidths,
}: {
  headers: string[];
  rows: (string | number)[][];
  colWidths?: string[];
}) {
  const defaultWidth = `${100 / headers.length}%`;
  return (
    <View style={pdfStyles.table}>
      {/* Header Row */}
      <View style={pdfStyles.tableHeaderRow}>
        {headers.map((h, i) => (
          <View
            key={i}
            style={{
              width: colWidths ? colWidths[i] : defaultWidth,
            }}
          >
            <Text
              style={[
                pdfStyles.tableHeaderCell,
                { textAlign: i === 0 ? 'left' : 'right' },
              ]}
            >
              {h}
            </Text>
          </View>
        ))}
      </View>

      {/* Body Rows */}
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={[
            pdfStyles.tableRow,
            {
              backgroundColor:
                ri % 2 === 1 ? PDF_COLORS.tableRowOdd : PDF_COLORS.tableRowEven,
            },
          ]}
        >
          {row.map((cell, ci) => (
            <View
              key={ci}
              style={{
                width: colWidths ? colWidths[ci] : defaultWidth,
              }}
            >
              <Text
                style={[
                  pdfStyles.tableCell,
                  {
                    textAlign: ci === 0 ? 'left' : 'right',
                    color:
                      ci === 0 ? PDF_COLORS.textPrimary : PDF_COLORS.textSecondary,
                  },
                ]}
              >
                {String(cell)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Vector Horizontal Bar Chart
function HorizontalBarChart({
  data,
  title,
  maxBars = 10,
  defaultColor = PDF_COLORS.primaryBlue,
}: {
  data: { name: string; value: number; fill?: string }[];
  title?: string;
  maxBars?: number;
  defaultColor?: string;
}) {
  const sliced = data.slice(0, maxBars);
  const maxVal = Math.max(...sliced.map((d) => d.value), 1);

  return (
    <View style={{ width: '100%', marginBottom: 12 }}>
      {title && <Text style={pdfStyles.subSectionTitle}>{title}</Text>}
      {sliced.map((d, i) => {
        const pct = Math.min(100, Math.max(2, Math.round((d.value / maxVal) * 100)));
        const barColor = d.fill || CHART_PALETTE[i % CHART_PALETTE.length] || defaultColor;
        return (
          <View key={i} style={pdfStyles.barRow}>
            <Text style={pdfStyles.barLabel}>
              {d.name.length > 24 ? d.name.slice(0, 24) + '…' : d.name}
            </Text>
            <View style={pdfStyles.barTrack}>
              <View
                style={[
                  pdfStyles.barFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>
            <Text style={pdfStyles.barValue}>{d.value.toLocaleString()}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Vector Multi-series Line Chart for MoM trend using SVG
function InlineLineChart({
  series,
  title,
  width = 520,
  height = 140,
}: {
  series: { name: string; color: string; points: { x: number; y: number; label: string }[] }[];
  title?: string;
  width?: number;
  height?: number;
}) {
  const PAD = { top: 12, right: 100, bottom: 20, left: 35 };
  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const maxY = Math.max(...allY, 1);
  const xLabels = series[0]?.points.map((p) => p.label) ?? [];
  const toSvgX = (xi: number, total: number) =>
    PAD.left + (total <= 1 ? chartW / 2 : (xi / (total - 1)) * chartW);
  const toSvgY = (y: number) => PAD.top + chartH - (y / maxY) * chartH;

  return (
    <View style={{ width: '100%', marginBottom: 12 }}>
      {title && <Text style={pdfStyles.subSectionTitle}>{title}</Text>}
      <Svg width={width} height={height}>
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PAD.top + chartH - t * chartH;
          return (
            <React.Fragment key={i}>
              <Line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + chartW}
                y2={y}
                stroke={PDF_COLORS.border}
                strokeWidth={0.75}
              />
              <Text
                x={PAD.left - 4}
                y={y + 2.5}
                style={{
                  fontSize: 6,
                  fill: PDF_COLORS.textMuted,
                  textAnchor: 'end',
                }}
              >
                {String(Math.round(t * maxY))}
              </Text>
            </React.Fragment>
          );
        })}

        {/* X axis labels */}
        {xLabels.map((label, xi) => (
          <Text
            key={xi}
            x={toSvgX(xi, xLabels.length)}
            y={PAD.top + chartH + 12}
            style={{
              fontSize: 6.5,
              fill: PDF_COLORS.textMuted,
              textAnchor: 'middle',
            }}
          >
            {label.length > 10 ? label.slice(0, 10) + '…' : label}
          </Text>
        ))}

        {/* Polylines and points */}
        {series.map((s) => {
          const pts = s.points;
          if (pts.length === 0) return null;
          const pointsStr = pts
            .map((p, xi) => `${toSvgX(xi, pts.length)},${toSvgY(p.y)}`)
            .join(' ');
          return (
            <React.Fragment key={s.name}>
              <Polyline
                points={pointsStr}
                stroke={s.color}
                strokeWidth={1.5}
                fill="none"
              />
              {pts.map((p, xi) => (
                <Circle
                  key={xi}
                  cx={toSvgX(xi, pts.length)}
                  cy={toSvgY(p.y)}
                  r={2.5}
                  fill={s.color}
                />
              ))}
            </React.Fragment>
          );
        })}

        {/* Legend */}
        {series.map((s, i) => {
          const legY = PAD.top + i * 14;
          return (
            <React.Fragment key={s.name}>
              <Rect
                x={PAD.left + chartW + 10}
                y={legY + 2}
                width={8}
                height={3}
                fill={s.color}
                rx={1}
              />
              <Text
                x={PAD.left + chartW + 22}
                y={legY + 5.5}
                style={{
                  fontSize: 6.5,
                  fill: PDF_COLORS.textSecondary,
                }}
              >
                {s.name.length > 15 ? s.name.slice(0, 15) + '…' : s.name}
              </Text>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// Vector Lollipop Chart for top alerts
function LollipopChart({
  data,
  title,
  maxBars = 8,
}: {
  data: { name: string; value: number; fill?: string }[];
  title?: string;
  maxBars?: number;
}) {
  const sliced = data.slice(0, maxBars);
  const maxVal = Math.max(...sliced.map((d) => d.value), 1);
  const MAX_STEM = 300;

  return (
    <View style={{ width: '100%', marginBottom: 12 }}>
      {title && <Text style={pdfStyles.subSectionTitle}>{title}</Text>}
      {sliced.map((d, i) => {
        const stemW = Math.max(6, Math.round((d.value / maxVal) * MAX_STEM));
        const color = d.fill || CHART_PALETTE[i % CHART_PALETTE.length];
        return (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 18,
              marginBottom: 3,
            }}
          >
            <Text
              style={{
                width: 140,
                fontSize: PDF_FONT.caption,
                color: PDF_COLORS.textSecondary,
                textAlign: 'right',
                paddingRight: 8,
              }}
            >
              {d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <View
                style={{
                  width: stemW,
                  height: 1.5,
                  backgroundColor: color,
                  opacity: 0.6,
                }}
              />
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: color,
                  marginLeft: -1,
                }}
              />
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: PDF_FONT.small,
                  fontWeight: 'bold',
                  color: PDF_COLORS.textPrimary,
                }}
              >
                {d.value.toLocaleString()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Verdict Distribution cards
function ColorStatRow({
  data,
  total,
}: {
  data: { name: string; value: number; fill?: string }[];
  total: number;
}) {
  return (
    <View style={pdfStyles.statRow}>
      {data.slice(0, 4).map((d, i) => {
        const color = d.fill || CHART_PALETTE[i % CHART_PALETTE.length];
        const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
        return (
          <View key={i} style={[pdfStyles.statCard, { borderLeftColor: color }]}>
            <Text style={pdfStyles.statLabel}>{d.name}</Text>
            <Text style={pdfStyles.statValue}>{d.value.toLocaleString()}</Text>
            <Text style={pdfStyles.statPercent}>{pct}% of total</Text>
          </View>
        );
      })}
    </View>
  );
}

// Stacked Resolution visual bar with legend
function ResolutionVisual({
  statusCounts,
}: {
  statusCounts: { name: string; value: number; fill?: string }[];
}) {
  const total = statusCounts.reduce((s, d) => s + d.value, 0);
  const PALETTE = [PDF_COLORS.low, PDF_COLORS.critical, PDF_COLORS.high, PDF_COLORS.primaryBlue, PDF_COLORS.accentTeal];

  return (
    <View style={{ width: '100%', marginBottom: 14 }}>
      {/* Horizontal Stacked Bar */}
      <View
        style={{
          flexDirection: 'row',
          height: 16,
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: PDF_COLORS.bgMuted,
          marginBottom: 8,
        }}
      >
        {statusCounts.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <View
              key={i}
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: d.fill || PALETTE[i % PALETTE.length],
              }}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {statusCounts.map((d, i) => {
          const color = d.fill || PALETTE[i % PALETTE.length];
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: color,
                  marginRight: 4,
                }}
              />
              <Text style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.textSecondary }}>
                {d.name}:{' '}
                <Text style={{ fontWeight: 'bold', color: PDF_COLORS.textPrimary }}>
                  {d.value.toLocaleString()}
                </Text>{' '}
                ({pct}%)
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Incident Lifecycle Funnel
function FunnelChart({
  stages,
}: {
  stages: { label: string; value: number; color: string }[];
}) {
  const maxVal = Math.max(...stages.map((s) => s.value), 1);
  const MAX_W = 440;

  return (
    <View
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        marginBottom: 14,
      }}
    >
      {stages.map((stage, i) => {
        const barW = Math.max(70, Math.round((stage.value / maxVal) * MAX_W));
        return (
          <View
            key={i}
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              marginBottom: 4,
            }}
          >
            <View
              style={{
                width: barW,
                height: 24,
                backgroundColor: stage.color,
                borderRadius: 3,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: PDF_FONT.small,
                  fontWeight: 'bold',
                  color: PDF_COLORS.textWhite,
                }}
              >
                {stage.value.toLocaleString()}
              </Text>
            </View>
            <Text
              style={{
                fontSize: PDF_FONT.caption,
                color: PDF_COLORS.textSecondary,
                marginTop: 2,
              }}
            >
              {stage.label}
            </Text>
            {i < stages.length - 1 && (
              <View
                style={{
                  width: 1.5,
                  height: 6,
                  backgroundColor: PDF_COLORS.borderMedium,
                  marginTop: 2,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================================
// Main Report Document
// ============================================================

export interface ReportDocumentProps {
  analytics: AnalyticsResult;
  months: MonthSummary[];
  reportingMonth: string;
  accountName?: string;
}

export function ReportDocument({
  analytics,
  months,
  reportingMonth,
  accountName = 'Acme Corp',
}: ReportDocumentProps) {
  const reportLabel =
    months.find((m) => m.key === reportingMonth)?.label ?? reportingMonth;
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const totalPages = 9;

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

  const totalClassCount = classificationDist.reduce((s, d) => s + d.value, 0);

  // Build line chart series from alertsByMonth × top5Classes
  const momSeries = (top5Classes || []).map((cls, ci) => ({
    name: cls,
    color: CHART_PALETTE[ci % CHART_PALETTE.length],
    points: (alertsByMonth || []).map((m, mi) => ({
      x: mi,
      y: typeof m[cls] === 'number' ? (m[cls] as number) : 0,
      label: m.month,
    })),
  }));

  // Funnel stages for incident lifecycle
  const totalDetected = kpis[0]?.value;
  const detected =
    typeof totalDetected === 'number'
      ? totalDetected
      : Number(totalDetected) || 0;
  const investigated = (resolution?.statusCounts || [])
    .filter(
      (s) =>
        !s.name.toLowerCase().includes('undefined') &&
        !s.name.toLowerCase().includes('unknown')
    )
    .reduce((acc, s) => acc + s.value, 0);
  const resolved =
    (resolution?.statusCounts || []).find((s) =>
      s.name.toLowerCase().includes('resolved')
    )?.value ?? 0;
  const actionTaken = Math.round((investigated + resolved) / 2);

  const funnelStages = [
    { label: 'Detected Incidents', value: detected, color: PDF_COLORS.primaryBlue },
    { label: 'Investigated & Triaged', value: investigated, color: PDF_COLORS.accentTeal },
    { label: 'Action Taken', value: actionTaken, color: PDF_COLORS.high },
    { label: 'Resolved & Closed', value: resolved, color: PDF_COLORS.low },
  ];

  return (
    <Document
      title={`EDR Security Report - ${reportLabel}`}
      author="SentinelOne EDR Analytics"
      subject="Monthly Executive Cybersecurity Review"
      keywords="EDR, Security, Threat Intelligence, SentinelOne, Executive Report"
    >
      {/* ============================================================ */}
      {/* PAGE 1: EXECUTIVE COVER                                      */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.coverPage}>
        {/* Top Decorative Blue Bar & Badge */}
        <View>
          <View
            style={{
              width: 48,
              height: 4,
              backgroundColor: PDF_COLORS.primaryBlue,
              borderRadius: 2,
              marginBottom: 20,
            }}
          />
          <View
            style={{
              alignSelf: 'flex-start',
              borderWidth: 1,
              borderColor: PDF_COLORS.bgCoverCardBorder,
              backgroundColor: PDF_COLORS.bgCoverCard,
              borderRadius: 14,
              paddingVertical: 5,
              paddingHorizontal: 12,
              marginBottom: 28,
            }}
          >
            <Text
              style={{
                fontSize: 8,
                color: '#93C5FD',
                fontWeight: 'bold',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              RESTRICTED // MANAGEMENT & EXECUTIVE ACCESS ONLY
            </Text>
          </View>

          {/* Main Title & Subtitle */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: PDF_COLORS.textWhite,
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Monthly EDR{'\n'}Security Report
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#94A3B8',
              lineHeight: 1.4,
              maxWidth: 420,
              marginBottom: 32,
            }}
          >
            Executive Endpoint Threat Detection, Mitigation Velocities, and Infrastructure
            Asset Reconciliation Overview.
          </Text>

          {/* Metadata Block */}
          <View
            style={{
              flexDirection: 'row',
              gap: 24,
              borderTopWidth: 1,
              borderTopColor: PDF_COLORS.bgCoverCardBorder,
              paddingTop: 16,
              marginBottom: 28,
            }}
          >
            <View>
              <Text style={{ fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                Reporting Period
              </Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#E2E8F0' }}>
                {reportLabel}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                Target Account
              </Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#E2E8F0' }}>
                {accountName}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                EDR Platform
              </Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#E2E8F0' }}>
                SentinelOne Singularity
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Executive KPI Strip on Dark Cover */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: PDF_COLORS.bgCoverCardBorder,
            paddingTop: 20,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {[
              {
                label: 'TOTAL INCIDENTS',
                value: detected.toLocaleString(),
                color: '#60A5FA',
              },
              {
                label: 'RESOLVED',
                value: resolved.toLocaleString(),
                color: '#34D399',
              },
              {
                label: 'MALICIOUS',
                value: String(kpis[2]?.value ?? '0'),
                color: '#F87171',
              },
              {
                label: 'COVERAGE',
                value:
                  reconciliation.totalAssets > 0
                    ? `${Math.round(
                        (reconciliation.matched / reconciliation.totalAssets) * 100
                      )}%`
                    : '100%',
                color: '#38BDF8',
              },
            ].map((k) => (
              <View
                key={k.label}
                style={{
                  flex: 1,
                  backgroundColor: PDF_COLORS.bgCoverCard,
                  borderWidth: 1,
                  borderColor: PDF_COLORS.bgCoverCardBorder,
                  borderRadius: 4,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 6.5,
                    color: '#94A3B8',
                    fontWeight: 'bold',
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  {k.label}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: k.color,
                  }}
                >
                  {k.value}
                </Text>
              </View>
            ))}
          </View>

          <Text
            style={{
              fontSize: 7,
              color: '#64748B',
              letterSpacing: 0.3,
            }}
          >
            Generated: {generatedDate} · Confidential Information for Corporate Security Operations
          </Text>
        </View>
      </Page>

      {/* ============================================================ */}
      {/* PAGE 2: TABLE OF CONTENTS                                    */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.page}>
        <PageHeader section="Contents" />
        <SectionTitle>Table of Contents</SectionTitle>

        <Text
          style={{
            fontSize: 9,
            color: PDF_COLORS.textSecondary,
            lineHeight: 1.45,
            marginBottom: 20,
            maxWidth: 480,
          }}
        >
          This document consolidates monthly cybersecurity telemetry captured by
          SentinelOne agents across enterprise endpoints. The following sections
          detail incident activity, threat vectors, persistent infrastructure hotspots,
          and IT inventory reconciliation.
        </Text>

        {/* TOC Items with dotted leaders */}
        <View style={{ width: '100%', marginBottom: 28 }}>
          {[
            ['01', 'Executive Summary', 'Key performance metrics, classification breakdown & verdict distribution', '3'],
            ['02', 'Alert Analysis & MoM Trends', 'Month-over-month telemetry comparison & high-frequency alerts', '4'],
            ['03', 'Endpoint Detections & Density', 'Endpoints generating the highest threat & alert frequencies', '5'],
            ['04', 'Regional Threat Hotspots', 'Geographical and site-level alert volumes and risk scoring', '6'],
            ['05', 'Persistent Risky Endpoints', 'Endpoints exhibiting recurring detections across multiple cycles', '7'],
            ['06', 'Incident Resolution Status', 'Triage velocities, resolution status distributions & trends', '8'],
            ['07', 'Asset Reconciliation', 'Coverage alignment between IT asset inventory and active EDR agents', '9'],
          ].map(([num, title, desc, pg]) => (
            <View
              key={pg}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: PDF_COLORS.border,
              }}
            >
              <Text
                style={{
                  width: 28,
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: PDF_COLORS.primaryBlue,
                }}
              >
                {num}
              </Text>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text
                  style={{
                    fontSize: 9.5,
                    fontWeight: 'bold',
                    color: PDF_COLORS.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  {title}
                </Text>
                <Text style={{ fontSize: 7.5, color: PDF_COLORS.textMuted }}>
                  {desc}
                </Text>
              </View>
              <View
                style={{
                  width: 32,
                  height: 22,
                  borderRadius: 3,
                  backgroundColor: PDF_COLORS.bgMuted,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 8.5,
                    fontWeight: 'bold',
                    color: PDF_COLORS.textPrimary,
                  }}
                >
                  {pg}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Security Statement Box */}
        <View
          style={{
            backgroundColor: PDF_COLORS.bgSection,
            borderWidth: 1,
            borderColor: PDF_COLORS.border,
            borderLeftWidth: 3,
            borderLeftColor: PDF_COLORS.primaryNavy,
            borderRadius: 4,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontWeight: 'bold',
              color: PDF_COLORS.textPrimary,
              marginBottom: 3,
            }}
          >
            Security Compliance Notice
          </Text>
          <Text style={{ fontSize: 7.5, color: PDF_COLORS.textSecondary, lineHeight: 1.4 }}>
            All metrics and findings in this report represent point-in-time telemetry.
            Unmitigated detections should be reviewed with the SOC lead according to Incident
            Response SOP §4.2.
          </Text>
        </View>

        <PageFooter page={2} total={totalPages} />
      </Page>

      {/* ============================================================ */}
      {/* PAGE 3: EXECUTIVE SUMMARY                                    */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.page}>
        <PageHeader section="Executive Summary" />
        <SectionTitle>Executive Summary</SectionTitle>

        {/* 4 Metric Cards */}
        <View style={pdfStyles.metricGrid}>
          {kpis.slice(0, 4).map((k, i) => {
            const cardColors = [
              PDF_COLORS.primaryBlue,
              PDF_COLORS.low,
              PDF_COLORS.critical,
              PDF_COLORS.accentSky,
            ];
            return (
              <MetricCard
                key={k.label}
                label={String(k.label)}
                value={k.value}
                color={cardColors[i % cardColors.length]}
                subtext={k.previous ? `vs Prev: ${k.previous}` : undefined}
              />
            );
          })}
        </View>

        {/* Classification Breakdown */}
        <HorizontalBarChart
          data={classificationDist}
          title="Alert Classification Breakdown"
          maxBars={8}
          defaultColor={PDF_COLORS.primaryBlue}
        />

        {/* Analyst Verdict Distribution */}
        <Text style={pdfStyles.subSectionTitle}>Analyst Verdict Distribution</Text>
        <ColorStatRow data={analystVerdictDist} total={totalClassCount} />

        {/* Detecting Engines */}
        <HorizontalBarChart
          data={topEngines}
          title="Top Detecting Engines"
          maxBars={6}
          defaultColor={PDF_COLORS.accentTeal}
        />

        <PageFooter page={3} total={totalPages} />
      </Page>

      {/* ============================================================ */}
      {/* PAGE 4: ALERT ANALYSIS (MONTH-OVER-MONTH)                    */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.page}>
        <PageHeader section="Alert Analysis" />
        <SectionTitle>Alert Analysis — Month-over-Month</SectionTitle>

        {/* Multi-series SVG Line Chart */}
        {momSeries.length > 0 && alertsByMonth.length > 1 && (
          <InlineLineChart
            series={momSeries}
            title="Month-over-Month Trajectory — Top 5 Classifications"
            width={520}
            height={130}
          />
        )}

        {/* Lollipop Top 10 Alerts */}
        <LollipopChart
          data={top10Alerts}
          title="Top 10 Most Common Alert Types"
          maxBars={8}
        />

        {/* MoM Change Detail Table */}
        <Text style={pdfStyles.subSectionTitle}>Month-over-Month Change Detail</Text>
        <DataTable
          headers={['Classification', 'Current', 'Previous', 'Delta', 'Change %']}
          colWidths={['40%', '15%', '15%', '15%', '15%']}
          rows={alertTrend.slice(0, 8).map((r) => [
            r.classification,
            r.current.toLocaleString(),
            r.previous.toLocaleString(),
            r.delta > 0 ? `+${r.delta}` : String(r.delta),
            `${r.deltaPercent > 0 ? '+' : ''}${r.deltaPercent}%`,
          ])}
        />

        <PageFooter page={4} total={totalPages} />
      </Page>

      {/* ============================================================ */}
      {/* PAGE 5: ENDPOINT SUMMARY                                     */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.page}>
        <PageHeader section="Endpoint Summary" />
        <SectionTitle>Top Endpoints by Detections</SectionTitle>

        <Text
          style={{
            fontSize: 8.5,
            color: PDF_COLORS.textSecondary,
            lineHeight: 1.4,
            marginBottom: 12,
          }}
        >
          Endpoints exhibiting the highest concentration of threat activity and security
          telemetry during the reporting period. High counts typically indicate localized
          infection, aggressive developer tooling, or compromised credentials.
        </Text>

        <HorizontalBarChart
          data={topEndpoints.slice(0, 15).map((e) => ({
            name: e.endpoint,
            value: e.count,
          }))}
          maxBars={15}
          defaultColor={PDF_COLORS.primaryBlue}
        />

        {/* Callout Info */}
        <View
          style={{
            backgroundColor: PDF_COLORS.bgMuted,
            borderWidth: 1,
            borderColor: PDF_COLORS.border,
            borderRadius: 4,
            padding: 10,
            marginTop: 6,
          }}
        >
          <Text style={{ fontSize: 7.5, color: PDF_COLORS.textSecondary }}>
            Action Note: Endpoints showing over 50 alerts require automated containment
            or dedicated forensic examination.
          </Text>
        </View>

        <PageFooter page={5} total={totalPages} />
      </Page>

      {/* ============================================================ */}
      {/* PAGE 6: REGIONAL THREAT HOTSPOTS                             */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.page}>
        <PageHeader section="Regional Threat Hotspots" />
        <SectionTitle>Regional Threat Hotspots</SectionTitle>

        <HorizontalBarChart
          data={siteRisks.map((s) => ({
            name: s.site,
            value: s.current,
          }))}
          title="Incident Volume by Site Location"
          maxBars={10}
          defaultColor={PDF_COLORS.accentSky}
        />

        <Text style={pdfStyles.subSectionTitle}>Site Risk Scores & Velocity</Text>
        <DataTable
          headers={['Site / Office', 'Current', 'Previous', 'Delta', 'Risk Score']}
          colWidths={['36%', '16%', '16%', '16%', '16%']}
          rows={siteRisks.slice(0, 10).map((s) => [
            s.site,
            s.current.toLocaleString(),
            s.previous.toLocaleString(),
            s.delta > 0 ? `+${s.delta}` : String(s.delta),
            s.riskScore,
          ])}
        />

        <PageFooter page={6} total={totalPages} />
      </Page>

      {/* ============================================================ */}
      {/* PAGE 7: PERSISTENT RISKY ENDPOINTS                           */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.page}>
        <PageHeader section="Persistent Endpoints" />
        <SectionTitle>Persistent Risky Endpoints</SectionTitle>

        <Text
          style={{
            fontSize: 8.5,
            color: PDF_COLORS.textSecondary,
            lineHeight: 1.4,
            marginBottom: 12,
          }}
        >
          Endpoints repeatedly flagged across multiple consecutive months indicate chronic
          vulnerabilities, unpatched software, or unresolved malware infections.
        </Text>

        {recurringEndpoints.length === 0 ? (
          <View
            style={{
              padding: 24,
              backgroundColor: PDF_COLORS.bgSection,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: PDF_COLORS.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 9, color: PDF_COLORS.textSecondary }}>
              No persistent or recurring risky endpoints detected across the current dataset.
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            <HorizontalBarChart
              data={recurringEndpoints.slice(0, 8).map((e) => ({
                name: e.endpoint,
                value: e.totalIncidents,
              }))}
              title="Top Recurring Endpoints — Total Cumulative Incidents"
              maxBars={8}
              defaultColor={PDF_COLORS.critical}
            />

            <Text style={pdfStyles.subSectionTitle}>Recurring Endpoints Summary Table</Text>
            <DataTable
              headers={['Rank', 'Endpoint Name', 'Active Months', 'Total Incidents', 'Risk Score']}
              colWidths={['12%', '40%', '16%', '16%', '16%']}
              rows={recurringEndpoints.slice(0, 10).map((e, i) => [
                `#${i + 1}`,
                e.endpoint,
                `${e.monthsAppeared} mos`,
                e.totalIncidents.toLocaleString(),
                e.rankScore,
              ])}
            />
          </View>
        )}

        <PageFooter page={7} total={totalPages} />
      </Page>

      {/* ============================================================ */}
      {/* PAGE 8: INCIDENT RESOLUTION STATUS                           */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.page}>
        <PageHeader section="Incident Resolution" />
        <SectionTitle>Incident Resolution Status</SectionTitle>

        {/* Funnel */}
        <Text style={pdfStyles.subSectionTitle}>Incident Lifecycle Funnel</Text>
        <FunnelChart stages={funnelStages} />

        {/* Resolution Breakdown */}
        <Text style={pdfStyles.subSectionTitle}>Resolution Status Breakdown</Text>
        <ResolutionVisual statusCounts={resolution.statusCounts} />

        {/* Trend Table */}
        <Text style={pdfStyles.subSectionTitle}>Monthly Resolution Trend</Text>
        <DataTable
          headers={['Reporting Month', 'Resolved', 'Unresolved', 'In Progress']}
          colWidths={['34%', '22%', '22%', '22%']}
          rows={resolution.trendByMonth.map((t) => [
            t.month,
            t.resolved.toLocaleString(),
            t.unresolved.toLocaleString(),
            t.inProgress.toLocaleString(),
          ])}
        />

        <PageFooter page={8} total={totalPages} />
      </Page>

      {/* ============================================================ */}
      {/* PAGE 9: ASSET RECONCILIATION                                 */}
      {/* ============================================================ */}
      <Page size="A4" style={pdfStyles.page}>
        <PageHeader section="Asset Reconciliation" />
        <SectionTitle>Infra ↔ EDR Asset Reconciliation</SectionTitle>

        {/* 4 Metric Cards */}
        <View style={pdfStyles.metricGrid}>
          <MetricCard
            label="Total Assets"
            value={reconciliation.totalAssets}
            color={PDF_COLORS.primaryNavy}
          />
          <MetricCard
            label="Matched / Protected"
            value={reconciliation.matched}
            color={PDF_COLORS.low}
          />
          <MetricCard
            label="Unprotected"
            value={reconciliation.unprotected}
            color={PDF_COLORS.critical}
          />
          <MetricCard
            label="Ghost Agents"
            value={reconciliation.ghostAgents}
            color={PDF_COLORS.high}
          />
        </View>

        {/* Coverage Progress Bar */}
        {reconciliation.totalAssets > 0 && (
          <View style={{ width: '100%', marginBottom: 14 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.textSecondary }}>
                EDR Agent Deployment Coverage
              </Text>
              <Text style={{ fontSize: PDF_FONT.caption, fontWeight: 'bold', color: PDF_COLORS.textPrimary }}>
                {Math.round((reconciliation.matched / reconciliation.totalAssets) * 100)}% Protected
              </Text>
            </View>
            <View
              style={{
                height: 10,
                backgroundColor: PDF_COLORS.bgMuted,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.round(
                    (reconciliation.matched / reconciliation.totalAssets) * 100
                  )}%`,
                  backgroundColor: PDF_COLORS.low,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        )}

        {/* Unprotected Assets Tag Grid */}
        {reconciliation.unprotectedAssets.length > 0 && (
          <View style={{ width: '100%' }}>
            <Text style={pdfStyles.subSectionTitle}>
              Unprotected Assets (Missing EDR Agent)
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 5,
                width: '100%',
              }}
            >
              {reconciliation.unprotectedAssets.slice(0, 36).map((tag, i) => (
                <View
                  key={i}
                  style={{
                    width: '23.5%',
                    backgroundColor: PDF_COLORS.bgMuted,
                    borderWidth: 1,
                    borderColor: PDF_COLORS.border,
                    borderRadius: 3,
                    paddingVertical: 3.5,
                    paddingHorizontal: 4,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 6.5,
                      color: PDF_COLORS.textSecondary,
                      fontFamily: 'Helvetica',
                    }}
                  >
                    {tag.length > 16 ? tag.slice(0, 16) + '…' : tag}
                  </Text>
                </View>
              ))}
            </View>
            {reconciliation.unprotectedAssets.length > 36 && (
              <Text
                style={{
                  fontSize: 7,
                  color: PDF_COLORS.textMuted,
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                +{reconciliation.unprotectedAssets.length - 36} additional unprotected assets omitted. Export full inventory on dashboard.
              </Text>
            )}
          </View>
        )}

        <PageFooter page={9} total={totalPages} />
      </Page>
    </Document>
  );
}
