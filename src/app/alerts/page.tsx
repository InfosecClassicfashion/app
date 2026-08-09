'use client';

import React from 'react';
import {
  LineChart, Line, AreaChart, Area,
  ComposedChart, Bar, Scatter,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { useDashboard } from '@/contexts/DashboardContext';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

const COLORS = ['#8B5CF6','#10B981','#06B6D4','#F59E0B','#EF4444','#F43F5E','#3B82F6','#A78BFA','#34D399','#38BDF8'];
const TooltipStyle = {
  contentStyle: { background: '#1E2638', border: '1px solid rgba(99,110,130,0.25)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#E2E8F0' },
};

type MonthCount = { month: string; label: string; count: number };

function fmtMonth(key: string): string {
  try {
    const d = parseISO(`${key}-01`);
    return isValid(d) ? format(d, 'MMM yy') : key;
  } catch {
    return key;
  }
}

// ── Lollipop chart using ComposedChart ───────────────────────
interface LollipopProps {
  data: { name: string; value: number; fill?: string }[];
}

function LollipopChart({ data }: LollipopProps) {
  // ComposedChart layout=vertical: Bar (stem, 2px wide) + Scatter (dot)
  const chartData = data.map((d, i) => ({
    name: d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name,
    fullName: d.name,
    value: d.value,
    fill: d.fill ?? COLORS[i % COLORS.length],
    dot: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 30)}>
      <ComposedChart data={chartData} layout="vertical" margin={{ left: 12, right: 48, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,110,130,0.15)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748B' }} width={130} />
        <Tooltip
          {...TooltipStyle}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0]?.payload;
            return (
              <div style={{ background: '#1E2638', border: '1px solid rgba(99,110,130,0.25)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
                <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{d?.fullName}</div>
                <div style={{ color: '#94A3B8' }}>{d?.value} detections</div>
              </div>
            );
          }}
        />
        {/* Stem bar — very narrow */}
        <Bar dataKey="value" barSize={2} radius={[0, 2, 2, 0]}>
          {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
        {/* Dot — custom shape overlaid on the bar endpoint */}
        <Scatter dataKey="dot" shape={(props: { cx?: number; cy?: number; payload?: typeof chartData[0] }) => {
          const cx = props.cx ?? 0;
          const cy = props.cy ?? 0;
          const payload = props.payload;
          if (!payload) return <g />;
          return (
            <g>
              <circle cx={cx} cy={cy} r={5} fill={payload.fill} />
              <text x={cx + 10} y={cy + 4} fontSize={10} fill="#94A3B8" fontWeight={600}>
                {payload.value}
              </text>
            </g>
          );
        }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function AlertsPage() {
  const { analytics, hasData, months, edrRows } = useDashboard();

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const { alertTrend, top10Alerts, alertsByMonth, weeklyAlertsByClass, top5Classes } = analytics;

  // --- Alerts by Month: total count per month ---
  const alertsByMonthTotal: MonthCount[] = months.map((m) => ({
    month: m.key,
    label: fmtMonth(m.key),
    count: m.rows.length,
  }));

  // --- MoM Line chart: reshape alertsByMonth to per-classification series ---
  // X = month, Y = count, one line per top5 classification
  const momLineData = alertsByMonth.map((m) => {
    const entry: Record<string, string | number> = { month: fmtMonth(m.month) };
    top5Classes.forEach((cls) => {
      entry[cls] = typeof m[cls] === 'number' ? (m[cls] as number) : 0;
    });
    return entry;
  });

  // MoM trend table
  const trendTable = (
    <div className="overflow-auto max-h-80">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-xs text-[var(--text-muted)]">Classification</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Current</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Previous</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Delta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alertTrend.map((row) => {
            const dir = row.delta > 0 ? 'up' : row.delta < 0 ? 'down' : 'neutral';
            const DeltaIcon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
            return (
              <TableRow key={row.classification} className="border-white/[0.04] data-row-hover">
                <TableCell className="text-xs">{row.classification}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{row.current}</TableCell>
                <TableCell className="text-xs text-right tabular-nums text-[var(--text-muted)]">{row.previous}</TableCell>
                <TableCell className="text-xs text-right">
                  <span className={cn(
                    'flex items-center justify-end gap-1',
                    dir === 'up' ? 'text-red-400' : dir === 'down' ? 'text-emerald-400' : 'text-slate-400'
                  )}>
                    <DeltaIcon className="w-3 h-3" />
                    {row.delta > 0 ? '+' : ''}{row.delta}
                    <span className="text-[var(--text-dim)] text-[10px]">({row.deltaPercent}%)</span>
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // Top 10 table
  const top10Table = (
    <div className="overflow-auto max-h-72">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-xs text-[var(--text-muted)]">#</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)]">Alert Type</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {top10Alerts.map((row, i) => (
            <TableRow key={row.name} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs text-[var(--text-muted)]">{i + 1}</TableCell>
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

  // Alerts by month table view
  const alertsByMonthTable = (
    <div className="overflow-auto max-h-72">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-xs text-[var(--text-muted)]">Month</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Alert Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alertsByMonthTotal.map((row) => (
            <TableRow key={row.month} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs">{row.label}</TableCell>
              <TableCell className="text-xs text-right tabular-nums">{row.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Weekly breakdown table
  const weeklyTable = (
    <div className="overflow-auto max-h-72">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-xs text-[var(--text-muted)]">Week</TableHead>
            {top5Classes.map((cls) => (
              <TableHead key={cls} className="text-xs text-[var(--text-muted)] text-right">{cls.length > 14 ? cls.slice(0,14)+'…' : cls}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {weeklyAlertsByClass.map((row) => (
            <TableRow key={row.week} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs font-mono">{row.week}</TableCell>
              {top5Classes.map((cls) => (
                <TableCell key={cls} className="text-xs text-right tabular-nums">
                  {typeof row[cls] === 'number' ? (row[cls] as number) : 0}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Alerts</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Alert type distribution, month-over-month trends, and top detections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── MoM Multi-series Line Chart — PRIMARY ─────────── */}
        <ChartCard
          title="Month-over-Month Alert Trend"
          subtitle="Detection count per classification across months — top 5 classifications"
          chartId="mom-trend-line"
          tableContent={trendTable}
          copyData={alertTrend.map((r) => ({
            Classification: r.classification,
            Current: r.current,
            Previous: r.previous,
            Delta: r.delta,
            'Change %': `${r.deltaPercent > 0 ? '+' : ''}${r.deltaPercent}%`,
          }))}
          className="lg:col-span-2"
        >
          {momLineData.length < 2 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-[var(--text-muted)] text-sm">Need 2+ months of data for trend chart</p>
              <p className="text-[var(--text-dim)] text-xs">Upload EDR exports covering multiple months</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={momLineData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,110,130,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip {...TooltipStyle} />
                <Legend formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>} />
                {top5Classes.map((cls, i) => (
                  <Line
                    key={cls}
                    type="monotone"
                    dataKey={cls}
                    name={cls.length > 20 ? cls.slice(0, 20) + '…' : cls}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── Top 10 Alerts — Lollipop / Stem Chart ─────────── */}
        <ChartCard
          title="Top 10 Most Common Alerts"
          subtitle="Stem chart — horizontal line to dot at detection count"
          chartId="top10-lollipop"
          tableContent={top10Table}
          copyData={top10Alerts.map((r, i) => ({ Rank: i + 1, 'Alert Type': r.name, Count: r.value }))}
        >
          <LollipopChart data={top10Alerts} />
        </ChartCard>

        {/* ── Alerts by Month — Bar Chart ────────────────────── */}
        <ChartCard
          title="Alerts by Month"
          subtitle="Total alert count grouped by month (from Reported Time)"
          chartId="alerts-by-month"
          tableContent={alertsByMonthTable}
          copyData={alertsByMonthTotal.map((r) => ({ Month: r.label, 'Alert Count': r.count }))}
        >
          {alertsByMonthTotal.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-[var(--text-muted)] text-sm">
              No multi-month data available
            </div>
          ) : alertsByMonthTotal.length === 1 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <p className="text-[var(--text-muted)] text-sm">Single month of data</p>
              <div className="text-5xl font-bold text-[var(--text-primary)] tabular-nums">
                {alertsByMonthTotal[0].count.toLocaleString()}
              </div>
              <p className="text-[var(--text-muted)] text-xs">alerts in {alertsByMonthTotal[0].label}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={alertsByMonthTotal}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,110,130,0.15)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <Tooltip
                  {...TooltipStyle}
                  formatter={(v) => [`${Number(v).toLocaleString()}`, 'Alerts']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Alerts"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#8B5CF6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── Alert Volume Weekly Breakdown — Stacked Area ──── */}
        <ChartCard
          title="Alert Volume — Weekly Breakdown"
          subtitle="Stacked area — top 5 classifications by ISO week (current month)"
          chartId="weekly-stacked-area"
          tableContent={weeklyTable}
          copyData={weeklyAlertsByClass.map((r) => {
            const row: Record<string, string | number> = { Week: r.week };
            top5Classes.forEach((cls) => { row[cls] = typeof r[cls] === 'number' ? (r[cls] as number) : 0; });
            return row;
          })}
          className="lg:col-span-2"
        >
          {weeklyAlertsByClass.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-[var(--text-muted)] text-sm">No weekly data available</p>
              <p className="text-[var(--text-dim)] text-xs">Ensure your EDR export contains Reported Time for the selected month.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyAlertsByClass} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <defs>
                  {top5Classes.map((cls, i) => (
                    <linearGradient key={cls} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.04} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,110,130,0.15)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip {...TooltipStyle} />
                <Legend formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>} />
                {top5Classes.map((cls, i) => (
                  <Area
                    key={cls}
                    type="monotone"
                    dataKey={cls}
                    name={cls.length > 20 ? cls.slice(0, 20) + '…' : cls}
                    stackId="1"
                    stroke={COLORS[i % COLORS.length]}
                    fill={`url(#areaGrad${i})`}
                    strokeWidth={1.5}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
