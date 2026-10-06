'use client';

import React, { useMemo, useState } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { ChartCard } from '@/components/ui/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileCode,
  faTerminal,
  faSkullCrossbones,
  faTriangleExclamation,
  faCircleCheck,
  faMagnifyingGlass,
  faCopy,
  faCheck,
  faFilter,
  faShieldHalved,
  faChevronLeft,
  faChevronRight,
  faCrosshairs,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';

type HeatmapMode = 'weekly' | 'site';

// ── Colour helpers for Heatmap ──────────────────────────────────────────────
function heatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'rgba(128,128,128,0.06)';
  const t = Math.min(value / max, 1);
  const r = Math.round(30   + t * (139 - 30));
  const g = Math.round(32   + t * (92  - 32));
  const b = Math.round(60   + t * (246 - 60));
  return `rgb(${r},${g},${b})`;
}

function textColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'transparent';
  return '#ffffff';
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
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>Detections:</span>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                width: 24, height: 14, borderRadius: 3,
                background: s.color,
                border: '1px solid var(--border-subtle)',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.value}</span>
          </React.Fragment>
        ))}
      </div>

      <table style={{ borderCollapse: 'separate', borderSpacing: 2, minWidth: cols.length * 38 + maxLabelWidth }}>
        <thead>
          <tr>
            <th style={{ width: maxLabelWidth, minWidth: maxLabelWidth }} />
            {cols.map((col) => (
              <th key={col} style={{
                fontSize: 10, color: 'var(--text-muted)', fontWeight: 500,
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
                fontSize: 10, color: 'var(--text-secondary)', paddingRight: 8,
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

const PAGE_SIZE = 12;

// ── Main Page Component ─────────────────────────────────────────────────────
export default function ThreatsPage() {
  const { analytics, hasData, reportingMonth, months } = useDashboard();
  const [mode, setMode] = useState<HeatmapMode>('weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConfidence, setSelectedConfidence] = useState<'all' | 'malicious' | 'suspicious' | 'benign'>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Safely extract dataset items
  const heatmapWeeklyThreat = analytics?.heatmapWeeklyThreat ?? [];
  const heatmapSiteClassification = analytics?.heatmapSiteClassification ?? [];
  const topThreatFiles = analytics?.topThreatFiles ?? [];
  const topOriginatingApps = analytics?.topOriginatingApps ?? [];
  const majorAlerts = analytics?.majorAlerts ?? [];

  const activeHeatmapData = mode === 'weekly' ? heatmapWeeklyThreat : heatmapSiteClassification;

  // Filter major alerts
  const filteredAlerts = useMemo(() => {
    return majorAlerts.filter((item) => {
      // Confidence filter
      if (selectedConfidence !== 'all') {
        const conf = item.confidence.toLowerCase();
        if (selectedConfidence === 'malicious' && !conf.includes('malicious')) return false;
        if (selectedConfidence === 'suspicious' && !conf.includes('suspicious')) return false;
        if (selectedConfidence === 'benign' && !conf.includes('benign')) return false;
      }

      // Classification filter
      if (selectedClassification !== 'all' && item.classification !== selectedClassification) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = item.fileName.toLowerCase().includes(q);
        const matchApp = item.appName.toLowerCase().includes(q);
        const matchEndpoint = item.endpoint.toLowerCase().includes(q);
        const matchDetails = item.threatDetails.toLowerCase().includes(q);
        const matchHash = item.hash.toLowerCase().includes(q);
        const matchClass = item.classification.toLowerCase().includes(q);
        if (!matchName && !matchApp && !matchEndpoint && !matchDetails && !matchHash && !matchClass) {
          return false;
        }
      }

      return true;
    });
  }, [majorAlerts, selectedConfidence, selectedClassification, searchTerm]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAlerts.slice(start, start + PAGE_SIZE);
  }, [filteredAlerts, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedConfidence, selectedClassification]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct classifications for filter dropdown
  const uniqueClassifications = useMemo(() => {
    const set = new Set<string>();
    majorAlerts.forEach((a) => {
      if (a.classification && a.classification !== 'Unclassified') set.add(a.classification);
    });
    return Array.from(set).sort();
  }, [majorAlerts]);

  // Heatmap table view calculation
  const heatmapTableData = useMemo(() => {
    if (activeHeatmapData.length === 0) return null;
    const rows = [...new Set(activeHeatmapData.map((c) => c.y))];
    const cols = [...new Set(activeHeatmapData.map((c) => c.x))].sort();
    const copyRows = rows.map((row) => {
      const entry: Record<string, string | number> = { Threat: row };
      cols.forEach((col) => {
        const v = activeHeatmapData.find((c) => c.x === col && c.y === row)?.value ?? 0;
        entry[col] = v;
      });
      return entry;
    });
    const table = (
      <div className="overflow-auto max-h-72">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--border-subtle)]">
              <TableHead className="text-xs text-[var(--text-muted)]">Threat</TableHead>
              {cols.map((col) => (
                <TableHead key={col} className="text-xs text-[var(--text-muted)] text-right">{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row} className="border-[var(--border-subtle)] data-row-hover">
                <TableCell className="text-xs font-mono max-w-xs truncate text-[var(--text-primary)]" title={row}>{row}</TableCell>
                {cols.map((col) => {
                  const v = activeHeatmapData.find((c) => c.x === col && c.y === row)?.value ?? 0;
                  return (
                    <TableCell key={col} className="text-xs text-right tabular-nums text-[var(--text-primary)]">
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
  }, [activeHeatmapData]);

  // Early returns AFTER all hooks
  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const hasHeatmapData = activeHeatmapData.some((c) => c.value > 0);
  const currentMonthLabel = months.find((m) => m.key === reportingMonth)?.label ?? reportingMonth;

  // Stats calculation
  const totalMaliciousAlerts = majorAlerts.filter((a) =>
    a.confidence.toLowerCase().includes('malicious')
  ).length;

  return (
    <div className="p-4 md:p-6 space-y-6 page-enter max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-600/20">
              <FontAwesomeIcon icon={faCrosshairs} className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading tracking-wider text-[var(--text-primary)]">
                Threat Analysis
              </h1>
              <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5">
                File and application threat telemetry, major alerts, and behavioral distribution for{' '}
                <span className="text-[var(--accent-purple)] font-medium">{currentMonthLabel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Heatmap Mode Toggle in Header */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] self-start sm:self-auto">
          {([['weekly', 'Weekly Recurring'], ['site', 'Site × Category']] as [HeatmapMode, string][]).map(([m, label]) => (
            <Button
              key={m}
              size="sm"
              variant="ghost"
              onClick={() => setMode(m)}
              className={cn(
                'h-7 px-2.5 text-xs font-medium transition-all',
                mode === m
                  ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] shadow-sm font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Threat Intelligence Quick Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Active Threat Files</span>
          <span className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">
            {topThreatFiles.length}
          </span>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1 font-medium truncate">
            Top: {topThreatFiles[0]?.fileName ?? 'None'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Originating Apps</span>
          <span className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">
            {topOriginatingApps.length}
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-medium truncate">
            Primary: {topOriginatingApps[0]?.appName ?? 'System'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Malicious Alerts</span>
          <span className="text-xl md:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {totalMaliciousAlerts.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium">
            Confirmed Critical Alerts
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Top Executable</span>
          <span className="text-base md:text-lg font-bold text-amber-600 dark:text-amber-300 mt-1 truncate" title={topThreatFiles[0]?.fileName}>
            {topThreatFiles[0]?.fileName ?? 'N/A'}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
            {topThreatFiles[0]?.count ?? 0} total detections
          </span>
        </div>

        <div className="col-span-2 md:col-span-1 p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Top Execution Vector</span>
          <span className="text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate" title={topOriginatingApps[0]?.appName}>
            {topOriginatingApps[0]?.appName ?? 'N/A'}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
            {topOriginatingApps[0]?.count ?? 0} processes spawned
          </span>
        </div>
      </div>

      {/* ── Top Threat Files & Originating Applications Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Top Threat Files */}
        <div className="glass-card p-5 rounded-xl border border-[var(--border-subtle)] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faFileCode} className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-heading tracking-wider text-[var(--text-primary)]">
                  Top Threat Files & Payloads
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  High-frequency binaries and target files by detection count
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10">
              {topThreatFiles.length} Binaries
            </Badge>
          </div>

          <div className="mt-3 overflow-auto max-h-[320px] scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--border-subtle)]">
                  <TableHead className="text-[11px] text-[var(--text-muted)]">File / Payload</TableHead>
                  <TableHead className="text-[11px] text-[var(--text-muted)]">Classification</TableHead>
                  <TableHead className="text-[11px] text-[var(--text-muted)]">Target Host</TableHead>
                  <TableHead className="text-[11px] text-[var(--text-muted)] text-right">Detections</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topThreatFiles.slice(0, 8).map((f, idx) => (
                  <TableRow key={idx} className="border-[var(--border-subtle)] data-row-hover">
                    <TableCell className="text-xs py-2">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileCode} className="w-3 h-3 text-rose-500 flex-shrink-0" />
                        <span className="font-mono font-medium text-[var(--text-primary)] max-w-[160px] truncate" title={f.filePath}>
                          {f.fileName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-2">
                      <div className="flex flex-wrap gap-1">
                        {f.classifications.slice(0, 2).map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-2 text-[var(--text-secondary)] font-mono text-[11px] truncate max-w-[100px]">
                      {f.topEndpoint}
                    </TableCell>
                    <TableCell className="text-xs py-2 text-right font-bold tabular-nums text-[var(--text-primary)]">
                      {f.count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Card 2: Top Originating Applications */}
        <div className="glass-card p-5 rounded-xl border border-[var(--border-subtle)] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faTerminal} className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-heading tracking-wider text-[var(--text-primary)]">
                  Top Originating Applications & Processes
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Parent processes and execution applications initiating threats
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10">
              {topOriginatingApps.length} Processes
            </Badge>
          </div>

          <div className="mt-3 overflow-auto max-h-[320px] scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--border-subtle)]">
                  <TableHead className="text-[11px] text-[var(--text-muted)]">Originating App</TableHead>
                  <TableHead className="text-[11px] text-[var(--text-muted)]">Primary Vector</TableHead>
                  <TableHead className="text-[11px] text-[var(--text-muted)]">Triggered File</TableHead>
                  <TableHead className="text-[11px] text-[var(--text-muted)] text-right">Executions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOriginatingApps.slice(0, 8).map((a, idx) => (
                  <TableRow key={idx} className="border-[var(--border-subtle)] data-row-hover">
                    <TableCell className="text-xs py-2">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faTerminal} className="w-3 h-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                        <span className="font-mono font-medium text-[var(--text-primary)] max-w-[150px] truncate" title={a.appName}>
                          {a.appName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 font-medium">
                        {a.topClassification}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs py-2 text-[var(--text-secondary)] font-mono text-[11px] truncate max-w-[120px]" title={a.topFile}>
                      {a.topFile}
                    </TableCell>
                    <TableCell className="text-xs py-2 text-right font-bold tabular-nums text-[var(--text-primary)]">
                      {a.count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* ── Major Alerts Table by File & Application ── */}
      <div className="glass-card p-5 md:p-6 rounded-xl border border-[var(--border-subtle)] space-y-4">
        {/* Section Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faSkullCrossbones} className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <h2 className="text-lg md:text-xl font-heading tracking-wider text-[var(--text-primary)]">
                Major Threat Alerts by File & Application
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Granular incident records showing affected file binaries, parent execution apps, target endpoints, and remediation status.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="w-3 h-3 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search file, app, endpoint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--accent-purple)]"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border-subtle)]">
              <button
                onClick={() => setSelectedConfidence('all')}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  selectedConfidence === 'all'
                    ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                All
              </button>
              <button
                onClick={() => setSelectedConfidence('malicious')}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  selectedConfidence === 'malicious'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-rose-500'
                )}
              >
                Malicious
              </button>
              <button
                onClick={() => setSelectedConfidence('suspicious')}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  selectedConfidence === 'suspicious'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-amber-500'
                )}
              >
                Suspicious
              </button>
            </div>

            {/* Classification Dropdown Filter */}
            {uniqueClassifications.length > 0 && (
              <select
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
                className="h-8 px-2 text-xs rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] cursor-pointer"
              >
                <option value="all">All Classifications</option>
                {uniqueClassifications.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
          <Table>
            <TableHeader className="bg-[var(--bg-elevated)]">
              <TableRow className="border-[var(--border-subtle)]">
                <TableHead className="text-xs text-[var(--text-muted)] w-[240px]">File Name & Path</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)] w-[160px]">Originating App</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)]">Classification</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)]">Severity</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)]">Target Endpoint</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)]">Engine</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)]">Status / Action</TableHead>
                <TableHead className="text-xs text-[var(--text-muted)] text-right">Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-[var(--text-muted)]">
                    No major alerts matched your search and filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAlerts.map((alert) => {
                  const isMalicious = alert.confidence.toLowerCase().includes('malicious');
                  const isSuspicious = alert.confidence.toLowerCase().includes('suspicious');
                  const reportedDate = alert.reportedTime && isValid(new Date(alert.reportedTime))
                    ? format(new Date(alert.reportedTime), 'MMM dd, HH:mm')
                    : '—';

                  return (
                    <TableRow key={alert.id} className="border-[var(--border-subtle)] data-row-hover">
                      {/* File Name & Path */}
                      <TableCell className="text-xs py-2.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-mono font-semibold text-[var(--text-primary)]">
                            <FontAwesomeIcon icon={faFileCode} className="w-3 h-3 text-rose-500 flex-shrink-0" />
                            <span className="truncate max-w-[200px]" title={alert.filePath}>
                              {alert.fileName}
                            </span>
                            {alert.hash && (
                              <button
                                onClick={() => handleCopy(alert.hash, alert.id)}
                                title={`Copy Hash: ${alert.hash}`}
                                className="ml-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                              >
                                <FontAwesomeIcon
                                  icon={copiedId === alert.id ? faCheck : faCopy}
                                  className={copiedId === alert.id ? 'text-emerald-500' : ''}
                                />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono truncate max-w-[220px]" title={alert.filePath}>
                            {alert.filePath}
                          </span>
                        </div>
                      </TableCell>

                      {/* Originating App */}
                      <TableCell className="text-xs py-2.5">
                        <div className="flex items-center gap-1.5 font-mono text-[var(--text-primary)]">
                          <FontAwesomeIcon icon={faTerminal} className="w-3 h-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                          <span className="font-medium text-[var(--text-primary)] truncate max-w-[130px]" title={alert.appName}>
                            {alert.appName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Classification */}
                      <TableCell className="text-xs py-2.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-300 font-medium whitespace-nowrap"
                        >
                          {alert.classification}
                        </Badge>
                      </TableCell>

                      {/* Severity / Confidence */}
                      <TableCell className="text-xs py-2.5">
                        <span
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap',
                            isMalicious
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : isSuspicious
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          )}
                        >
                          {alert.confidence}
                        </span>
                      </TableCell>

                      {/* Target Endpoint & Site */}
                      <TableCell className="text-xs py-2.5">
                        <div className="flex flex-col">
                          <span className="font-mono text-[var(--text-primary)] font-medium truncate max-w-[120px]">
                            {alert.endpoint}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">{alert.site}</span>
                        </div>
                      </TableCell>

                      {/* Engine */}
                      <TableCell className="text-xs py-2.5 text-[var(--text-secondary)] truncate max-w-[130px]" title={alert.engine}>
                        {alert.engine}
                      </TableCell>

                      {/* Status & Actions Taken */}
                      <TableCell className="text-xs py-2.5">
                        <div className="flex flex-col">
                          <span className={cn(
                            'text-[11px] font-medium capitalize',
                            alert.status.toLowerCase().includes('resolved')
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          )}>
                            {alert.status}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[110px]" title={alert.actions}>
                            {alert.actions}
                          </span>
                        </div>
                      </TableCell>

                      {/* Reported Time */}
                      <TableCell className="text-xs py-2.5 text-right font-mono text-[var(--text-muted)] whitespace-nowrap">
                        {reportedDate}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Pagination Controls */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2">
          <span>
            Showing <span className="font-semibold text-[var(--text-primary)]">{filteredAlerts.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}</span> to{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {Math.min(currentPage * PAGE_SIZE, filteredAlerts.length)}
            </span>{' '}
            of <span className="font-semibold text-[var(--text-primary)]">{filteredAlerts.length}</span> alerts
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
            </Button>
            <span className="px-2 font-medium text-[var(--text-primary)]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Longitudinal Threat Heatmap Section ── */}
      <ChartCard
        title={mode === 'weekly' ? 'Weekly Recurring Threat Heatmap' : 'Site × Classification Heatmap'}
        subtitle={
          mode === 'weekly'
            ? 'Longitudinal threat recurrence · rows = threat hash/name, columns = week number'
            : 'Detection intensity mapped across corporate sites and threat classifications'
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
              <p className="text-[var(--text-muted)] text-xs max-w-sm">
                This heatmap only shows threats detected across multiple weeks. Try selecting a month with more longitudinal data, or toggle to the Site × Classification view above.
              </p>
            )}
          </div>
        ) : (
          <CssHeatmap
            data={activeHeatmapData}
            maxLabelWidth={mode === 'weekly' ? 160 : 180}
          />
        )}
      </ChartCard>
    </div>
  );
}
