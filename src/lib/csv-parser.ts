import Papa from 'papaparse';
import { format, parseISO, isValid } from 'date-fns';
import type { EDRRow, AssetRow, MonthSummary } from '@/types';

// ============================================================
// Required columns
// ============================================================
const EDR_REQUIRED_COLUMNS = [
  'Status', 'Threat Details', 'Confidence Level', 'Endpoints',
  'Incident Status', 'Analyst Verdict', 'Reported Time (UTC)',
  'Identifying Time (UTC)', 'Detecting Engine', 'Initiated By',
  'Classification', 'Agent Version On Detection', 'Agent Version',
  'Hash', 'Path', 'Completed Actions', 'Pending Actions',
  'Reboot Required', 'Failed Actions', 'Policy At Detection',
  'Mitigated Preemptively', 'External Ticket Id', 'Account',
  'Site', 'Group', 'Originating Process',
];

const ASSET_REQUIRED_COLUMNS = ['ITAssets', 'S1AgentData'];

// ============================================================
// Parse helpers
// ============================================================
function safeDate(val: string | undefined): Date | null {
  if (!val) return null;
  try {
    const d = parseISO(val);
    if (isValid(d)) return d;
    const d2 = new Date(val);
    if (isValid(d2)) return d2;
    return null;
  } catch {
    return null;
  }
}

function monthKey(date: Date | null): string {
  if (!date) return 'unknown';
  return format(date, 'yyyy-MM');
}

// ============================================================
// EDR CSV Parser
// ============================================================
export interface ParseResult<T> {
  data: T[];
  errors: string[];
  missingColumns: string[];
}

export function parseEDRCsv(file: File): Promise<ParseResult<EDRRow>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const missingColumns = EDR_REQUIRED_COLUMNS.filter(
          (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
          resolve({ data: [], errors: [], missingColumns });
          return;
        }

        const errors: string[] = [];
        const data: EDRRow[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results.data as any[]).forEach((row, index) => {
          try {
            const reportedTime = safeDate(row['Reported Time (UTC)']);
            const identifyingTime = safeDate(row['Identifying Time (UTC)']);
            const key = monthKey(reportedTime);

            data.push({
              Status: row['Status'] ?? '',
              ThreatDetails: row['Threat Details'] ?? '',
              ConfidenceLevel: row['Confidence Level'] ?? '',
              Endpoints: row['Endpoints'] ?? '',
              IncidentStatus: row['Incident Status'] ?? '',
              AnalystVerdict: row['Analyst Verdict'] ?? '',
              ReportedTime: reportedTime,
              IdentifyingTime: identifyingTime,
              DetectingEngine: row['Detecting Engine'] ?? '',
              InitiatedBy: row['Initiated By'] ?? '',
              Classification: row['Classification'] ?? '',
              AgentVersionOnDetection: row['Agent Version On Detection'] ?? '',
              AgentVersion: row['Agent Version'] ?? '',
              Hash: row['Hash'] ?? '',
              Path: row['Path'] ?? '',
              CompletedActions: row['Completed Actions'] ?? '',
              PendingActions: row['Pending Actions'] ?? '',
              RebootRequired: row['Reboot Required'] ?? '',
              FailedActions: row['Failed Actions'] ?? '',
              PolicyAtDetection: row['Policy At Detection'] ?? '',
              MitigatedPreemptively: row['Mitigated Preemptively'] ?? '',
              ExternalTicketId: row['External Ticket Id'] ?? '',
              Account: row['Account'] ?? '',
              Site: row['Site'] ?? '',
              Group: row['Group'] ?? '',
              OriginatingProcess: row['Originating Process'] ?? '',
              monthKey: key,
            });
          } catch (err) {
            errors.push(`Row ${index + 2}: ${String(err)}`);
          }
        });

        resolve({ data, errors, missingColumns: [] });
      },
      error: (err) => {
        resolve({ data: [], errors: [String(err)], missingColumns: [] });
      },
    });
  });
}

// ============================================================
// Asset CSV Parser
// ============================================================
export function parseAssetCsv(file: File): Promise<ParseResult<AssetRow>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const missingColumns = ASSET_REQUIRED_COLUMNS.filter(
          (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
          resolve({ data: [], errors: [], missingColumns });
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: AssetRow[] = (results.data as any[])
          .map((row) => ({
            ITAssets: String(row['ITAssets'] ?? '').trim(),
            S1AgentData: String(row['S1AgentData'] ?? '').trim(),
          }))
          .filter((r) => r.ITAssets.length > 0 || r.S1AgentData.length > 0);

        resolve({ data, errors: [], missingColumns: [] });
      },
      error: (err) => {
        resolve({ data: [], errors: [String(err)], missingColumns: [] });
      },
    });
  });
}

// ============================================================
// Segment EDR rows by calendar month
// ============================================================
export function segmentByMonth(rows: EDRRow[]): MonthSummary[] {
  const map = new Map<string, EDRRow[]>();

  rows.forEach((row) => {
    const key = row.monthKey;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, monthRows]) => {
      const date = parseISO(`${key}-01`);
      return {
        key,
        label: isValid(date) ? format(date, 'MMMM yyyy') : key,
        rows: monthRows,
        count: monthRows.length,
      };
    });
}
