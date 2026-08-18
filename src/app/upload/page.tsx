'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCheck2, AlertCircle, Loader2, Database, Sparkles, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboard } from '@/contexts/DashboardContext';
import { parseEDRCsv, parseAssetCsv } from '@/lib/csv-parser';
import { generateSampleEDRCsv, generateSampleAssetCsv } from '@/lib/sample-data';
import type { EDRRow, AssetRow } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type UploadState = {
  file: File | null;
  rows: number;
  errors: string[];
  missingColumns: string[];
  dateRange: string;
  months: string[];
  loading: boolean;
};

const INITIAL: UploadState = {
  file: null, rows: 0, errors: [], missingColumns: [], dateRange: '', months: [], loading: false,
};

export default function UploadPage() {
  const router = useRouter();
  const { setEdrRows, setAssetRows } = useDashboard();

  const [edr, setEdr] = useState<UploadState>(INITIAL);
  const [asset, setAsset] = useState<UploadState>(INITIAL);
  const [parsedEdrRows, setParsedEdrRows] = useState<EDRRow[]>([]);
  const [parsedAssetRows, setParsedAssetRows] = useState<AssetRow[]>([]);
  const [processing, setProcessing] = useState(false);

  const edrInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);

  // ---- EDR file handler ----
  const handleEdrFile = useCallback(async (file: File) => {
    setEdr((s) => ({ ...s, loading: true, file }));
    const result = await parseEDRCsv(file);

    if (result.missingColumns.length > 0) {
      setEdr({ file, rows: 0, errors: [], missingColumns: result.missingColumns, dateRange: '', months: [], loading: false });
      return;
    }

    const dates = result.data.map((r) => r.ReportedTime).filter(Boolean) as Date[];
    const months = [...new Set(result.data.map((r) => r.monthKey).filter((k) => k !== 'unknown'))].sort();
    const minDate = dates.length ? format(new Date(Math.min(...dates.map((d) => d.getTime()))), 'MMM d, yyyy') : '';
    const maxDate = dates.length ? format(new Date(Math.max(...dates.map((d) => d.getTime()))), 'MMM d, yyyy') : '';

    setParsedEdrRows(result.data);
    setEdr({
      file, rows: result.data.length, errors: result.errors.slice(0, 5),
      missingColumns: [], dateRange: `${minDate} – ${maxDate}`, months, loading: false,
    });
  }, []);

  // ---- Asset file handler ----
  const handleAssetFile = useCallback(async (file: File) => {
    setAsset((s) => ({ ...s, loading: true, file }));
    const result = await parseAssetCsv(file);

    if (result.missingColumns.length > 0) {
      setAsset({ file, rows: 0, errors: [], missingColumns: result.missingColumns, dateRange: '', months: [], loading: false });
      return;
    }

    setParsedAssetRows(result.data);
    setAsset({
      file, rows: result.data.length, errors: result.errors.slice(0, 5),
      missingColumns: [], dateRange: '', months: [], loading: false,
    });
  }, []);

  // ---- Sample data ----
  const handleSampleData = useCallback(async () => {
    setEdr((s) => ({ ...s, loading: true }));
    setAsset((s) => ({ ...s, loading: true }));

    const edrCsvStr = generateSampleEDRCsv();
    const assetCsvStr = generateSampleAssetCsv();
    const edrFile = new File([edrCsvStr], 'sample_edr.csv', { type: 'text/csv' });
    const assetFile = new File([assetCsvStr], 'sample_assets.csv', { type: 'text/csv' });

    await Promise.all([handleEdrFile(edrFile), handleAssetFile(assetFile)]);
  }, [handleEdrFile, handleAssetFile]);

  // ---- Drag-and-drop helpers ----
  const makeDropProps = (handler: (file: File) => void) => ({
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handler(file);
    },
  });

  // ---- Process & open dashboard ----
  const handleProcess = async () => {
    if (parsedEdrRows.length === 0) return;
    setProcessing(true);
    setEdrRows(parsedEdrRows);
    setAssetRows(parsedAssetRows);
    await new Promise((r) => setTimeout(r, 300));
    router.push('/overview');
  };

  const canProcess = parsedEdrRows.length > 0;

  return (
    <div className="p-8 max-w-4xl mx-auto page-enter">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Upload Data</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Upload your SentinelOne EDR export and Asset CSV files to get started.
          Up to 3 months of EDR data are supported simultaneously.
        </p>
      </div>

      {/* Drop zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* EDR CSV */}
        <DropZone
          label="EDR Export CSV"
          sublabel="SentinelOne export (all 26 columns)"
          state={edr}
          accent="#8B5CF6"
          inputRef={edrInputRef}
          accept=".csv"
          onFile={handleEdrFile}
          onClear={() => { setEdr(INITIAL); setParsedEdrRows([]); }}
          extraInfo={edr.rows > 0 ? (
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] border-[var(--accent-emerald)]/40 text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10">
                  {edr.rows.toLocaleString()} rows
                </Badge>
                {edr.months.map((m) => (
                  <Badge key={m} variant="outline" className="text-[10px] border-[var(--accent-purple)]/40 text-[var(--accent-purple)] bg-[var(--accent-purple)]/10">
                    {m}
                  </Badge>
                ))}
              </div>
              {edr.dateRange && (
                <p className="text-[11px] text-[var(--text-muted)]">Range: {edr.dateRange}</p>
              )}
            </div>
          ) : undefined}
          {...makeDropProps(handleEdrFile)}
        />

        {/* Asset CSV */}
        <DropZone
          label="Asset CSV"
          sublabel="Asset inventory (ITAssets & S1AgentData columns)"
          state={asset}
          accent="#06B6D4"
          inputRef={assetInputRef}
          accept=".csv"
          onFile={handleAssetFile}
          onClear={() => { setAsset(INITIAL); setParsedAssetRows([]); }}
          extraHeaderAction={(
            <a
              href="/Asset_CSV_Template.csv"
              download="Asset_CSV_Template.csv"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-[var(--accent-cyan)] hover:underline inline-flex items-center gap-1 font-medium z-10"
              title="Download sample Asset CSV template"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </a>
          )}
          extraInfo={asset.rows > 0 ? (
            <div className="mt-3">
              <Badge variant="outline" className="text-[10px] border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10">
                {asset.rows.toLocaleString()} assets
              </Badge>
            </div>
          ) : undefined}
          {...makeDropProps(handleAssetFile)}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          onClick={handleSampleData}
          variant="outline"
          className="gap-2 border-white/10 bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]"
          disabled={edr.loading || asset.loading}
        >
          <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
          Load Sample Data
        </Button>

        <Button
          onClick={handleProcess}
          disabled={!canProcess || processing}
          className="gap-2 gradient-purple text-white border-0 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          Open Dashboard →
        </Button>

        {!canProcess && (
          <p className="text-xs text-[var(--text-muted)]">
            EDR CSV required to continue
          </p>
        )}
      </div>

      {/* Column reference */}
      <div className="mt-10 glass-card p-5">
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Required EDR Columns
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Status', 'Threat Details', 'Confidence Level', 'Endpoints',
            'Incident Status', 'Analyst Verdict', 'Reported Time (UTC)',
            'Identifying Time (UTC)', 'Detecting Engine', 'Initiated By',
            'Classification', 'Agent Version On Detection', 'Agent Version',
            'Hash', 'Path', 'Completed Actions', 'Pending Actions',
            'Reboot Required', 'Failed Actions', 'Policy At Detection',
            'Mitigated Preemptively', 'External Ticket Id', 'Account',
            'Site', 'Group', 'Originating Process',
          ].map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-white/[0.06]"
            >
              {col}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Drop Zone sub-component
// ============================================================
interface DropZoneProps {
  label: string;
  sublabel: string;
  state: UploadState;
  accent: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  onFile: (file: File) => void;
  onClear: () => void;
  extraInfo?: React.ReactNode;
  extraHeaderAction?: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

function DropZone({ label, sublabel, state, accent, inputRef, accept, onFile, onClear, extraInfo, extraHeaderAction, onDragOver, onDrop }: DropZoneProps) {
  const isSuccess = state.rows > 0;
  const isError = state.missingColumns.length > 0 || state.errors.length > 0;

  return (
    <div
      className={cn(
        'glass-card p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200',
        !isSuccess && !isError && 'hover:border-[var(--accent-purple)]/40',
        isSuccess && 'border-[var(--accent-emerald)]/40',
        isError && 'border-red-500/40',
      )}
      style={isSuccess ? { borderColor: `${accent}40` } : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => !state.loading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
            {extraHeaderAction}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sublabel}</p>
        </div>
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
          isSuccess ? 'bg-emerald-500/15' : isError ? 'bg-red-500/15' : 'bg-[var(--bg-elevated)]',
        )}>
          {state.loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
          ) : isSuccess ? (
            <FileCheck2 className="w-4 h-4" style={{ color: accent }} />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Upload className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      {/* File name or drop prompt */}
      {state.file ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--text-secondary)] font-mono truncate">{state.file.name}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="flex-shrink-0 text-[var(--text-dim)] hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="border border-dashed border-white/[0.1] rounded-lg p-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">Drag & drop or click to upload</p>
          <p className="text-[10px] text-[var(--text-dim)] mt-0.5">CSV format</p>
        </div>
      )}

      {/* Errors */}
      {state.missingColumns.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 font-medium mb-1">Missing columns:</p>
          <div className="flex flex-wrap gap-1">
            {state.missingColumns.map((col) => (
              <span key={col} className="text-[10px] font-mono bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {extraInfo}
    </div>
  );
}
