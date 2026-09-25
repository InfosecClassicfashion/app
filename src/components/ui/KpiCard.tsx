'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp,
  faArrowTrendDown,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { KPIMetric } from '@/types';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  metric: KPIMetric;
  sparkData?: { value: number }[];
  className?: string;
}

export function KpiCard({ metric, sparkData, className }: KpiCardProps) {
  const { label, value, deltaPercent, deltaDirection, color = '#8B5CF6' } = metric;

  const deltaIcon =
    deltaDirection === 'up' ? faArrowTrendUp :
    deltaDirection === 'down' ? faArrowTrendDown :
    faMinus;

  const deltaColor =
    deltaDirection === 'up'
      ? label.includes('Malicious') || label.includes('Suspicious') || label.includes('Incidents')
        ? 'text-red-400'  // up is bad for threat metrics
        : 'text-emerald-400'
      : deltaDirection === 'down'
        ? label.includes('Resolved') || label.includes('Auto')
          ? 'text-red-400'
          : 'text-emerald-400'
        : 'text-slate-400';

  return (
    <div
      className={cn(
        'glass-card p-5 flex flex-col gap-3 relative overflow-hidden group cursor-default',
        className
      )}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-80"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />

      {/* Glow blob */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider leading-tight">
          {label}
        </p>
        {deltaPercent !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', deltaColor)}>
            <FontAwesomeIcon icon={deltaIcon} className="w-3 h-3" />
            <span>{Math.abs(deltaPercent)}%</span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sparkData && sparkData.length > 1 && (
          <div className="w-20 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {metric.previous !== undefined && (
        <p className="text-[10px] text-[var(--text-dim)]">
          vs{' '}
          <span className="text-[var(--text-muted)]">
            {typeof metric.previous === 'number'
              ? metric.previous.toLocaleString()
              : metric.previous}
          </span>{' '}
          prior month
        </p>
      )}
    </div>
  );
}
