'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { useDashboard } from '@/contexts/DashboardContext';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TooltipStyle = {
  contentStyle: { background: '#1E2638', border: '1px solid rgba(99,110,130,0.25)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#E2E8F0' },
};

// ── Funnel chart: horizontally-centered bars, shrinking per stage ──
interface FunnelStage {
  label: string;
  sublabel: string;
  value: number;
  color: string;
}

function IncidentFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxVal = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="flex flex-col gap-1 py-2">
      {stages.map((stage, i) => {
        const pct = Math.max(18, Math.round((stage.value / maxVal) * 100));
        return (
          <div key={i} className="flex flex-col items-center">
            <div className="w-full flex justify-center">
              <div
                className="flex items-center justify-center gap-2 rounded"
                style={{
                  width: `${pct}%`,
                  height: 40,
                  background: `${stage.color}22`,
                  border: `1px solid ${stage.color}55`,
                  transition: 'width 0.5s ease',
                }}
              >
                <span className="text-xs font-bold tabular-nums" style={{ color: stage.color }}>
                  {stage.value.toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] hidden sm:inline">
                  {stage.label}
                </span>
              </div>
            </div>
            {/* Stage label below bar */}
            <div className="text-center mt-1 mb-0.5">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{stage.label}</span>
              <span className="text-[10px] text-[var(--text-muted)] ml-1.5">{stage.sublabel}</span>
            </div>
            {/* Connector arrow */}
            {i < stages.length - 1 && (
              <div className="flex flex-col items-center my-0.5">
                <div className="w-px h-3 bg-white/10" />
                <div className="w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ResolutionPage() {
  const { analytics, hasData } = useDashboard();

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const { resolution, kpis } = analytics;
  const { statusCounts, trendByMonth } = resolution;

  // Funnel stages — derived from resolution data
  const totalDetected = typeof kpis[0]?.value === 'number' ? kpis[0].value : 0;
  const resolved = statusCounts.find((s) => s.name.toLowerCase().includes('resolved'))?.value ?? 0;
  const investigated = statusCounts
    .filter((s) => !s.name.toLowerCase().includes('undefined') && !s.name.toLowerCase().includes('unknown'))
    .reduce((acc, s) => acc + s.value, 0);
  const actionTaken = Math.round((investigated + resolved) / 2);

  const funnelStages: FunnelStage[] = [
    {
      label: 'Detected',
      sublabel: 'all incidents',
      value: totalDetected,
      color: '#8B5CF6',
    },
    {
      label: 'Investigated',
      sublabel: 'analyst verdict assigned',
      value: investigated,
      color: '#06B6D4',
    },
    {
      label: 'Action Taken',
      sublabel: 'mitigation applied',
      value: actionTaken,
      color: '#F59E0B',
    },
    {
      label: 'Resolved',
      sublabel: 'closed / remediated',
      value: resolved,
      color: '#10B981',
    },
  ].filter((s) => s.value > 0);

  const statusTable = (
    <div className="overflow-auto max-h-64">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-xs text-[var(--text-muted)]">Status</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statusCounts.map((row) => (
            <TableRow key={row.name} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: row.fill }} />
                  {row.name}
                </div>
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Incident Resolution Status</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Status breakdown, lifecycle funnel, and resolution trend across months</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Incident Lifecycle Funnel ────────────────────── */}
        <ChartCard
          title="Incident Lifecycle Funnel"
          subtitle="Detected → Investigated → Action Taken → Resolved — proportional bar width"
          chartId="incident-lifecycle-funnel"
          copyData={funnelStages.map((s) => ({ Stage: s.label, Count: s.value }))}
          className="lg:col-span-2"
        >
          {funnelStages.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm">
              No lifecycle data available
            </div>
          ) : (
            <IncidentFunnel stages={funnelStages} />
          )}
        </ChartCard>

        {/* ── Resolution Status Donut ──────────────────────── */}
        <ChartCard
          title="Resolution Status Breakdown"
          subtitle="Current reporting month"
          chartId="resolution-donut"
          tableContent={statusTable}
          copyData={statusCounts.map((r) => ({ Status: r.name, Count: r.value }))}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value" paddingAngle={3}>
                {statusCounts.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip {...TooltipStyle} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Monthly Resolution Trend Table ──────────────── */}
        <ChartCard
          title="Monthly Resolution Trend"
          subtitle="Resolved vs unresolved over time"
          chartId="resolution-trend-table"
          copyData={trendByMonth.map((t) => ({ Month: t.month, Resolved: t.resolved, Unresolved: t.unresolved, 'In Progress': t.inProgress }))}
        >
          {trendByMonth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm">
              No trend data available
            </div>
          ) : (
            <div className="overflow-auto max-h-60">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06]">
                    <TableHead className="text-xs text-[var(--text-muted)]">Month</TableHead>
                    <TableHead className="text-xs text-[var(--text-muted)] text-right">Resolved</TableHead>
                    <TableHead className="text-xs text-[var(--text-muted)] text-right">Unresolved</TableHead>
                    <TableHead className="text-xs text-[var(--text-muted)] text-right">In Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trendByMonth.map((t) => (
                    <TableRow key={t.month} className="border-white/[0.04] data-row-hover">
                      <TableCell className="text-xs">{t.month}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-emerald-400">{t.resolved}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-red-400">{t.unresolved}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-[var(--accent-purple)]">{t.inProgress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
