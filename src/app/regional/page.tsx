'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp,
  faArrowTrendDown,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';
import { useDashboard } from '@/contexts/DashboardContext';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const COLORS = ['#8B5CF6', '#10B981', '#06B6D4'];
const TooltipStyle = {
  contentStyle: { background: '#1E2638', border: '1px solid rgba(99,110,130,0.25)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#E2E8F0' },
  cursor: { fill: 'rgba(255, 255, 255, 0.05)' },
};

export default function RegionalPage() {
  const { analytics, hasData } = useDashboard();

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const { siteRisks, classificationDist } = analytics;

  const deltaData = siteRisks.map((s) => ({
    site: s.site,
    delta: s.delta,
    fill: s.delta > 0 ? '#EF4444' : '#10B981',
  }));

  // ── Site Risk Profile — Radar chart ─────────────────────────
  // Top 3 sites by current volume vs top 5 threat classifications as axes
  const top3Sites = siteRisks.slice(0, 3);
  const top5Classes = classificationDist.slice(0, 5).map((d) => d.name);

  // We need per-site × per-class counts — derive from siteRisks proportionally
  // (exact counts need edrRows, so we approximate from classificationDist share × site total)
  const totalInClass = classificationDist.reduce((s, d) => s + d.value, 0);
  const radarData = top5Classes.map((cls) => {
    const clsShare = (classificationDist.find((d) => d.name === cls)?.value ?? 0) / Math.max(totalInClass, 1);
    const entry: Record<string, string | number> = {
      classification: cls.length > 14 ? cls.slice(0, 14) + '…' : cls,
    };
    top3Sites.forEach((site) => {
      // approximate: site's proportion of total × class proportion × 100 for radar scale
      entry[site.site] = Math.round(site.current * clsShare);
    });
    return entry;
  });

  // Copy data for the main site comparison card
  const siteCopyData = siteRisks.map((s) => ({
    Site: s.site,
    Current: s.current,
    Previous: s.previous,
    Delta: s.delta > 0 ? `+${s.delta}` : String(s.delta),
    'Risk Score': s.riskScore,
  }));

  const deltaTable = (
    <div className="overflow-auto max-h-72">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06]">
            <TableHead className="text-xs text-[var(--text-muted)]">Site</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Current</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Previous</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Change</TableHead>
            <TableHead className="text-xs text-[var(--text-muted)] text-right">Risk Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {siteRisks.map((row) => {
            const dir = row.delta > 0 ? 'up' : row.delta < 0 ? 'down' : 'neutral';
            const deltaIcon = dir === 'up' ? faArrowTrendUp : dir === 'down' ? faArrowTrendDown : faMinus;
            return (
              <TableRow key={row.site} className="border-white/[0.04] data-row-hover">
                <TableCell className="text-xs font-medium">{row.site}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{row.current}</TableCell>
                <TableCell className="text-xs text-right tabular-nums text-[var(--text-muted)]">{row.previous}</TableCell>
                <TableCell className="text-xs text-right">
                  <span className={cn(
                    'flex items-center justify-end gap-1',
                    dir === 'up' ? 'text-red-400' : dir === 'down' ? 'text-emerald-400' : 'text-slate-400'
                  )}>
                    <FontAwesomeIcon icon={deltaIcon} className="w-3 h-3" />
                    {row.delta > 0 ? '+' : ''}{row.delta}
                    {row.deltaPercent !== 0 && <span className="text-[10px] text-[var(--text-dim)]">({row.deltaPercent}%)</span>}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-right tabular-nums">
                  <span className={cn(
                    'font-semibold',
                    row.riskScore > 70 ? 'text-red-400' : row.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'
                  )}>{row.riskScore}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-heading tracking-wider text-[var(--text-primary)]">Regional Threat Hotspot</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Site-wise detection counts compared to prior month
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Site comparison grouped bar — with copyData ──── */}
        <ChartCard
          title="Site Detections — Current vs Prior Month"
          subtitle="Side-by-side comparison"
          chartId="site-comparison-bar"
          className="lg:col-span-2"
          tableContent={deltaTable}
          copyData={siteCopyData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={siteRisks} margin={{ right: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,110,130,0.15)" />
              <XAxis dataKey="site" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip {...TooltipStyle} />
              <Legend formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>} />
              <Bar dataKey="current" name="Current" fill="#8B5CF6" radius={[3,3,0,0]} />
              <Bar dataKey="previous" name="Previous" fill="rgba(139,92,246,0.3)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Delta waterfall ──────────────────────────────── */}
        <ChartCard
          title="MoM Detection Change by Site"
          subtitle="Positive = more incidents, negative = fewer"
          chartId="site-delta-bar"
          copyData={siteRisks.map((s) => ({ Site: s.site, Delta: s.delta, 'Delta %': `${s.deltaPercent}%` }))}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deltaData} margin={{ right: 16, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,110,130,0.15)" />
              <XAxis dataKey="site" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip {...TooltipStyle} formatter={(v) => { const n = Number(v); return [n > 0 ? `+${n}` : n, 'Change']; }} />
              <ReferenceLine y={0} stroke="rgba(99,110,130,0.4)" />
              <Bar dataKey="delta" radius={[3,3,0,0]}>
                {deltaData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Site Risk Profile — Radar/Spider Chart ───────── */}
        {top3Sites.length >= 2 && top5Classes.length >= 3 && (
          <ChartCard
            title="Site Risk Profile"
            subtitle="Top 3 sites plotted across top 5 threat classifications"
            chartId="site-risk-radar"
            copyData={radarData.map((r) => {
              const row: Record<string, string | number> = { Classification: String(r.classification) };
              top3Sites.forEach((s) => { row[s.site] = r[s.site] as number; });
              return row;
            })}
          >
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} margin={{ top: 8, right: 32, bottom: 8, left: 32 }}>
                <PolarGrid stroke="rgba(99,110,130,0.2)" />
                <PolarAngleAxis dataKey="classification" tick={{ fontSize: 10, fill: '#64748B' }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: '#64748B' }} />
                <Tooltip {...TooltipStyle} />
                <Legend formatter={(v) => <span className="text-[11px] text-[var(--text-secondary)]">{v}</span>} />
                {top3Sites.map((site, i) => (
                  <Radar
                    key={site.site}
                    name={site.site}
                    dataKey={site.site}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Risk score bars ──────────────────────────────── */}
        <ChartCard
          title="Site Risk Scores"
          subtitle="Relative risk based on incident density"
          chartId="site-risk-scores"
          copyData={siteRisks.map((s) => ({ Site: s.site, 'Risk Score': s.riskScore }))}
        >
          <div className="space-y-3">
            {siteRisks.map((s) => (
              <div key={s.site} className="flex items-center gap-3">
                <div className="w-24 text-xs text-[var(--text-secondary)] truncate">{s.site}</div>
                <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, s.riskScore)}%`,
                      background: s.riskScore > 70 ? '#EF4444' : s.riskScore > 40 ? '#F59E0B' : '#10B981',
                    }}
                  />
                </div>
                <div className="w-8 text-xs text-right text-[var(--text-muted)] tabular-nums">{s.riskScore}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
