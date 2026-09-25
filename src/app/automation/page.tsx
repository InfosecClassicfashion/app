'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faBan, faTrashCan, faFlask } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useDashboard } from '@/contexts/DashboardContext';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AutoCard = ({
  icon, label, value, sub, color,
}: { icon: IconDefinition; label: string; value: number; sub: string; color: string }) => (
  <div className="glass-card p-5 relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">{value.toLocaleString()}</p>
        <p className="text-[11px] text-[var(--text-dim)] mt-1">{sub}</p>
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
        <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </div>
);

export default function AutomationPage() {
  const { analytics, hasData } = useDashboard();

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const { automation } = analytics;

  const makeTable = (rows: { Endpoints: string; ThreatDetails: string; ReportedTime: Date | null; Site: string }[], emptyMsg: string) => (
    rows.length === 0 ? (
      <p className="text-sm text-[var(--text-muted)] py-4 text-center">{emptyMsg}</p>
    ) : (
      <div className="overflow-auto max-h-72">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06]">
              <TableHead className="text-xs text-[var(--text-muted)]">Endpoint</TableHead>
              <TableHead className="text-xs text-[var(--text-muted)]">Threat Details</TableHead>
              <TableHead className="text-xs text-[var(--text-muted)]">Site</TableHead>
              <TableHead className="text-xs text-[var(--text-muted)]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 30).map((r, i) => (
              <TableRow key={i} className="border-white/[0.04] data-row-hover">
                <TableCell className="text-xs font-mono">{r.Endpoints}</TableCell>
                <TableCell className="text-xs max-w-xs truncate text-[var(--text-secondary)]">{r.ThreatDetails}</TableCell>
                <TableCell className="text-xs">{r.Site}</TableCell>
                <TableCell className="text-xs text-[var(--text-muted)]">
                  {r.ReportedTime ? r.ReportedTime.toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  );

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-heading tracking-wider text-[var(--text-primary)]">Automation Summary</h1>
          <Badge
            className="text-[10px] px-2 py-0.5 h-5 font-semibold uppercase tracking-wider border"
            style={{
              background: 'rgba(245,158,11,0.15)',
              color: '#F59E0B',
              borderColor: 'rgba(245,158,11,0.3)',
            }}
          >
            <FontAwesomeIcon icon={faFlask} className="w-3 h-3 mr-1" />
            Beta — under testing
          </Badge>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          SentinelOne autonomous actions during the reporting month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AutoCard icon={faBolt} label="Auto-Resolved" value={automation.autoResolved}
          sub="Incidents resolved autonomously" color="#10B981" />
        <AutoCard icon={faBan} label="Rejected Uninstall Attempts" value={automation.rejectedUninstalls}
          sub="Uninstall attempts blocked" color="#EF4444" />
        <AutoCard icon={faTrashCan} label="Agents Decommissioned" value={automation.decommissioned}
          sub="Endpoints decommissioned" color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Auto-Resolved Incidents" subtitle={`${automation.autoResolved} total`} chartId="auto-resolved-table">
          {makeTable(automation.autoResolvedRows, 'No auto-resolved incidents detected')}
        </ChartCard>
        <ChartCard title="Rejected Uninstall Attempts" subtitle={`${automation.rejectedUninstalls} total`} chartId="rejected-uninstall-table">
          {makeTable(automation.rejectedUninstallRows, 'No rejected uninstall attempts detected')}
        </ChartCard>
        <ChartCard title="Decommissioned Agents" subtitle={`${automation.decommissioned} total`} chartId="decommissioned-table">
          {makeTable(automation.decommissionedRows, 'No decommissioned agents detected')}
        </ChartCard>
      </div>
    </div>
  );
}
