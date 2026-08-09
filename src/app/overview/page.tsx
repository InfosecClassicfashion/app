'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useDashboard } from '@/contexts/DashboardContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const COLORS = ['#8B5CF6','#10B981','#06B6D4','#F59E0B','#EF4444','#F43F5E','#3B82F6','#A78BFA'];
const TooltipStyle = {
  contentStyle: { background: '#1E2638', border: '1px solid rgba(99,110,130,0.25)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#E2E8F0' },
};

export default function OverviewPage() {
  const { analytics, hasData, reportingRows, months, reportingMonth } = useDashboard();

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" description="Select a different reporting month or re-upload your CSV." showUploadLink={false} />;

  const { kpis, classificationDist, analystVerdictDist, topEngines } = analytics;

  // Sparkline data per KPI
  const sparkFor = (label: string) =>
    months.map((m) => ({
      value: m.rows.filter((r) => {
        if (label === 'Total Incidents') return true;
        if (label === 'Malicious') return r.Classification.toLowerCase().includes('malicious');
        if (label === 'Suspicious') return r.Classification.toLowerCase().includes('suspicious');
        return true;
      }).length,
    }));

  // Table view for classification
  const classTable = (
    <div className="overflow-auto max-h-64">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-[var(--text-muted)] text-xs">Classification</TableHead>
            <TableHead className="text-[var(--text-muted)] text-xs text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classificationDist.map((row) => (
            <TableRow key={row.name} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.fill }} />
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

  // Table view for analyst verdict
  const verdictTable = (
    <div className="overflow-auto max-h-64">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-[var(--text-muted)] text-xs">Verdict</TableHead>
            <TableHead className="text-[var(--text-muted)] text-xs text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analystVerdictDist.map((row) => (
            <TableRow key={row.name} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.fill }} />
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

  // Table view for top engines
  const enginesTable = (
    <div className="overflow-auto max-h-64">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-[var(--text-muted)] text-xs">Engine</TableHead>
            <TableHead className="text-[var(--text-muted)] text-xs text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topEngines.map((row) => (
            <TableRow key={row.name} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.fill }} />
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
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Executive Summary</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Reporting period: {months.find((m) => m.key === reportingMonth)?.label ?? reportingMonth} · {reportingRows.length.toLocaleString()} incidents
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((metric, i) => (
          <KpiCard
            key={metric.label}
            metric={metric}
            sparkData={i < 4 ? sparkFor(metric.label) : undefined}
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Classification donut — fixed container so legend never clips */}
        <ChartCard
          title="Alert Classification"
          subtitle="Distribution by type"
          chartId="classification-donut"
          tableContent={classTable}
          copyData={classificationDist}
        >
          {/* Extra padding-bottom so the legend has room below slices */}
          <div style={{ width: '100%', minHeight: 260, paddingBottom: 8 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={classificationDist}
                  cx="50%"
                  cy="42%"
                  innerRadius={55}
                  outerRadius={82}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {classificationDist.map((entry, i) => (
                    <Cell key={i} fill={entry.fill ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                  formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Analyst verdict donut */}
        <ChartCard
          title="Analyst Verdict"
          subtitle="True positive / false positive breakdown"
          chartId="verdict-donut"
          tableContent={verdictTable}
          copyData={analystVerdictDist}
        >
          <div style={{ width: '100%', minHeight: 260, paddingBottom: 8 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={analystVerdictDist}
                  cx="50%"
                  cy="42%"
                  innerRadius={55}
                  outerRadius={82}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {analystVerdictDist.map((entry, i) => (
                    <Cell key={i} fill={entry.fill ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                  formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top engines bar */}
        <ChartCard
          title="Top Detecting Engines"
          subtitle="By incident count"
          chartId="top-engines-bar"
          tableContent={enginesTable}
          copyData={topEngines}
        >
          <div style={{ width: '100%', minHeight: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topEngines}
                layout="vertical"
                margin={{ top: 4, left: 8, right: 20, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,110,130,0.15)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  width={140}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip {...TooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {topEngines.map((entry, i) => (
                    <Cell key={i} fill={entry.fill ?? COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
