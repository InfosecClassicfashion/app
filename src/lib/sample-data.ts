import { format, subMonths, addDays, setHours } from 'date-fns';

// ============================================================
// Realistic sample data generator
// ============================================================

const SITES = ['Dubai', 'London', 'Singapore', 'Mumbai', 'New York', 'Sydney'];
const CLASSIFICATIONS = [
  'Trojan', 'Ransomware', 'Adware', 'PUA', 'Backdoor',
  'Spyware', 'Cryptominer', 'Exploit', 'Worm', 'Keylogger',
];
const CONFIDENCE_LEVELS = ['Malicious', 'Suspicious', 'Benign'];
const DETECTING_ENGINES = [
  'SentinelOne Static AI', 'SentinelOne Behavioral AI', 'Cloud Intelligence',
  'Reputation', 'Deep Visibility', 'File Reputation',
];
const ANALYST_VERDICTS = [
  'true_positive', 'false_positive', 'suspicious', 'undefined',
];
const INCIDENT_STATUSES = ['resolved', 'unresolved', 'in_progress'];
const INITIATED_BY = ['SentinelOne Agent', 'Cloud Intelligence', 'User', 'Policy'];
const POLICIES = ['Detect', 'Protect', 'Monitor', 'N/A'];
const ENDPOINTS_PER_SITE: Record<string, string[]> = {
  Dubai: Array.from({ length: 12 }, (_, i) => `DXB-WS${String(i + 1).padStart(3, '0')}`),
  London: Array.from({ length: 10 }, (_, i) => `LDN-WS${String(i + 1).padStart(3, '0')}`),
  Singapore: Array.from({ length: 10 }, (_, i) => `SGP-WS${String(i + 1).padStart(3, '0')}`),
  Mumbai: Array.from({ length: 8 }, (_, i) => `BOM-WS${String(i + 1).padStart(3, '0')}`),
  'New York': Array.from({ length: 10 }, (_, i) => `NYC-WS${String(i + 1).padStart(3, '0')}`),
  Sydney: Array.from({ length: 8 }, (_, i) => `SYD-WS${String(i + 1).padStart(3, '0')}`),
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateRows(baseDate: Date, count: number): string[] {
  const rows: string[] = [];
  const site = pick(SITES);
  const endpoints = ENDPOINTS_PER_SITE[site] ?? ENDPOINTS_PER_SITE['Dubai'];

  for (let i = 0; i < count; i++) {
    const dayOffset = rand(0, 27);
    const reported = setHours(addDays(baseDate, dayOffset), rand(0, 23));
    const identified = setHours(addDays(baseDate, dayOffset), rand(0, 23));
    const endpoint = pick(endpoints);
    const classification = pick(CLASSIFICATIONS);
    const confidence = pick(CONFIDENCE_LEVELS);
    const engine = pick(DETECTING_ENGINES);
    const verdict = pick(ANALYST_VERDICTS);
    const status = pick(INCIDENT_STATUSES);
    const initiatedBy = pick(INITIATED_BY);
    const policy = pick(POLICIES);
    const preemptive = Math.random() > 0.7 ? 'true' : 'false';
    const agentVer = `23.${rand(1, 4)}.${rand(0, 9)}.${rand(1000, 9999)}`;
    const site2 = pick(SITES);

    const row = [
      status,                              // Status
      `${classification} detected on ${endpoint}`, // Threat Details
      confidence,                          // Confidence Level
      endpoint,                            // Endpoints
      status,                              // Incident Status
      verdict,                             // Analyst Verdict
      format(reported, "yyyy-MM-dd'T'HH:mm:ss'Z'"), // Reported Time (UTC)
      format(identified, "yyyy-MM-dd'T'HH:mm:ss'Z'"), // Identifying Time (UTC)
      engine,                              // Detecting Engine
      initiatedBy,                         // Initiated By
      classification,                      // Classification
      agentVer,                            // Agent Version On Detection
      agentVer,                            // Agent Version
      `${Math.random().toString(16).slice(2, 18).toUpperCase()}`, // Hash
      `C:\\Windows\\System32\\${classification.toLowerCase()}.exe`, // Path
      Math.random() > 0.5 ? 'Kill,Quarantine' : 'Kill', // Completed Actions
      Math.random() > 0.8 ? 'Remediate' : '', // Pending Actions
      Math.random() > 0.9 ? 'true' : 'false', // Reboot Required
      '',                                  // Failed Actions
      policy,                              // Policy At Detection
      preemptive,                          // Mitigated Preemptively
      Math.random() > 0.7 ? `TKT-${rand(1000, 9999)}` : '', // External Ticket Id
      'Acme Corp',                         // Account
      site2,                               // Site
      `${site2}-${pick(['Finance', 'IT', 'HR', 'Ops', 'Dev'])}`, // Group
      `svchost.exe`,                       // Originating Process
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');

    rows.push(row);
  }
  return rows;
}

export function generateSampleEDRCsv(): string {
  const header = [
    'Status', 'Threat Details', 'Confidence Level', 'Endpoints',
    'Incident Status', 'Analyst Verdict', 'Reported Time (UTC)',
    'Identifying Time (UTC)', 'Detecting Engine', 'Initiated By',
    'Classification', 'Agent Version On Detection', 'Agent Version',
    'Hash', 'Path', 'Completed Actions', 'Pending Actions',
    'Reboot Required', 'Failed Actions', 'Policy At Detection',
    'Mitigated Preemptively', 'External Ticket Id', 'Account',
    'Site', 'Group', 'Originating Process',
  ].map((h) => `"${h}"`).join(',');

  const today = new Date();
  const m1Base = subMonths(today, 2);
  const m2Base = subMonths(today, 1);
  const m3Base = today;

  // Vary counts per month to make MoM changes interesting
  const m1Rows = generateRows(new Date(m1Base.getFullYear(), m1Base.getMonth(), 1), rand(55, 75));
  const m2Rows = generateRows(new Date(m2Base.getFullYear(), m2Base.getMonth(), 1), rand(80, 100));
  const m3Rows = generateRows(new Date(m3Base.getFullYear(), m3Base.getMonth(), 1), rand(60, 85));

  return [header, ...m1Rows, ...m2Rows, ...m3Rows].join('\n');
}

export function generateSampleAssetCsv(): string {
  const allEndpoints = Object.values(ENDPOINTS_PER_SITE).flat();
  const extra = ['UNKNOWN-WS001', 'BYOD-LPT001', 'CONTRACTOR-001', 'PRINTER-HQ'];
  const allITAssets = [...allEndpoints, ...extra];

  const header = '"ITAssets","S1AgentData"';
  const rows = allITAssets.map((ep, i) => {
    // 85% covered, 15% missing agent
    const covered = i % 7 !== 0;
    return `"${ep}","${covered ? ep : ''}"`;
  });
  return [header, ...rows].join('\n');
}
