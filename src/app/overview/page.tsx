'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useDashboard } from '@/contexts/DashboardContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

// High-contrast, easily distinguishable chart palette calibrated for clear visual separation
const DISTINCT_CHART_COLORS = [
  '#8B5CF6', // 1. Vivid Purple (chart-1)
  '#06B6D4', // 2. Bright Cyan (chart-3)
  '#10B981', // 3. Fresh Emerald (chart-2)
  '#F59E0B', // 4. Warm Amber (chart-4)
  '#F43F5E', // 5. Coral Rose (chart-5)
  '#3B82F6', // 6. Royal Blue
  '#EC4899', // 7. Hot Pink
  '#14B8A6', // 8. Mint Teal
  '#F97316', // 9. Vivid Orange
  '#6366F1', // 10. Indigo
];

// Semantic verdict colors for security status clarity
const VERDICT_COLORS: Record<string, string> = {
  true_positive: '#EF4444',
  'true positive': '#EF4444',
  malicious: '#EF4444',
  false_positive: '#10B981',
  'false positive': '#10B981',
  benign: '#10B981',
  suspicious: '#F59E0B',
  undefined: '#8B5CF6',
  unknown: '#64748B',
};

const topEnginesConfig = {
  value: {
    label: 'Incidents',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export default function OverviewPage() {
  const { analytics, hasData, reportingRows, months, reportingMonth } = useDashboard();

  const { kpis, classificationDist, analystVerdictDist, topEngines } = analytics ?? {
    kpis: [],
    classificationDist: [],
    analystVerdictDist: [],
    topEngines: [],
  };

  const classificationChartData = React.useMemo(
    () =>
      classificationDist.map((item, i) => ({
        ...item,
        fill: DISTINCT_CHART_COLORS[i % DISTINCT_CHART_COLORS.length],
      })),
    [classificationDist]
  );

  const classificationConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: { label: 'Incidents' },
    };
    classificationDist.forEach((item, i) => {
      config[item.name] = {
        label: item.name,
        color: DISTINCT_CHART_COLORS[i % DISTINCT_CHART_COLORS.length],
      };
    });
    return config;
  }, [classificationDist]);

  const verdictChartData = React.useMemo(
    () =>
      analystVerdictDist.map((item, i) => ({
        ...item,
        fill:
          VERDICT_COLORS[item.name.toLowerCase().trim()] ??
          DISTINCT_CHART_COLORS[i % DISTINCT_CHART_COLORS.length],
      })),
    [analystVerdictDist]
  );

  const verdictConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: { label: 'Incidents' },
    };
    analystVerdictDist.forEach((item, i) => {
      config[item.name] = {
        label: item.name,
        color:
          VERDICT_COLORS[item.name.toLowerCase().trim()] ??
          DISTINCT_CHART_COLORS[i % DISTINCT_CHART_COLORS.length],
      };
    });
    return config;
  }, [analystVerdictDist]);

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" description="Select a different reporting month or re-upload your CSV." showUploadLink={false} />;

  const totalClass = classificationDist.reduce((s, r) => s + r.value, 0);
  const totalVerdict = analystVerdictDist.reduce((s, r) => s + r.value, 0);
  const totalEngines = topEngines.reduce((s, r) => s + r.value, 0);

  // Sparkline data per KPI
  const sparkFor = (label: string) =>
    months.map((m) => ({
      value: m.rows.filter((r) => {
        if (label === 'Total Incidents') return true;
        const cls = r.Classification.toLowerCase();
        const verd = r.AnalystVerdict.toLowerCase();
        const conf = r.ConfidenceLevel.toLowerCase();
        if (label === 'Malicious') {
          return (
            cls.includes('malicious') ||
            verd.includes('true_positive') ||
            verd.includes('malicious') ||
            conf.includes('malicious')
          );
        }
        if (label === 'Suspicious') {
          return (
            cls.includes('suspicious') ||
            verd.includes('suspicious') ||
            conf.includes('suspicious')
          );
        }
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
            <TableHead className="text-[var(--text-muted)] text-xs text-right">Count (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classificationChartData.map((row) => (
            <TableRow key={row.name} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.fill }} />
                  {row.name}
                </div>
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">
                {row.value.toLocaleString()}{' '}
                <span className="text-[var(--text-muted)] text-[10px] ml-1">
                  ({totalClass > 0 ? `${Math.round((row.value / totalClass) * 100)}%` : '0%'})
                </span>
              </TableCell>
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
            <TableHead className="text-[var(--text-muted)] text-xs text-right">Count (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {verdictChartData.map((row) => (
            <TableRow key={row.name} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.fill }} />
                  {row.name}
                </div>
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">
                {row.value.toLocaleString()}{' '}
                <span className="text-[var(--text-muted)] text-[10px] ml-1">
                  ({totalVerdict > 0 ? `${Math.round((row.value / totalVerdict) * 100)}%` : '0%'})
                </span>
              </TableCell>
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
            <TableHead className="text-[var(--text-muted)] text-xs text-right">Count (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topEngines.map((row) => (
            <TableRow key={row.name} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[var(--chart-1)]" />
                  {row.name}
                </div>
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">
                {row.value.toLocaleString()}{' '}
                <span className="text-[var(--text-muted)] text-[10px] ml-1">
                  ({totalEngines > 0 ? `${Math.round((row.value / totalEngines) * 100)}%` : '0%'})
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-heading tracking-wider text-[var(--text-primary)]">Executive Summary</h1>
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
          <ChartContainer config={classificationConfig} className="w-full aspect-auto h-[260px] pb-2">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
              />
              <Pie
                data={classificationChartData}
                cx="50%"
                cy="42%"
                innerRadius={55}
                outerRadius={82}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
                stroke="none"
              >
                {classificationChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} stroke="none" />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>}
              />
            </PieChart>
          </ChartContainer>
        </ChartCard>

        {/* Analyst verdict donut */}
        <ChartCard
          title="Analyst Verdict"
          subtitle="True positive / false positive breakdown"
          chartId="verdict-donut"
          tableContent={verdictTable}
          copyData={analystVerdictDist}
        >
          <ChartContainer config={verdictConfig} className="w-full aspect-auto h-[260px] pb-2">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
              />
              <Pie
                data={verdictChartData}
                cx="50%"
                cy="42%"
                innerRadius={55}
                outerRadius={82}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
                stroke="none"
              >
                {verdictChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} stroke="none" />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>}
              />
            </PieChart>
          </ChartContainer>
        </ChartCard>

        {/* Top engines bar */}
        <ChartCard
          title="Top Detecting Engines"
          subtitle="By incident count"
          chartId="top-engines-bar"
          tableContent={enginesTable}
          copyData={topEngines}
        >
          <ChartContainer config={topEnginesConfig} className="w-full aspect-auto h-[260px]">
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
                tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '…' : v)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="value" fill="var(--color-value, var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    </div>
  );
}
