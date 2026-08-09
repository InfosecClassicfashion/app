'use client';

import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PersistentPage() {
  const { analytics, hasData, months } = useDashboard();

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const { recurringEndpoints } = analytics;

  if (recurringEndpoints.length === 0) {
    return (
      <div className="p-6 page-enter">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Persistent Risky Endpoints</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Endpoints appearing across multiple months
          </p>
        </div>
        <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <Clock className="w-6 h-6 text-[var(--text-dim)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No persistent endpoints detected</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Upload {months.length < 2 ? 'at least 2 months of ' : ''}EDR data to identify recurring risk endpoints.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 page-enter">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Persistent Risky Endpoints</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Endpoints with repeated detections across multiple months — ranked by recurrence score
          </p>
        </div>
        <Badge
          className="text-xs bg-amber-500/15 text-amber-300 border-amber-500/30"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          {recurringEndpoints.length} endpoints at risk
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Recurring Endpoints',
            value: recurringEndpoints.length,
            sub: 'seen in 2+ months',
            color: '#F59E0B',
          },
          {
            label: 'Total Incidents',
            value: recurringEndpoints.reduce((a, e) => a + e.totalIncidents, 0),
            sub: 'across all recurring endpoints',
            color: '#EF4444',
          },
          {
            label: 'Avg Incidents / Endpoint',
            value: (recurringEndpoints.reduce((a, e) => a + e.totalIncidents, 0) / recurringEndpoints.length).toFixed(1),
            sub: 'incidents per persistent endpoint',
            color: '#8B5CF6',
          },
        ].map((card) => (
          <div key={card.label} className="glass-card p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{card.label}</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{card.value}</p>
            <p className="text-[11px] text-[var(--text-dim)] mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <ChartCard
        title="Persistent Endpoint Ranking"
        subtitle="Sorted by recurrence score (months × incidents)"
        chartId="persistent-endpoints-table"
      >
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06]">
                <TableHead className="text-xs text-[var(--text-muted)]">Rank</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)]">Endpoint</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)] text-center">Months</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)] text-right">Total Incidents</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)] text-right">Score</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)]">Active Months</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringEndpoints.map((ep, i) => (
                <TableRow key={ep.endpoint} className="border-white/[0.04] data-row-hover">
                  <TableCell className="text-xs">
                    <span className={
                      i === 0 ? 'text-amber-400 font-bold' :
                      i === 1 ? 'text-slate-300 font-semibold' :
                      i === 2 ? 'text-amber-700 font-medium' :
                      'text-[var(--text-muted)]'
                    }>#{i + 1}</span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{ep.endpoint}</TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge
                      className={
                        ep.monthsAppeared >= 3
                          ? 'bg-red-500/15 text-red-300 border-red-500/30 text-[10px]'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]'
                      }
                    >
                      {ep.monthsAppeared}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{ep.totalIncidents}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-[var(--accent-purple)]">{ep.rankScore}</TableCell>
                  <TableCell className="text-xs">
                    <div className="flex gap-1 flex-wrap">
                      {ep.monthKeys.map((k) => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-white/[0.06]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </div>
  );
}
