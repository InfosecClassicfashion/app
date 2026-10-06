// ============================================================
// EDR Row — all 26 columns from SentinelOne export
// ============================================================
export interface EDRRow {
  Status: string;
  ThreatDetails: string;
  ConfidenceLevel: string;
  Endpoints: string;
  IncidentStatus: string;
  AnalystVerdict: string;
  ReportedTime: Date | null;
  IdentifyingTime: Date | null;
  DetectingEngine: string;
  InitiatedBy: string;
  Classification: string;
  AgentVersionOnDetection: string;
  AgentVersion: string;
  Hash: string;
  Path: string;
  CompletedActions: string;
  PendingActions: string;
  RebootRequired: string;
  FailedActions: string;
  PolicyAtDetection: string;
  MitigatedPreemptively: string;
  ExternalTicketId: string;
  Account: string;
  Site: string;
  Group: string;
  OriginatingProcess: string;
  // raw month key e.g. "2025-03"
  monthKey: string;
}

// ============================================================
// Asset Row (ITAssets inventory + S1AgentData agent coverage)
// ============================================================
export interface AssetRow {
  ITAssets: string;
  S1AgentData: string;
}

// ============================================================
// Parsed + segmented store
// ============================================================
export interface MonthSummary {
  key: string;          // "2025-03"
  label: string;        // "March 2025"
  rows: EDRRow[];
  count: number;
}

export interface DashboardData {
  edrRows: EDRRow[];
  assetRows: AssetRow[];
  months: MonthSummary[];
  reportingMonth: string;   // selected reporting month key
  comparisonMonth: string | null;
}

// ============================================================
// Analytics types
// ============================================================
export interface KPIMetric {
  label: string;
  value: number | string;
  previous?: number | string;
  deltaPercent?: number;
  deltaDirection?: 'up' | 'down' | 'neutral';
  unit?: string;
  color?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
  [key: string]: string | number | undefined;
}

export interface MonthOverMonthRow {
  classification: string;
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
}

export interface SiteRisk {
  site: string;
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
  riskScore: number;
}

export interface RecurringEndpoint {
  endpoint: string;
  totalIncidents: number;
  monthsAppeared: number;
  monthKeys: string[];
  rankScore: number;
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

export interface AutomationStats {
  autoResolved: number;
  autoResolvedRows: EDRRow[];
  rejectedUninstalls: number;
  rejectedUninstallRows: EDRRow[];
  decommissioned: number;
  decommissionedRows: EDRRow[];
}

export interface ReconciliationStats {
  totalAssets: number;
  matched: number;
  unprotected: number;
  ghostAgents: number;
  unprotectedAssets: string[];
  ghostEndpoints: string[];
  matchedAssets: string[];
}

export interface ResolutionData {
  statusCounts: ChartDataPoint[];
  trendByMonth: { month: string; resolved: number; unresolved: number; inProgress: number }[];
}

export interface ThreatFileSummary {
  fileName: string;
  filePath: string;
  count: number;
  classifications: string[];
  topEndpoint: string;
  confidence: string;
  originatingApps: string[];
}

export interface OriginatingAppSummary {
  appName: string;
  count: number;
  topClassification: string;
  topFile: string;
  maliciousCount: number;
}

export interface MajorAlertItem {
  id: string;
  fileName: string;
  filePath: string;
  appName: string;
  threatDetails: string;
  classification: string;
  confidence: string;
  endpoint: string;
  site: string;
  engine: string;
  status: string;
  reportedTime: Date | null;
  actions: string;
  hash: string;
  policy: string;
}

export interface AnalyticsResult {
  // Executive summary
  kpis: KPIMetric[];
  classificationDist: ChartDataPoint[];
  analystVerdictDist: ChartDataPoint[];
  topEngines: ChartDataPoint[];

  // Alerts
  alertTrend: MonthOverMonthRow[];
  top10Alerts: ChartDataPoint[];
  alertsByMonth: { month: string; [key: string]: string | number }[];
  weeklyAlertsByClass: { week: string; [key: string]: string | number }[];
  top5Classes: string[];

  // Threats
  heatmapDayhour: HeatmapCell[];
  heatmapSiteClassification: HeatmapCell[];
  heatmapWeeklyThreat: HeatmapCell[];
  topThreatFiles: ThreatFileSummary[];
  topOriginatingApps: OriginatingAppSummary[];
  majorAlerts: MajorAlertItem[];

  // Endpoints
  topEndpoints: { endpoint: string; count: number }[];
  agentVersionDist: ChartDataPoint[];
  policyDist: ChartDataPoint[];

  // Regional
  siteRisks: SiteRisk[];

  // Persistent
  recurringEndpoints: RecurringEndpoint[];

  // Resolution
  resolution: ResolutionData;

  // Automation
  automation: AutomationStats;

  // Reconciliation
  reconciliation: ReconciliationStats;
}
