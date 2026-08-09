'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { EDRRow, AssetRow, MonthSummary, AnalyticsResult } from '@/types';
import { segmentByMonth } from '@/lib/csv-parser';
import { computeAnalytics } from '@/lib/analytics';

// ============================================================
// Context Shape
// ============================================================
interface DashboardContextValue {
  // Raw data
  edrRows: EDRRow[];
  assetRows: AssetRow[];
  months: MonthSummary[];

  // Month selection
  reportingMonth: string;
  comparisonMonth: string | null;
  setReportingMonth: (month: string) => void;

  // Computed
  reportingRows: EDRRow[];
  comparisonRows: EDRRow[];
  analytics: AnalyticsResult | null;

  // Setters
  setEdrRows: (rows: EDRRow[]) => void;
  setAssetRows: (rows: AssetRow[]) => void;

  // State flags
  hasData: boolean;
  isLoaded: boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ============================================================
// Storage helpers (safe SSR)
// ============================================================
const STORAGE_KEY_EDR = 'edr_dashboard_edr_rows';
const STORAGE_KEY_ASSETS = 'edr_dashboard_asset_rows';
const STORAGE_KEY_MONTH = 'edr_dashboard_reporting_month';

function safeSave(key: string, data: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Quota exceeded — ignore
  }
}

function safeLoad<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// ============================================================
// Provider
// ============================================================
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [edrRows, setEdrRowsState] = useState<EDRRow[]>([]);
  const [assetRows, setAssetRowsState] = useState<AssetRow[]>([]);
  const [reportingMonth, setReportingMonthState] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const storedEdr = safeLoad<EDRRow[]>(STORAGE_KEY_EDR);
    const storedAssets = safeLoad<AssetRow[]>(STORAGE_KEY_ASSETS);
    const storedMonth = safeLoad<string>(STORAGE_KEY_MONTH);

    if (storedEdr && storedEdr.length > 0) {
      // Re-parse dates (they come back as strings from JSON)
      const parsed = storedEdr.map((r) => ({
        ...r,
        ReportedTime: r.ReportedTime ? new Date(r.ReportedTime) : null,
        IdentifyingTime: r.IdentifyingTime ? new Date(r.IdentifyingTime) : null,
      }));
      setEdrRowsState(parsed);
    }
    if (storedAssets) setAssetRowsState(storedAssets);
    if (storedMonth) setReportingMonthState(storedMonth);
    setIsLoaded(true);
  }, []);

  // Derived months
  const months = useMemo(() => segmentByMonth(edrRows), [edrRows]);

  // Auto-select reporting month (latest) when months change
  useEffect(() => {
    if (months.length > 0 && !reportingMonth) {
      const latest = months[months.length - 1].key;
      setReportingMonthState(latest);
      safeSave(STORAGE_KEY_MONTH, latest);
    }
  }, [months, reportingMonth]);

  // Compute comparison month (prior to reporting month)
  const comparisonMonth = useMemo<string | null>(() => {
    if (!reportingMonth || months.length < 2) return null;
    const idx = months.findIndex((m) => m.key === reportingMonth);
    return idx > 0 ? months[idx - 1].key : null;
  }, [reportingMonth, months]);

  const reportingRows = useMemo(
    () => edrRows.filter((r) => r.monthKey === reportingMonth),
    [edrRows, reportingMonth]
  );
  const comparisonRows = useMemo(
    () => (comparisonMonth ? edrRows.filter((r) => r.monthKey === comparisonMonth) : []),
    [edrRows, comparisonMonth]
  );

  // Analytics
  const analytics = useMemo<AnalyticsResult | null>(() => {
    if (reportingRows.length === 0) return null;
    return computeAnalytics(
      reportingRows,
      comparisonRows,
      assetRows,
      months.map((m) => ({ key: m.key, rows: m.rows }))
    );
  }, [reportingRows, comparisonRows, assetRows, months]);

  // Setters with persistence
  const setEdrRows = useCallback((rows: EDRRow[]) => {
    setEdrRowsState(rows);
    setReportingMonthState(''); // reset month selection
    safeSave(STORAGE_KEY_EDR, rows);
    sessionStorage.removeItem(STORAGE_KEY_MONTH);
  }, []);

  const setAssetRows = useCallback((rows: AssetRow[]) => {
    setAssetRowsState(rows);
    safeSave(STORAGE_KEY_ASSETS, rows);
  }, []);

  const setReportingMonth = useCallback((month: string) => {
    setReportingMonthState(month);
    safeSave(STORAGE_KEY_MONTH, month);
  }, []);

  const hasData = edrRows.length > 0;

  return (
    <DashboardContext.Provider value={{
      edrRows, assetRows, months,
      reportingMonth, comparisonMonth, setReportingMonth,
      reportingRows, comparisonRows, analytics,
      setEdrRows, setAssetRows,
      hasData, isLoaded,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================
export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
