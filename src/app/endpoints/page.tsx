'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts';
import { useDashboard } from '@/contexts/DashboardContext';
import { ChartCard } from '@/components/ui/ChartCard';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faShieldVirus,
  faCircleCheck,
  faCopy,
  faArrowTrendUp,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

const COLORS = ['#8B5CF6','#10B981','#06B6D4','#F59E0B','#EF4444','#F43F5E','#3B82F6','#A78BFA'];
const TooltipStyle = {
  contentStyle: { background: '#1E2638', border: '1px solid rgba(99,110,130,0.25)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#E2E8F0' },
  cursor: { fill: 'rgba(255, 255, 255, 0.05)' },
};

const endpointChartConfig = {
  count: {
    label: 'Detections',
    color: 'var(--chart-2)',
  },
  label: {
    color: 'var(--background)',
  },
} satisfies ChartConfig;

export default function EndpointsPage() {
  const { analytics, hasData, assetRows } = useDashboard();
  const [copied, setCopied] = useState(false);

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const { topEndpoints, agentVersionDist, reconciliation } = analytics;

  const hasAssets = assetRows.length > 0;
  const totalAssets = reconciliation.totalAssets;
  const covered = reconciliation.matched;
  const missingEDR = reconciliation.unprotectedAssets;
  const coveragePct = totalAssets > 0 ? Math.round((covered / totalAssets) * 100) : 0;

  const handleCopyMissing = async () => {
    const text = missingEDR.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Donut data for coverage
  const coverageDonutData = [
    { name: 'With EDR', value: covered, fill: '#10B981' },
    { name: 'Missing EDR', value: missingEDR.length, fill: '#EF4444' },
  ].filter((d) => d.value > 0);

  const endpointTable = (
    <div className="overflow-auto max-h-72">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-xs text-[var(--text-muted)]">#</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)]">Endpoint</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Detections</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topEndpoints.map((ep, i) => (
            <TableRow key={ep.endpoint} className="border-white/[0.04] data-row-hover">
              <TableCell className="text-xs text-[var(--text-muted)]">{i + 1}</TableCell>
              <TableCell className="text-xs font-mono">{ep.endpoint}</TableCell>
              <TableCell className="text-xs text-right tabular-nums">{ep.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-heading tracking-wider text-[var(--text-primary)]">Endpoint Summary</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Per-endpoint detection counts, agent versions, and EDR coverage analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top endpoints */}
        <ChartCard
          title="Detections per Endpoint"
          subtitle="Top 15 most detected endpoints"
          chartId="top-endpoints-bar"
          tableContent={endpointTable}
          copyData={topEndpoints.map((ep, i) => ({ Rank: i + 1, Endpoint: ep.endpoint, Detections: ep.count }))}
          className="lg:col-span-2"
        >
          <div className="flex flex-col gap-3">
            <ChartContainer config={endpointChartConfig} className="w-full aspect-auto h-[420px]">
              <BarChart
                accessibilityLayer
                data={topEndpoints.slice(0, 15)}
                layout="vertical"
                margin={{
                  right: 24,
                }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="endpoint"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  hide
                />
                <XAxis dataKey="count" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                  <LabelList
                    dataKey="endpoint"
                    position="insideLeft"
                    offset={8}
                    className="fill-(--color-label) font-mono"
                    fontSize={12}
                  />
                  <LabelList
                    dataKey="count"
                    position="right"
                    offset={8}
                    className="fill-foreground font-medium"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-white/[0.06] text-sm">
              <div className="flex items-center gap-2 leading-none font-medium text-[var(--text-primary)]">
                {topEndpoints.length > 0 ? (
                  <>
                    <span>Highest volume: <span className="font-mono text-emerald-400">{topEndpoints[0]?.endpoint}</span> ({topEndpoints[0]?.count} detections)</span>
                    <FontAwesomeIcon icon={faArrowTrendUp} className="h-4 w-4 text-emerald-400" />
                  </>
                ) : (
                  <span>No endpoint detections recorded</span>
                )}
              </div>
              <div className="leading-none text-[var(--text-muted)] text-xs">
                Showing top {Math.min(15, topEndpoints.length)} detected endpoints
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Agent version distribution */}
        <ChartCard
          title="Agent Version Distribution"
          subtitle="Version spread across endpoints"
          chartId="agent-version-donut"
          copyData={agentVersionDist.map((d) => ({ Version: d.name, Count: d.value }))}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={agentVersionDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" paddingAngle={3} stroke="none">
                {agentVersionDist.map((e, i) => (
                  <Cell key={i} fill={e.fill ?? COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip {...TooltipStyle} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Endpoint Coverage — Donut + Table ──────────── */}
        <div className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden">
          {/* Accent bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{
            background: `linear-gradient(90deg, ${coveragePct >= 80 ? '#10B981' : coveragePct >= 50 ? '#F59E0B' : '#EF4444'}, transparent)`
          }} />

          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-heading tracking-wider text-[var(--text-primary)]">Endpoint Coverage</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {hasAssets
                  ? 'Asset reconciliation (ITAssets vs S1AgentData)'
                  : 'Upload Asset CSV to see coverage analysis'}
              </p>
            </div>
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              coveragePct >= 80 ? 'bg-emerald-500/15' : coveragePct >= 50 ? 'bg-amber-500/15' : 'bg-red-500/15'
            )}>
              {coveragePct >= 80
                ? <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 text-emerald-400" />
                : <FontAwesomeIcon icon={faShieldVirus} className="w-5 h-5 text-red-400" />
              }
            </div>
          </div>

          {!hasAssets ? (
            <div className="flex-1 flex items-center justify-center py-8 text-[var(--text-muted)] text-sm text-center">
              No asset data uploaded.<br />
              <a href="/upload" className="text-[var(--accent-purple)] hover:underline ml-1">Upload Asset CSV</a>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <div className={cn(
                    'text-3xl font-bold tabular-nums',
                    coveragePct >= 80 ? 'text-emerald-400' : coveragePct >= 50 ? 'text-amber-400' : 'text-red-400'
                  )}>{coveragePct}%</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1">
                    {covered} covered out of {totalAssets} total assets
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-400 tabular-nums">{missingEDR.length}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1">Missing EDR</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden flex shadow-inner">
                <div
                  className="h-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.max(2, coveragePct)}%`,
                    background: coveragePct >= 80 ? '#10B981' : coveragePct >= 50 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </div>

              {/* Missing endpoints grid */}
              {missingEDR.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">
                      Endpoints Missing EDR ({missingEDR.length})
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyMissing}
                      className={cn(
                        'h-6 px-2 text-[10px] gap-1 transition-colors',
                        copied ? 'text-emerald-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      {copied
                        ? <><FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3 mr-1" /> Copied!</>
                        : <><FontAwesomeIcon icon={faCopy} className="w-3 h-3 mr-1" /> Copy List</>
                      }
                    </Button>
                  </div>
                  <div className="max-h-56 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {missingEDR.map((tag, i) => (
                        <div key={i} className="text-[10px] font-mono text-[var(--text-secondary)] bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1.5 truncate text-center">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {missingEDR.length === 0 && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                  All assets have EDR coverage
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
