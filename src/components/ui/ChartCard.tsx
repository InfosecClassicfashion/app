'use client';

import React, { useState, useRef } from 'react';
import { MoreHorizontal, Download, Table2, Copy, Check } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Structured data that can be serialised as a TSV table
type CopyRow = Record<string, string | number | undefined | null>;

interface ChartCardProps {
  title: string;
  subtitle?: string;
  chartId?: string;
  className?: string;
  children: React.ReactNode;
  tableContent?: React.ReactNode;
  /** Structured data rows to copy as a tab-separated table */
  copyData?: CopyRow[];
}

/** Build a tab-separated value string from an array of objects */
function toTsv(rows: CopyRow[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join('\t'),
    ...rows.map((row) =>
      headers.map((h) => {
        const v = row[h];
        return v === null || v === undefined ? '' : String(v);
      }).join('\t')
    ),
  ];
  return lines.join('\n');
}

export function ChartCard({ title, subtitle, chartId, className, children, tableContent, copyData }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    const { captureElement } = await import('@/lib/chart-export');
    const dataUrl = await captureElement(cardRef.current);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.png`;
    link.click();
  };

  const handleCopy = async () => {
    let text = '';

    if (copyData && copyData.length > 0) {
      // Use structured data prop for clean TSV
      text = toTsv(copyData);
    } else {
      // Fallback: try to extract table data from the DOM table element inside this card
      const tableEl = cardRef.current?.querySelector('table');
      if (tableEl) {
        const rows = Array.from(tableEl.querySelectorAll('tr'));
        text = rows
          .map((tr) =>
            Array.from(tr.querySelectorAll('th, td'))
              .map((cell) => cell.textContent?.trim() ?? '')
              .join('\t')
          )
          .join('\n');
      }
    }

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers with restricted clipboard
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={cardRef}
      data-chart-id={chartId}
      className={cn('glass-card p-5 flex flex-col gap-4', className)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {tableContent && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTable((s) => !s)}
              className={cn(
                'h-7 w-7 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]',
                showTable && 'text-[var(--accent-purple)] bg-[var(--accent-purple)]/10'
              )}
              title={showTable ? 'Show chart' : 'Show table'}
            >
              <Table2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {/* Quick copy button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={cn(
              'h-7 w-7 transition-colors',
              copied
                ? 'text-emerald-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]'
            )}
            title="Copy data as table"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            } />
            <DropdownMenuContent
              align="end"
              className="bg-[var(--bg-elevated)] border-white/10 text-[var(--text-primary)] w-40"
            >
              <DropdownMenuItem
                onClick={handleExportPng}
                className="text-xs cursor-pointer focus:bg-white/[0.05]"
              >
                <Download className="w-3 h-3 mr-2" />
                Export PNG
              </DropdownMenuItem>
              {tableContent && (
                <DropdownMenuItem
                  onClick={() => setShowTable((s) => !s)}
                  className="text-xs cursor-pointer focus:bg-white/[0.05]"
                >
                  <Table2 className="w-3 h-3 mr-2" />
                  {showTable ? 'Show Chart' : 'View Table'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleCopy}
                className="text-xs cursor-pointer focus:bg-white/[0.05]"
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {showTable && tableContent ? tableContent : children}
      </div>
    </div>
  );
}
