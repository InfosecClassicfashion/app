'use client';

import React, { useMemo, useState } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type HeatmapMode = 'weekly' | 'site';

// ── Colour helpers ──────────────────────────────────────────────────────────
function heatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'rgba(255,255,255,0.04)';
  const t = Math.min(value / max, 1);
  const r = Math.round(30   + t * (139 - 30));
  const g = Math.round(32   + t * (92  - 32));
  const b = Math.round(60   + t * (246 - 60));
  return `rgb(${r},${g},${b})`;
}

function textColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'rgba(255,255,255,0.15)';
  return value / max > 0.35 ? '#fff' : 'rgba(255,255,255,0.7)';
}

// ── Heatmap component ───────────────────────────────────────────────────────
interface HeatmapProps {
  data: { x: string; y: string; value: number }[];
  maxLabelWidth?: number;
}

function CssHeatmap({ data, maxLabelWidth = 180 }: HeatmapProps) {
  const rows = [...new Set(data.map((c) => c.y))];
  const cols = [...new Set(data.map((c) => c.x))].sort();
  const max = Math.max(...data.map((c) => c.value), 1);

  const cell = (row: string, col: string) =>
    data.find((c) => c.x === col && c.y === row)?.value ?? 0;

  const steps = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    value: Math.round(t * max),
    color: heatColor(Math.round(t * max), max),
  }));

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 480 }}>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: '#64748B', marginRight: 4 }}>Detections:</span>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                width: 24, height: 14, borderRadius: 3,
                background: s.color,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <span style={{ fontSize: 10, color: '#94A3B8' }}>{s.value}</span>
          </React.Fragment>
        ))}
      </div>

      <table style={{ borderCollapse: 'separate', borderSpacing: 2, minWidth: cols.length * 38 + maxLabelWidth }}>
        <thead>
          <tr>
            <th style={{ width: maxLabelWidth, minWidth: maxLabelWidth }} />
            {cols.map((col) => (
              <th key={col} style={{
                fontSize: 10, color: '#64748B', fontWeight: 500,
                padding: '0 2px 6px', textAlign: 'center', width: 36,
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td style={{
                fontSize: 10, color: '#94A3B8', paddingRight: 8,
                maxWidth: maxLabelWidth, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textAlign: 'right', verticalAlign: 'middle',
              }} title={row}>
                {row.length > 22 ? row.slice(0, 22) + '…' : row}
              </td>
              {cols.map((col) => {
                const v = cell(row, col);
                return (
                  <td key={col} title={`${row} · ${col}: ${v}`} style={{
                    width: 36, height: 28,
                    background: heatColor(v, max),
                    borderRadius: 4,
                    fontSize: v > 0 ? 10 : 9,
                    color: textColor(v, max),
                    textAlign: 'center', verticalAlign: 'middle',
                    fontWeight: 600,
                  }}>
                    {v > 0 ? v : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function ThreatsPage() {
  const { analytics, hasData } = useDashboard();
  const [mode, setMode] = useState<HeatmapMode>('weekly');

  // ALL hooks must be called unconditionally before any early returns
  const heatmapWeeklyThreat = analytics?.heatmapWeeklyThreat ?? [];
  const heatmapSiteClassification = analytics?.heatmapSiteClassification ?? [];

  const activeData = mode === 'weekly' ? heatmapWeeklyThreat : heatmapSiteClassification;

  const heatmapTableData = useMemo(() => {
    if (activeData.length === 0) return null;
    const rows = [...new Set(activeData.map((c) => c.y))];
    const cols = [...new Set(activeData.map((c) => c.x))].sort();
    const copyRows = rows.map((row) => {
      const entry: Record<string, string | number> = { Threat: row };
      cols.forEach((col) => {
        const v = activeData.find((c) => c.x === col && c.y === row)?.value ?? 0;
        entry[col] = v;
      });
      return entry;
    });
    const table = (
      <div className="overflow-auto max-h-72">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06]">
              <TableHead className="text-xs text-[var(--text-muted)]">Threat</TableHead>
              {cols.map((col) => (
                <TableHead key={col} className="text-xs text-[var(--text-muted)] text-right">{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row} className="border-white/[0.04] data-row-hover">
                <TableCell className="text-xs font-mono max-w-xs truncate" title={row}>{row}</TableCell>
                {cols.map((col) => {
                  const v = activeData.find((c) => c.x === col && c.y === row)?.value ?? 0;
                  return (
                    <TableCell key={col} className="text-xs text-right tabular-nums">
                      {v > 0 ? v : <span className="text-[var(--text-dim)]">—</span>}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
    return { table, copyRows };
  }, [activeData]);

  // Early returns AFTER all hooks
  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const hasHeatmapData = activeData.some((c) => c.value > 0);

  return (
    <div className="p-6 space-y-6 page-enter">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Threat Analysis</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {mode === 'weekly'
              ? 'Recurring threats detected across multiple weeks — highlights persistent threats'
              : 'Detection distribution across sites and classifications'}
          </p>
        </div>
        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-white/[0.06]">
          {([['weekly', 'Weekly Recurring Threats'], ['site', 'Site × Classification']] as [HeatmapMode, string][]).map(([m, label]) => (
            <Button
              key={m}
              size="sm"
              variant="ghost"
              onClick={() => setMode(m)}
              className={cn(
                'h-7 px-3 text-xs',
                mode === m
                  ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <ChartCard
        title={mode === 'weekly' ? 'Weekly Recurring Threat Heatmap' : 'Site × Classification Heatmap'}
        subtitle={
          mode === 'weekly'
            ? 'Threats (by hash/name) detected in 2+ distinct weeks · rows = threat, columns = week number'
            : 'Detection intensity across sites and threat classifications'
        }
        chartId="threat-heatmap"
        tableContent={heatmapTableData?.table ?? undefined}
        copyData={heatmapTableData?.copyRows ?? undefined}
      >
        {!hasHeatmapData ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-[var(--text-muted)] text-sm">
              {mode === 'weekly'
                ? 'No recurring threats found — no hash appears in 2+ distinct weeks in this dataset.'
                : 'No heatmap data available for this period.'}
            </p>
            {mode === 'weekly' && (
              <p className="text-[var(--text-dim)] text-xs max-w-sm">
                This heatmap only shows threats detected in multiple weeks. Try selecting a month with more longitudinal data, or switch to Site × Classification view.
              </p>
            )}
          </div>
        ) : (
          <CssHeatmap
            data={activeData}
            maxLabelWidth={mode === 'weekly' ? 160 : 180}
          />
        )}
      </ChartCard>
    </div>
  );
}
