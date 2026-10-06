'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/contexts/DashboardContext';
import { generateDashboardSummary } from '@/lib/summary-generator';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faCopy,
  faCheck,
  faDownload,
  faPrint,
  faShieldHalved,
  faTriangleExclamation,
  faCircleCheck,
  faCrosshairs,
  faDesktop,
  faGlobe,
  faBolt,
  faArrowTrendUp,
  faArrowTrendDown,
  faListCheck,
  faFileLines,
  faFileCode,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

export default function SummaryPage() {
  const {
    analytics,
    reportingMonth,
    comparisonMonth,
    months,
    reportingRows,
    comparisonRows,
    assetRows,
    hasData,
  } = useDashboard();

  const [copiedType, setCopiedType] = useState<'text' | 'markdown' | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'briefing'>('full');
  const [activeSection, setActiveSection] = useState<string>('all');

  const summary = useMemo(() => {
    if (!analytics || reportingRows.length === 0) return null;
    return generateDashboardSummary({
      analytics,
      reportingMonth,
      comparisonMonth,
      months,
      reportingRows,
      comparisonRows,
      assetRows,
    });
  }, [analytics, reportingMonth, comparisonMonth, months, reportingRows, comparisonRows, assetRows]);

  if (!hasData) return <EmptyState />;
  if (!analytics || !summary) {
    return (
      <EmptyState
        title="No data for selected month"
        description="Select a reporting month in the header or upload a CSV dataset to view the summary."
        showUploadLink={false}
      />
    );
  }

  // Copy helpers
  const handleCopy = async (type: 'text' | 'markdown') => {
    try {
      const content = type === 'markdown' ? summary.fullMarkdown : summary.plainText;
      await navigator.clipboard.writeText(content);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy summary to clipboard:', err);
    }
  };

  // Download helper
  const handleDownload = (type: 'md' | 'txt') => {
    const content = type === 'md' ? summary.fullMarkdown : summary.plainText;
    const mimeType = type === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const safeMonth = (reportingMonth || 'monthly').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `EDR_Security_Summary_${safeMonth}.${type}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getSectionIcon = (id: string) => {
    switch (id) {
      case 'posture-overview': return faShieldHalved;
      case 'threat-landscape': return faCrosshairs;
      case 'endpoint-exposure': return faDesktop;
      case 'regional-hotspots': return faGlobe;
      case 'chronic-persistence': return faTriangleExclamation;
      case 'resolution-velocity': return faCircleCheck;
      case 'automation-hygiene': return faBolt;
      default: return faFileLines;
    }
  };

  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'red':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      case 'blue':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-[var(--accent-purple)]/15 text-[var(--accent-purple)] border-[var(--accent-purple)]/30';
    }
  };

  const getToneStyle = (tone?: string) => {
    switch (tone) {
      case 'positive':
        return 'text-emerald-600 dark:text-emerald-400 font-semibold';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400 font-semibold';
      case 'danger':
        return 'text-rose-600 dark:text-rose-400 font-semibold';
      default:
        return 'text-[var(--text-primary)] font-semibold';
    }
  };

  const filteredSections = activeSection === 'all'
    ? summary.sections
    : summary.sections.filter((s) => s.id === activeSection);

  return (
    <div className="p-4 md:p-6 space-y-6 page-enter max-w-7xl mx-auto">
      {/* ── Page Header Block ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-600/25">
              <FontAwesomeIcon icon={faBookOpen} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading tracking-wider text-[var(--text-primary)]">
                Executive Dashboard Summary
              </h1>
              <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5">
                Detailed textual analysis & intelligence briefing for{' '}
                <span className="text-[var(--accent-purple)] font-medium">
                  {summary.metadata.reportingPeriod}
                </span>{' '}
                (Baseline: {summary.metadata.comparisonPeriod})
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* View Mode Toggle */}
          <div className="bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border-subtle)] flex items-center gap-1">
            <button
              onClick={() => setViewMode('full')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'full'
                  ? 'bg-[var(--accent-purple)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              Full Analysis
            </button>
            <button
              onClick={() => setViewMode('briefing')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'briefing'
                  ? 'bg-[var(--accent-purple)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              Briefing Only
            </button>
          </div>

          {/* Copy Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)]"
                >
                  <FontAwesomeIcon
                    icon={copiedType ? faCheck : faCopy}
                    className={cn('w-3.5 h-3.5', copiedType ? 'text-emerald-500 dark:text-emerald-400' : '')}
                  />
                  <span>{copiedType ? 'Copied!' : 'Copy Text'}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-primary)]">
              <DropdownMenuItem
                onClick={() => handleCopy('text')}
                className="text-xs cursor-pointer focus:bg-[var(--bg-elevated)]"
              >
                <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5 mr-2 text-[var(--text-muted)]" />
                Copy Clean Text
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCopy('markdown')}
                className="text-xs cursor-pointer focus:bg-[var(--bg-elevated)]"
              >
                <FontAwesomeIcon icon={faFileCode} className="w-3.5 h-3.5 mr-2 text-purple-400" />
                Copy Formatted Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Download Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)]"
                >
                  <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-primary)]">
              <DropdownMenuItem
                onClick={() => handleDownload('md')}
                className="text-xs cursor-pointer focus:bg-[var(--bg-elevated)]"
              >
                <FontAwesomeIcon icon={faFileCode} className="w-3.5 h-3.5 mr-2 text-cyan-400" />
                Markdown Document (.md)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownload('txt')}
                className="text-xs cursor-pointer focus:bg-[var(--bg-elevated)]"
              >
                <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5 mr-2 text-amber-400" />
                Plain Text Document (.txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Print Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 gap-1.5 text-xs border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)]"
            title="Print or save as PDF"
          >
            <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          {/* Link to Export Reports */}
          <Link href="/report">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-md shadow-blue-600/20"
            >
              <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5" />
              <span>Full Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Metadata Bar ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline" className="border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-2.5 py-1">
          Account: <span className="font-semibold text-[var(--text-primary)] ml-1">{summary.metadata.accountName}</span>
        </Badge>
        <Badge variant="outline" className="border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-2.5 py-1">
          Events: <span className="font-semibold text-[var(--text-primary)] ml-1">{summary.metadata.totalIncidents.toLocaleString()}</span>
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            'px-2.5 py-1 gap-1',
            summary.metadata.momDirection === 'up'
              ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
              : summary.metadata.momDirection === 'down'
              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
          )}
        >
          <FontAwesomeIcon
            icon={summary.metadata.momDirection === 'up' ? faArrowTrendUp : faArrowTrendDown}
            className="w-3 h-3"
          />
          MoM Velocity: {summary.metadata.momDeltaPct > 0 ? '+' : ''}{summary.metadata.momDeltaPct}%
        </Badge>
        <Badge variant="outline" className="border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-dim)] px-2.5 py-1 ml-auto hidden md:inline-flex">
          Generated: {summary.metadata.generatedAt}
        </Badge>
      </div>

      {/* ── Executive Briefing Card (High-Impact Hero) ── */}
      <div className="glass-card p-5 md:p-6 rounded-xl border border-purple-500/25 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-elevated)] to-[var(--bg-card)] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-purple)] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20">
            Executive Synopsis
          </span>
          <span className="text-xs text-[var(--text-dim)]">·</span>
          <span className="text-xs text-[var(--text-secondary)]">C-Suite & SOC Leadership Summary</span>
        </div>

        <p className="text-sm md:text-base leading-relaxed text-[var(--text-primary)] font-normal mb-6">
          {summary.executiveBriefing.overviewParagraph}
        </p>

        {/* 4 Critical Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          {summary.executiveBriefing.criticalMetrics.map((m, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-[var(--text-muted)]">{m.label}</span>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1 tabular-nums">
                {m.value}
              </span>
              <span className="text-[10px] text-[var(--accent-purple)] mt-1 font-medium truncate">
                {m.subtext}
              </span>
            </div>
          ))}
        </div>

        {/* Executive Bullet Highlights */}
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Key Telemetry Takeaways
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {summary.executiveBriefing.bulletPoints.map((bp, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] leading-normal">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-purple)] flex-shrink-0 mt-1.5" />
                <span>{bp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section Jump Tabs (Visible in Full Analysis Mode) ── */}
      {viewMode === 'full' && (
        <div className="print:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-[var(--text-muted)] mr-1 flex items-center gap-1 font-medium whitespace-nowrap">
            <FontAwesomeIcon icon={faEye} className="w-3 h-3" /> Jump to:
          </span>
          <button
            onClick={() => setActiveSection('all')}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
              activeSection === 'all'
                ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] border-[var(--accent-purple)]/40 font-semibold'
                : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
            )}
          >
            All Sections ({summary.sections.length})
          </button>
          {summary.sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5',
                activeSection === s.id
                  ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] border-[var(--accent-purple)]/40 font-semibold'
                  : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
              )}
            >
              <FontAwesomeIcon icon={getSectionIcon(s.id)} className="w-3 h-3 text-[var(--text-muted)]" />
              {s.title.replace(/^\d+\.\s*/, '')}
            </button>
          ))}
          <button
            onClick={() => setActiveSection('action-plan')}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5',
              activeSection === 'action-plan'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-semibold'
                : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]'
            )}
          >
            <FontAwesomeIcon icon={faListCheck} className="w-3 h-3 text-[var(--text-muted)]" />
            Action Plan
          </button>
        </div>
      )}

      {/* ── Detailed Analytical Narrative Sections ── */}
      {viewMode === 'full' && (
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="glass-card p-5 md:p-6 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-colors"
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={getSectionIcon(section.id)} className="w-4 h-4 text-[var(--accent-purple)]" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-heading tracking-wider text-[var(--text-primary)]">
                      {section.title}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                {section.summaryBadge && (
                  <Badge variant="outline" className={cn('text-xs self-start sm:self-center', getBadgeStyle(section.badgeVariant))}>
                    {section.summaryBadge}
                  </Badge>
                )}
              </div>

              {/* Narrative Paragraphs */}
              <div className="mt-4 space-y-3.5">
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-xs md:text-sm leading-relaxed text-[var(--text-secondary)]">
                    {p}
                  </p>
                ))}
              </div>

              {/* Key Data Points Grid */}
              {section.keyDataPoints.length > 0 && (
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  {section.keyDataPoints.map((dp, dpIdx) => (
                    <div
                      key={dpIdx}
                      className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-between"
                    >
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">
                        {dp.label}
                      </span>
                      <span className={cn('text-base md:text-lg font-bold mt-1 tabular-nums', getToneStyle(dp.tone))}>
                        {dp.value}
                      </span>
                      {dp.change && (
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                          {dp.change}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Key Observations Box */}
              {section.takeaways.length > 0 && (
                <div className="mt-4 p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-purple)] block mb-1.5">
                    Strategic Observations
                  </span>
                  <div className="space-y-1.5">
                    {section.takeaways.map((t, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Strategic SOC Action Plan & Recommendations ── */}
      {(viewMode === 'briefing' || activeSection === 'all' || activeSection === 'action-plan') && (
        <div id="action-plan" className="glass-card p-5 md:p-6 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faListCheck} className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-heading tracking-wider text-[var(--text-primary)]">
                Strategic SOC Action Plan & Remediation Roadmap
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Prioritized operational recommendations derived directly from telemetry analytics
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Priority 1: Immediate */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-rose-500/20 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Priority 1: Immediate (24–48h)
                </h3>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">
                Host isolation, credential rotation, and critical threat suppression.
              </p>
              <div className="space-y-2.5 flex-1">
                {summary.actionPlan.immediate.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5">{idx + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority 2: Short Term */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-amber-500/20 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Priority 2: Hardening (1–2 Wks)
                </h3>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">
                Policy transitions, agent patching, and inventory reconciliation.
              </p>
              <div className="space-y-2.5 flex-1">
                {summary.actionPlan.shortTerm.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">{idx + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority 3: Medium Term */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-blue-500/20 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Priority 3: Governance (30 Days)
                </h3>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">
                Behavioral tuning, user training, and proactive threat hunting.
              </p>
              <div className="space-y-2.5 flex-1">
                {summary.actionPlan.mediumTerm.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">{idx + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Footer Links ── */}
      <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)] print:hidden">
        <div className="flex items-center gap-2">
          <span>Explore related analytics:</span>
          <Link href="/overview" className="text-[var(--accent-purple)] hover:underline font-medium">
            Visual Overview
          </Link>
          <span>·</span>
          <Link href="/threats" className="text-[var(--accent-purple)] hover:underline font-medium">
            Threat Analysis
          </Link>
          <span>·</span>
          <Link href="/persistent" className="text-[var(--accent-purple)] hover:underline font-medium">
            Persistent Risks
          </Link>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Back to Top ↑
        </Button>
      </div>
    </div>
  );
}
