import React from 'react';
import type { AnalyticsResult } from '@/types';
import type { MonthSummary } from '@/types';
import { pageStyle, coverStyle, contentPadding, PDF_COLORS, PDF_FONT, A4 } from './pdfStyles';

// ============================================================
// Sub-components
// ============================================================
function PageHeader({ section }: { section: string }) {
  return (
    <div style={{
      position: 'relative', left: 0, right: 0,
      height: 36,
      background: PDF_COLORS.tableHeader,
      borderBottom: `1px solid ${PDF_COLORS.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `0 ${A4.margin}px`,
      marginBottom: 0,
    }}>
      <span style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.muted, fontWeight: 600, letterSpacing: '0.05em' }}>
        EDR MONTHLY REPORT
      </span>
      <span style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.textSecondary }}>{section}</span>
    </div>
  );
}

function PageFooter({ page, total }: { page: number; total: number }) {
  return (
    <div style={{
      height: 32,
      borderTop: `1px solid ${PDF_COLORS.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `0 ${A4.margin}px`,
      marginTop: 24,
      width: '100%',
    }}>
      <span style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.muted }}>
        Confidential — Internal Use Only
      </span>
      <span style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.textSecondary }}>
        Page {page} of {total}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, width: '100%' }}>
      <div style={{ width: 4, height: 24, background: PDF_COLORS.accent, borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{ margin: 0, fontSize: PDF_FONT.h2, fontWeight: 700, color: PDF_COLORS.text }}>{children}</h2>
    </div>
  );
}

function MetricCard({ label, value, color = PDF_COLORS.accent }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      background: PDF_COLORS.tableHeader,
      border: `1px solid ${PDF_COLORS.border}`,
      borderRadius: 8,
      borderTop: `3px solid ${color}`,
      padding: '14px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: PDF_FONT.small, color: PDF_COLORS.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: PDF_FONT.h1, fontWeight: 700, color: PDF_COLORS.text }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: PDF_FONT.small }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={{
              background: PDF_COLORS.tableHeader, color: PDF_COLORS.textSecondary,
              padding: '7px 10px', textAlign: i === 0 ? 'left' : 'right',
              borderBottom: `2px solid ${PDF_COLORS.border}`, fontWeight: 600,
              fontSize: PDF_FONT.caption,
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 1 ? PDF_COLORS.tableAlt : PDF_COLORS.bgPage }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                padding: '6px 10px',
                textAlign: ci === 0 ? 'left' : 'right',
                borderBottom: `1px solid ${PDF_COLORS.border}`,
                color: ci === 0 ? PDF_COLORS.text : PDF_COLORS.textSecondary,
              }}>
                {String(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Inline horizontal bar chart — pure HTML, captured by html2canvas
function HorizontalBarChart({
  data,
  title,
  maxBars = 10,
}: {
  data: { name: string; value: number; fill?: string }[];
  title?: string;
  maxBars?: number;
}) {
  const sliced = data.slice(0, maxBars);
  const maxVal = Math.max(...sliced.map((d) => d.value), 1);
  const PALETTE = ['#8B5CF6','#10B981','#06B6D4','#F59E0B','#EF4444','#F43F5E','#3B82F6','#A78BFA'];
  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 10, marginTop: 0 }}>{title}</h3>
      )}
      {sliced.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 150, fontSize: PDF_FONT.caption, color: PDF_COLORS.textSecondary,
            textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }} title={d.name}>
            {d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name}
          </div>
          <div style={{ flex: 1, background: PDF_COLORS.border, borderRadius: 3, height: 18, position: 'relative' }}>
            <div style={{
              width: `${(d.value / maxVal) * 100}%`,
              height: '100%',
              background: d.fill ?? PALETTE[i % PALETTE.length],
              borderRadius: 3,
            }} />
          </div>
          <div style={{ width: 36, fontSize: PDF_FONT.small, color: PDF_COLORS.text, textAlign: 'right', fontWeight: 600 }}>
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// Inline SVG multi-series line chart for MoM trend
function InlineLineChart({
  series,
  title,
  width = 640,
  height = 180,
}: {
  series: { name: string; color: string; points: { x: number; y: number; label: string }[] }[];
  title?: string;
  width?: number;
  height?: number;
}) {
  const PAD = { top: 16, right: 80, bottom: 32, left: 40 };
  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const maxY = Math.max(...allY, 1);
  const xLabels = series[0]?.points.map((p) => p.label) ?? [];
  const toSvgX = (xi: number, total: number) =>
    PAD.left + (total <= 1 ? chartW / 2 : (xi / (total - 1)) * chartW);
  const toSvgY = (y: number) => PAD.top + chartH - (y / maxY) * chartH;

  return (
    <div>
      {title && (
        <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 10, marginTop: 0 }}>{title}</h3>
      )}
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PAD.top + chartH - t * chartH;
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke={PDF_COLORS.border} strokeWidth={1} />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end"
                fontSize={8} fill={PDF_COLORS.muted}>
                {Math.round(t * maxY)}
              </text>
            </g>
          );
        })}
        {/* X axis labels */}
        {xLabels.map((label, xi) => (
          <text key={xi}
            x={toSvgX(xi, xLabels.length)} y={PAD.top + chartH + 18}
            textAnchor="middle" fontSize={8} fill={PDF_COLORS.muted}>
            {label.length > 12 ? label.slice(0, 12) + '…' : label}
          </text>
        ))}
        {/* Series */}
        {series.map((s) => {
          const pts = s.points;
          if (pts.length === 0) return null;
          const polyline = pts.map((p, xi) =>
            `${toSvgX(xi, pts.length)},${toSvgY(p.y)}`
          ).join(' ');
          return (
            <g key={s.name}>
              <polyline points={polyline} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              {pts.map((p, xi) => (
                <circle key={xi} cx={toSvgX(xi, pts.length)} cy={toSvgY(p.y)} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}
        {/* Legend */}
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${PAD.left + chartW + 8}, ${PAD.top + i * 16})`}>
            <rect width={10} height={3} y={4} fill={s.color} rx={1.5} />
            <text x={14} y={10} fontSize={8} fill={PDF_COLORS.textSecondary}>
              {s.name.length > 18 ? s.name.slice(0, 18) + '…' : s.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// Lollipop chart for top 10 alerts (stem + dot)
function LollipopChart({
  data,
  title,
}: {
  data: { name: string; value: number; fill?: string }[];
  title?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const PALETTE = ['#8B5CF6','#10B981','#06B6D4','#F59E0B','#EF4444','#F43F5E','#3B82F6','#A78BFA'];
  const BAR_W = 460;
  const ROW_H = 26;
  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 10, marginTop: 0 }}>{title}</h3>
      )}
      {data.map((d, i) => {
        const stemW = Math.max(4, Math.round((d.value / maxVal) * BAR_W));
        const color = d.fill ?? PALETTE[i % PALETTE.length];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: ROW_H, marginBottom: 4 }}>
            <div style={{
              width: 140, fontSize: PDF_FONT.caption, color: PDF_COLORS.textSecondary,
              textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }} title={d.name}>
              {d.name.length > 20 ? d.name.slice(0, 20) + '…' : d.name}
            </div>
            {/* Stem */}
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: stemW, height: 2, background: color, opacity: 0.5,
              }} />
              {/* Dot */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: color, flexShrink: 0,
                marginLeft: -1,
              }} />
              {/* Value label */}
              <span style={{
                marginLeft: 6, fontSize: PDF_FONT.small, fontWeight: 700,
                color: PDF_COLORS.text,
              }}>{d.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Pie / donut summary as coloured stat boxes
function ColorStatRow({ data, total }: { data: { name: string; value: number; fill?: string }[]; total: number }) {
  const PALETTE = ['#8B5CF6','#10B981','#06B6D4','#F59E0B','#EF4444','#F43F5E','#3B82F6','#A78BFA'];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, width: '100%' }}>
      {data.slice(0, 8).map((d, i) => (
        <div key={i} style={{
          border: `1px solid ${PDF_COLORS.border}`,
          borderLeft: `4px solid ${d.fill ?? PALETTE[i % PALETTE.length]}`,
          borderRadius: 6,
          padding: '8px 14px',
          minWidth: 110,
          background: PDF_COLORS.tableHeader,
        }}>
          <div style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.muted, marginBottom: 4 }}>{d.name}</div>
          <div style={{ fontSize: PDF_FONT.h2, fontWeight: 700, color: PDF_COLORS.text }}>{d.value}</div>
          <div style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.muted, marginTop: 2 }}>
            {total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

// Inline progress-bar style resolution chart
function ResolutionVisual({ statusCounts }: { statusCounts: { name: string; value: number; fill?: string }[] }) {
  const total = statusCounts.reduce((s, d) => s + d.value, 0);
  const PALETTE = ['#10B981','#EF4444','#F59E0B','#8B5CF6','#06B6D4'];
  return (
    <div style={{ width: '100%' }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 22, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        {statusCounts.map((d, i) => (
          <div key={i} style={{
            flex: d.value,
            background: d.fill ?? PALETTE[i % PALETTE.length],
          }} title={`${d.name}: ${d.value}`} />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {statusCounts.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: d.fill ?? PALETTE[i % PALETTE.length] }} />
            <span style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.textSecondary }}>
              {d.name}: <strong style={{ color: PDF_COLORS.text }}>{d.value}</strong>
              {total > 0 && <span style={{ color: PDF_COLORS.muted }}> ({((d.value / total) * 100).toFixed(1)}%)</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Funnel chart: proportionally-sized centered horizontal bars
function FunnelChart({ stages }: { stages: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...stages.map((s) => s.value), 1);
  const MAX_BAR_W = 500;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
      {stages.map((stage, i) => {
        const barW = Math.max(60, Math.round((stage.value / maxVal) * MAX_BAR_W));
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{
              width: barW, height: 32, background: stage.color,
              borderRadius: 4, display: 'flex', alignItems: 'center',
              justifyContent: 'center', position: 'relative',
            }}>
              <span style={{ fontSize: PDF_FONT.small, fontWeight: 700, color: '#fff' }}>
                {stage.value.toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.textSecondary, marginTop: 4 }}>
              {stage.label}
            </div>
            {i < stages.length - 1 && (
              <div style={{ width: 2, height: 10, background: PDF_COLORS.border, marginTop: 4 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Report Document
// ============================================================
interface ReportDocumentProps {
  analytics: AnalyticsResult;
  months: MonthSummary[];
  reportingMonth: string;
  accountName?: string;
}

export function ReportDocument({ analytics, months, reportingMonth, accountName = 'Acme Corp' }: ReportDocumentProps) {
  const reportLabel = months.find((m) => m.key === reportingMonth)?.label ?? reportingMonth;
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalPages = 9;

  const { kpis, classificationDist, analystVerdictDist, topEngines, alertTrend, top10Alerts,
    topEndpoints, siteRisks, recurringEndpoints, resolution, reconciliation,
    top5Classes, alertsByMonth } = analytics;

  const totalClassCount = classificationDist.reduce((s, d) => s + d.value, 0);

  // Apply flex column layout with flex-start alignment to prevent children stretching
  const contentStyle: React.CSSProperties = { 
    ...contentPadding, 
    paddingTop: 32, 
    paddingBottom: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  };

  // Build line chart series from alertsByMonth × top5Classes
  const PALETTE = ['#8B5CF6','#10B981','#06B6D4','#F59E0B','#EF4444'];
  const momSeries = top5Classes.map((cls, ci) => ({
    name: cls,
    color: PALETTE[ci % PALETTE.length],
    points: alertsByMonth.map((m) => ({
      x: ci,
      y: typeof m[cls] === 'number' ? (m[cls] as number) : 0,
      label: m.month,
    })),
  }));

  // Funnel stages for incident lifecycle
  const totalDetected = kpis[0]?.value;
  const detected = typeof totalDetected === 'number' ? totalDetected : 0;
  const investigated = resolution.statusCounts.filter((s) =>
    !s.name.toLowerCase().includes('undefined') && !s.name.toLowerCase().includes('unknown')
  ).reduce((acc, s) => acc + s.value, 0);
  const resolved = resolution.statusCounts.find((s) => s.name.toLowerCase().includes('resolved'))?.value ?? 0;
  const actionTaken = Math.round((investigated + resolved) / 2); // approximation
  const funnelStages = [
    { label: 'Detected', value: detected, color: '#8B5CF6' },
    { label: 'Investigated', value: investigated, color: '#06B6D4' },
    { label: 'Action Taken', value: actionTaken, color: '#F59E0B' },
    { label: 'Resolved', value: resolved, color: '#10B981' },
  ];

  return (
    <div className="pdf-report" style={{ position: 'absolute', left: '-9999px', top: 0 }}>

      {/* =================== PAGE 1: COVER =================== */}
      <div className="pdf-page" style={coverStyle}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          background: 'transparent',
          border: '1px solid rgba(124,58,237,0.5)',
          borderRadius: 16,
          padding: '6px 16px',
          marginBottom: 40,
        }}>
          <span style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Confidential · Internal Use
          </span>
        </div>

        {/* Title block */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0, lineHeight: 1.2, color: '#FFFFFF' }}>
            Monthly EDR<br />Security Report
          </h1>
          <div style={{ marginTop: 20, lineHeight: 1.5 }}>
            <div style={{ fontSize: PDF_FONT.h2, color: '#A78BFA', fontWeight: 500, lineHeight: 1.5, paddingBottom: 6 }}>
              Reporting Period: {reportLabel}
            </div>
            <div style={{ fontSize: PDF_FONT.body, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, paddingBottom: 4 }}>
              Account: {accountName}
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, width: '100%' }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'TOTAL INCIDENTS', value: String(kpis[0]?.value ?? '—') },
              { label: 'RESOLVED', value: String(kpis[1]?.value ?? '—') },
              { label: 'MALICIOUS', value: String(kpis[2]?.value ?? '—') },
            ].map((s) => (
              <div key={s.label} style={{ lineHeight: 1.4 }}>
                <div style={{ fontSize: PDF_FONT.h1, fontWeight: 700, color: '#A78BFA', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: PDF_FONT.small, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: PDF_FONT.caption, color: 'rgba(255,255,255,0.3)', marginTop: 24, lineHeight: 1.5 }}>
            Generated: {generatedDate} · SentinelOne EDR Analytics Dashboard
          </div>
        </div>
      </div>

      {/* =================== PAGE 2: TABLE OF CONTENTS =================== */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader section="Contents" />
        <div style={contentStyle}>
          <SectionTitle>Table of Contents</SectionTitle>
          <div style={{ width: '100%' }}>
            {[
              [3, 'Executive Summary'],
              [4, 'Alert Analysis'],
              [5, 'Endpoint Summary'],
              [6, 'Regional Threat Hotspot'],
              [7, 'Persistent Risky Endpoints'],
              [8, 'Incident Resolution Status'],
              [9, 'Asset Reconciliation'],
            ].map(([pg, title]) => (
              <div key={String(pg)} style={{
                display: 'flex', alignItems: 'center', padding: '10px 0',
                borderBottom: `1px solid ${PDF_COLORS.border}`,
                width: '100%',
              }}>
                <span style={{ flex: 1, fontSize: PDF_FONT.body, color: PDF_COLORS.text }}>{title}</span>
                <span style={{ fontSize: PDF_FONT.body, color: PDF_COLORS.muted, fontWeight: 600 }}>{pg}</span>
              </div>
            ))}
          </div>
        </div>
        <PageFooter page={2} total={totalPages} />
      </div>

      {/* =================== PAGE 3: EXECUTIVE SUMMARY =================== */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader section="Executive Summary" />
        <div style={contentStyle}>
          <SectionTitle>Executive Summary</SectionTitle>
          {/* KPI cards */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, width: '100%' }}>
            {kpis.slice(0, 4).map((k) => (
              <MetricCard key={k.label} label={String(k.label)} value={k.value}
                color={k.color ?? PDF_COLORS.accent} />
            ))}
          </div>

          {/* Classification chart */}
          <HorizontalBarChart
            data={classificationDist}
            title="Alert Classification Breakdown"
            maxBars={8}
          />

          {/* Analyst verdict colour-stat row */}
          <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 8, marginTop: 20 }}>
            Analyst Verdict Distribution
          </h3>
          <ColorStatRow data={analystVerdictDist} total={totalClassCount} />

          {/* Top engines */}
          <HorizontalBarChart
            data={topEngines}
            title="Top Detecting Engines"
            maxBars={6}
          />
        </div>
        <PageFooter page={3} total={totalPages} />
      </div>

      {/* =================== PAGE 4: ALERT ANALYSIS =================== */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader section="Alert Analysis" />
        <div style={contentStyle}>
          <SectionTitle>Alert Analysis — Month-over-Month</SectionTitle>

          {/* Multi-series line chart — primary */}
          {momSeries.length > 0 && alertsByMonth.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <InlineLineChart
                series={momSeries}
                title="Month-over-Month Trend — Top 5 Classifications"
                width={680}
                height={200}
              />
            </div>
          )}

          {/* Lollipop chart for top 10 */}
          <div style={{ marginBottom: 20, width: '100%' }}>
            <LollipopChart
              data={top10Alerts}
              title="Top 10 Most Common Alerts"
            />
          </div>

          {/* MoM table for detail — secondary */}
          <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 8, marginTop: 16 }}>
            Month-over-Month Change Detail
          </h3>
          <div style={{ width: '100%' }}>
            <DataTable
              headers={['Classification', 'Current', 'Previous', 'Delta', 'Change %']}
              rows={alertTrend.slice(0, 10).map((r) => [
                r.classification, r.current, r.previous,
                r.delta > 0 ? `+${r.delta}` : String(r.delta),
                `${r.deltaPercent > 0 ? '+' : ''}${r.deltaPercent}%`,
              ])}
            />
          </div>
        </div>
        <PageFooter page={4} total={totalPages} />
      </div>

      {/* =================== PAGE 5: ENDPOINT SUMMARY =================== */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader section="Endpoint Summary" />
        <div style={contentStyle}>
          <SectionTitle>Top Endpoints by Detections</SectionTitle>
          <HorizontalBarChart
            data={topEndpoints.slice(0, 15).map((e) => ({ name: e.endpoint, value: e.count }))}
            maxBars={15}
          />
        </div>
        <PageFooter page={5} total={totalPages} />
      </div>

      {/* =================== PAGE 6: REGIONAL =================== */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader section="Regional Threat Hotspot" />
        <div style={contentStyle}>
          <SectionTitle>Regional Threat Hotspot</SectionTitle>
          <HorizontalBarChart
            data={siteRisks.map((s) => ({ name: s.site, value: s.current }))}
            title="Alert Volume by Site — Current vs Previous"
            maxBars={12}
          />
          <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 8, marginTop: 16 }}>
            Site Risk Scores
          </h3>
          <div style={{ width: '100%' }}>
            <DataTable
              headers={['Site', 'Current', 'Previous', 'Delta', 'Risk Score']}
              rows={siteRisks.slice(0, 10).map((s) => [
                s.site, s.current, s.previous,
                s.delta > 0 ? `+${s.delta}` : String(s.delta),
                s.riskScore,
              ])}
            />
          </div>
        </div>
        <PageFooter page={6} total={totalPages} />
      </div>

      {/* =================== PAGE 7: PERSISTENT =================== */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader section="Persistent Risky Endpoints" />
        <div style={contentStyle}>
          <SectionTitle>Persistent Risky Endpoints</SectionTitle>
          {recurringEndpoints.length === 0 ? (
            <p style={{ color: PDF_COLORS.textSecondary, fontSize: PDF_FONT.body }}>
              No recurring endpoints detected in the current dataset.
            </p>
          ) : (
            <div style={{ width: '100%' }}>
              <HorizontalBarChart
                data={recurringEndpoints.slice(0, 10).map((e) => ({ name: e.endpoint, value: e.totalIncidents }))}
                title="Top Recurring Endpoints — Total Incidents"
                maxBars={10}
              />
              <div style={{ marginTop: 24 }}>
                <DataTable
                  headers={['Rank', 'Endpoint', 'Months Active', 'Total Incidents', 'Score']}
                  rows={recurringEndpoints.slice(0, 15).map((e, i) => [
                    `#${i + 1}`, e.endpoint, e.monthsAppeared, e.totalIncidents, e.rankScore,
                  ])}
                />
              </div>
            </div>
          )}
        </div>
        <PageFooter page={7} total={totalPages} />
      </div>

      {/* =================== PAGE 8: RESOLUTION =================== */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader section="Incident Resolution" />
        <div style={contentStyle}>
          <SectionTitle>Incident Resolution Status</SectionTitle>

          {/* Funnel — lifecycle primary visual */}
          <div style={{ marginBottom: 24, width: '100%' }}>
            <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 12, marginTop: 0 }}>
              Incident Lifecycle Funnel
            </h3>
            <FunnelChart stages={funnelStages} />
          </div>

          {/* Visual stacked bar */}
          <div style={{ marginBottom: 20, width: '100%' }}>
            <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 8, marginTop: 0 }}>
              Resolution Status Breakdown
            </h3>
            <ResolutionVisual statusCounts={resolution.statusCounts} />
          </div>

          {/* Trend table */}
          <h3 style={{ fontSize: PDF_FONT.h3, fontWeight: 600, color: PDF_COLORS.text, marginBottom: 8, marginTop: 12 }}>
            Monthly Resolution Trend
          </h3>
          <div style={{ width: '100%' }}>
            <DataTable
              headers={['Month', 'Resolved', 'Unresolved', 'In Progress']}
              rows={resolution.trendByMonth.map((t) => [t.month, t.resolved, t.unresolved, t.inProgress])}
            />
          </div>
        </div>
        <PageFooter page={8} total={totalPages} />
      </div>

      {/* =================== PAGE 9: RECONCILIATION =================== */}
      <div className="pdf-page" style={pageStyle}>
        <PageHeader section="Asset Reconciliation" />
        <div style={contentStyle}>
          <SectionTitle>Infra ↔ EDR Asset Reconciliation</SectionTitle>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%' }}>
            <MetricCard label="Total Assets" value={reconciliation.totalAssets} color={PDF_COLORS.medium} />
            <MetricCard label="Matched" value={reconciliation.matched} color={PDF_COLORS.low} />
            <MetricCard label="Unprotected" value={reconciliation.unprotected} color={PDF_COLORS.critical} />
            <MetricCard label="Ghost Agents" value={reconciliation.ghostAgents} color={PDF_COLORS.high} />
          </div>
          {/* Coverage bar */}
          {reconciliation.totalAssets > 0 && (
            <div style={{ marginBottom: 16, width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: PDF_FONT.small, color: PDF_COLORS.textSecondary }}>
                <span>EDR Coverage</span>
                <span style={{ fontWeight: 700, color: PDF_COLORS.text }}>
                  {Math.round((reconciliation.matched / reconciliation.totalAssets) * 100)}%
                </span>
              </div>
              <div style={{ height: 12, background: PDF_COLORS.border, borderRadius: 4, width: '100%' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((reconciliation.matched / reconciliation.totalAssets) * 100)}%`,
                  background: PDF_COLORS.low,
                  borderRadius: 4,
                }} />
              </div>
            </div>
          )}
          {reconciliation.unprotectedAssets.length > 0 && (
            <div style={{ width: '100%' }}>
              <h3 style={{ fontSize: PDF_FONT.h3, color: PDF_COLORS.text, marginBottom: 12, marginTop: 12 }}>Unprotected Assets (Missing EDR)</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                width: '100%'
              }}>
                {reconciliation.unprotectedAssets.slice(0, 40).map((tag, i) => (
                  <div key={i} style={{
                    fontSize: PDF_FONT.caption,
                    color: PDF_COLORS.textSecondary,
                    fontFamily: 'monospace',
                    padding: '6px 8px',
                    background: PDF_COLORS.tableHeader,
                    borderRadius: 4,
                    border: `1px solid ${PDF_COLORS.border}`,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {tag}
                  </div>
                ))}
              </div>
              {reconciliation.unprotectedAssets.length > 40 && (
                <div style={{ fontSize: PDF_FONT.caption, color: PDF_COLORS.muted, marginTop: 12, textAlign: 'center' }}>
                  +{reconciliation.unprotectedAssets.length - 40} more — see full list via Copy on dashboard
                </div>
              )}
            </div>
          )}
        </div>
        <PageFooter page={9} total={totalPages} />
      </div>

    </div>
  );
}
