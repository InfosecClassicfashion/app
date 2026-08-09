'use client';

import React from 'react';
import { Sun, Moon, Database } from 'lucide-react';
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
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[var(--bg-card)] flex-shrink-0">
      {/* Left: scope */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Reporting Month:{' '}
            <span className="text-[var(--accent-purple)]">{currentMonthLabel}</span>
          </p>
          {comparisonLabel && (
            <p className="text-[10px] text-[var(--text-muted)]">
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
            className="text-[10px] gap-1 border-[var(--accent-emerald)]/40 text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10"
          >
            <Database className="w-3 h-3" />
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
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
