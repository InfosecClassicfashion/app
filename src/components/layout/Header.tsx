'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { months, reportingMonth, comparisonMonth, setReportingMonth, edrRows, assetRows, hasData } =
    useDashboard();

  const currentMonthLabel = months.find((m) => m.key === reportingMonth)?.label ?? 'No data';
  const comparisonLabel = months.find((m) => m.key === comparisonMonth)?.label ?? null;

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/[0.06] bg-[var(--bg-card)] flex-shrink-0 z-10">
      {/* Left: trigger + scope */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]" />
        <Separator orientation="vertical" className="h-4 bg-white/10 hidden sm:block" />
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Reporting Month:{' '}
            <span className="text-[var(--accent-purple)]">{currentMonthLabel}</span>
          </p>
          {comparisonLabel && (
            <p className="text-[10px] text-[var(--text-muted)] hidden sm:block">
              Comparison baseline: {comparisonLabel}
            </p>
          )}
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Month selector */}
        {hasData && months.length > 0 && (
          <Select value={reportingMonth} onValueChange={(v) => v && setReportingMonth(v)}>
            <SelectTrigger
              className="h-8 w-40 text-xs bg-[var(--bg-elevated)] border-white/10 text-[var(--text-primary)]"
            >
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-elevated)] border-white/10">
              {months.map((m) => (
                <SelectItem
                  key={m.key}
                  value={m.key}
                  className="text-xs text-[var(--text-primary)] focus:bg-[var(--accent-purple)]/20"
                >
                  {m.label} ({m.count} rows)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Data badge */}
        {hasData && (
          <Badge
            variant="outline"
            className="text-[10px] gap-1.5 border-[var(--accent-emerald)]/40 text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10"
          >
            <FontAwesomeIcon icon={faDatabase} className="w-3 h-3" />
            {edrRows.length.toLocaleString()} EDR rows
            {assetRows.length > 0 && ` · ${assetRows.length} assets`}
          </Badge>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="w-3.5 h-3.5" />
        </Button>
      </div>
    </header>
  );
}
