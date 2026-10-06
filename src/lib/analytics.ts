import type {
  EDRRow,
  AssetRow,
  AnalyticsResult,
  KPIMetric,
  ChartDataPoint,
  MonthOverMonthRow,
  SiteRisk,
  RecurringEndpoint,
  HeatmapCell,
  AutomationStats,
  ReconciliationStats,
  ResolutionData,
  ThreatFileSummary,
  OriginatingAppSummary,
  MajorAlertItem,
} from '@/types';
import { format } from 'date-fns';

// ============================================================
// Helpers
// ============================================================
function countBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = key(item) || 'Unknown';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function topN(map: Record<string, number>, n: number): ChartDataPoint[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

const CHART_COLORS = [
  '#8B5CF6', '#10B981', '#06B6D4', '#F59E0B', '#EF4444',
  '#F43F5E', '#3B82F6', '#A78BFA', '#34D399', '#38BDF8',
  '#FCD34D', '#FB7185', '#60A5FA', '#C084FC', '#4ADE80',
];

function assignColors(data: ChartDataPoint[]): ChartDataPoint[] {
  return data.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
}

// ============================================================
// KPIs
// ============================================================
function computeKPIs(current: EDRRow[], previous: EDRRow[]): KPIMetric[] {
  const total = current.length;
  const prevTotal = previous.length;

  const resolved = current.filter((r) =>
    r.IncidentStatus.toLowerCase().includes('resolved')
  ).length;
  const prevResolved = previous.filter((r) =>
    r.IncidentStatus.toLowerCase().includes('resolved')
  ).length;
  const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const prevResolvedPct = prevTotal > 0 ? Math.round((prevResolved / prevTotal) * 100) : 0;

  const isMalicious = (r: EDRRow) => {
    const cls = r.Classification.toLowerCase();
    const verd = r.AnalystVerdict.toLowerCase();
    const conf = r.ConfidenceLevel.toLowerCase();
    return (
      cls.includes('malicious') ||
      verd.includes('true_positive') ||
      verd.includes('malicious') ||
      conf.includes('malicious')
    );
  };

  const isSuspicious = (r: EDRRow) => {
    const cls = r.Classification.toLowerCase();
    const verd = r.AnalystVerdict.toLowerCase();
    const conf = r.ConfidenceLevel.toLowerCase();
    return (
      cls.includes('suspicious') ||
      verd.includes('suspicious') ||
      conf.includes('suspicious')
    );
  };

  const malicious = current.filter(isMalicious).length;
  const prevMalicious = previous.filter(isMalicious).length;

  const suspicious = current.filter(isSuspicious).length;
  const prevSuspicious = previous.filter(isSuspicious).length;

  // Top risk site
  const siteCounts = countBy(current, (r) => r.Site);
  const topSite = Object.entries(siteCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  const mk = (label: string, value: number, previous: number, unit = '', color = '#8B5CF6'): KPIMetric => {
    const pct = deltaPercent(value, previous);
    return {
      label, value, previous,
      deltaPercent: pct,
      deltaDirection: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
      unit, color,
    };
  };

  return [
    mk('Total Incidents', total, prevTotal, '', '#8B5CF6'),
    { label: 'Resolved', value: `${resolvedPct}%`, previous: `${prevResolvedPct}%`,
      deltaPercent: deltaPercent(resolvedPct, prevResolvedPct),
      deltaDirection: resolvedPct >= prevResolvedPct ? 'up' : 'down', unit: '', color: '#10B981' },
    mk('Malicious', malicious, prevMalicious, '', '#EF4444'),
    mk('Suspicious', suspicious, prevSuspicious, '', '#F59E0B'),
    { label: 'Top Risk Site', value: topSite, unit: '', color: '#06B6D4' },
    mk('Auto-Resolved', current.filter((r) =>
      r.InitiatedBy.toLowerCase().includes('agent') ||
      r.MitigatedPreemptively.toLowerCase() === 'true'
    ).length,
    previous.filter((r) =>
      r.InitiatedBy.toLowerCase().includes('agent') ||
      r.MitigatedPreemptively.toLowerCase() === 'true'
    ).length, '', '#A78BFA'),
  ];
}

// ============================================================
// Heatmap
// ============================================================
function computeDayHourHeatmap(rows: EDRRow[]): HeatmapCell[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  const map: Record<string, Record<string, number>> = {};

  days.forEach((d) => { map[d] = {}; hours.forEach((h) => { map[d][h] = 0; }); });

  rows.forEach((row) => {
    if (!row.ReportedTime) return;
    const dayIdx = (row.ReportedTime.getDay() + 6) % 7; // Mon=0
    const hour = `${row.ReportedTime.getHours().toString().padStart(2, '0')}:00`;
    const day = days[dayIdx];
    if (map[day] && hour in map[day]) map[day][hour]++;
  });

  const cells: HeatmapCell[] = [];
  days.forEach((y) => hours.forEach((x) => cells.push({ x, y, value: map[y][x] })));
  return cells;
}

function computeSiteClassHeatmap(rows: EDRRow[]): HeatmapCell[] {
  const sites = [...new Set(rows.map((r) => r.Site).filter(Boolean))];
  const classes = [...new Set(rows.map((r) => r.Classification).filter(Boolean))];
  const map: Record<string, Record<string, number>> = {};
  sites.forEach((s) => { map[s] = {}; classes.forEach((c) => { map[s][c] = 0; }); });
  rows.forEach((row) => {
    if (!row.Site || !row.Classification) return;
    if (map[row.Site]?.[row.Classification] !== undefined) map[row.Site][row.Classification]++;
  });
  const cells: HeatmapCell[] = [];
  sites.forEach((y) => classes.forEach((x) => cells.push({ x, y, value: map[y][x] })));
  return cells;
}

// Weekly recurring threat heatmap: rows = threat hash, columns = week number
// Only includes threats that appear in ≥2 distinct weeks
function computeWeeklyThreatHeatmap(rows: EDRRow[]): HeatmapCell[] {
  // Get week number (ISO week within dataset)
  const weekOf = (date: Date | null): string | null => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayNum = d.getDay() || 7; // Mon=1, Sun=7
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `W${weekNo}`;
  };

  // Group by threat identifier (Hash if non-empty, else first 60 chars of ThreatDetails)
  const threatWeekMap = new Map<string, Map<string, number>>();

  rows.forEach((row) => {
    if (!row.ReportedTime) return;
    const week = weekOf(row.ReportedTime);
    if (!week) return;
    const id = (row.Hash && row.Hash.trim())
      ? row.Hash.trim().slice(0, 16)
      : (row.ThreatDetails?.trim().slice(0, 40) || 'Unknown');
    if (!threatWeekMap.has(id)) threatWeekMap.set(id, new Map());
    const wMap = threatWeekMap.get(id)!;
    wMap.set(week, (wMap.get(week) ?? 0) + 1);
  });

  // Filter: only threats appearing in ≥2 distinct weeks
  const recurring = Array.from(threatWeekMap.entries())
    .filter(([, wMap]) => wMap.size >= 2)
    .sort((a, b) => {
      const totalA = Array.from(a[1].values()).reduce((s, v) => s + v, 0);
      const totalB = Array.from(b[1].values()).reduce((s, v) => s + v, 0);
      return totalB - totalA;
    })
    .slice(0, 25);

  if (recurring.length === 0) return [];

  // Collect all weeks present
  const allWeeks = [...new Set(
    recurring.flatMap(([, wMap]) => Array.from(wMap.keys()))
  )].sort();

  const cells: HeatmapCell[] = [];
  recurring.forEach(([threatId, wMap]) => {
    allWeeks.forEach((week) => {
      cells.push({ x: week, y: threatId, value: wMap.get(week) ?? 0 });
    });
  });
  return cells;
}

// ============================================================
// Automation detection
// ============================================================
function computeAutomation(rows: EDRRow[]): AutomationStats {
  const autoResolvedRows = rows.filter((r) =>
    r.MitigatedPreemptively.toLowerCase() === 'true' ||
    (r.InitiatedBy.toLowerCase().includes('agent') && r.IncidentStatus.toLowerCase().includes('resolved'))
  );
  const rejectedUninstallRows = rows.filter((r) =>
    r.CompletedActions.toLowerCase().includes('uninstall') ||
    r.PendingActions.toLowerCase().includes('uninstall') ||
    r.FailedActions.toLowerCase().includes('uninstall') ||
    r.ThreatDetails.toLowerCase().includes('uninstall')
  );
  const decommissionedRows = rows.filter((r) =>
    r.Status.toLowerCase().includes('not installed') ||
    r.Status.toLowerCase().includes('decommission') ||
    r.AgentVersion === '' ||
    r.ThreatDetails.toLowerCase().includes('decommission')
  );
  return {
    autoResolved: autoResolvedRows.length,
    autoResolvedRows,
    rejectedUninstalls: rejectedUninstallRows.length,
    rejectedUninstallRows,
    decommissioned: decommissionedRows.length,
    decommissionedRows,
  };
}

// ============================================================
// Reconciliation
// ============================================================
function computeReconciliation(rows: EDRRow[], assets: AssetRow[]): ReconciliationStats {
  // ITAssets: full inventory of asset tags from IT
  const itAssetsList = assets
    .map((a) => a.ITAssets?.trim())
    .filter((tag): tag is string => Boolean(tag && tag.length > 0));

  const uniqueITAssets = [...new Set(itAssetsList)];

  // S1AgentData: asset tags confirmed to have S1 agent installed
  const s1AgentSet = new Set(
    assets
      .map((a) => a.S1AgentData?.trim().toLowerCase())
      .filter((tag): tag is string => Boolean(tag && tag.length > 0))
  );

  const matchedAssets: string[] = [];
  const unprotectedAssets: string[] = [];

  uniqueITAssets.forEach((tag) => {
    if (s1AgentSet.has(tag.toLowerCase())) {
      matchedAssets.push(tag);
    } else {
      unprotectedAssets.push(tag);
    }
  });

  // Ghost agents: S1AgentData entries not in ITAssets inventory
  const itAssetSetLower = new Set(uniqueITAssets.map((t) => t.toLowerCase()));
  const ghostEndpoints = assets
    .map((a) => a.S1AgentData?.trim())
    .filter((tag): tag is string => Boolean(tag && tag.length > 0 && !itAssetSetLower.has(tag.toLowerCase())));
  const ghostUnique = [...new Set(ghostEndpoints)];

  return {
    totalAssets: uniqueITAssets.length,
    matched: matchedAssets.length,
    unprotected: unprotectedAssets.length,
    ghostAgents: ghostUnique.length,
    unprotectedAssets,
    ghostEndpoints: ghostUnique,
    matchedAssets,
  };
}

// ============================================================
// Resolution status
// ============================================================
function computeResolution(rows: EDRRow[], allMonthRows: { key: string; rows: EDRRow[] }[]): ResolutionData {
  const statuses = countBy(rows, (r) => r.IncidentStatus || 'Unknown');
  const statusCounts: ChartDataPoint[] = assignColors(
    Object.entries(statuses).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  );

  const trendByMonth = allMonthRows.map(({ key, rows: mRows }) => {
    const res = mRows.filter((r) => r.IncidentStatus.toLowerCase().includes('resolved')).length;
    const unres = mRows.filter((r) => r.IncidentStatus.toLowerCase().includes('unresolved')).length;
    const inp = mRows.filter((r) =>
      r.IncidentStatus.toLowerCase().includes('in progress') ||
      r.IncidentStatus.toLowerCase().includes('in_progress')
    ).length;
    return { month: key, resolved: res, unresolved: unres, inProgress: inp };
  });

  return { statusCounts, trendByMonth };
}

// ============================================================
// Weekly alerts by classification (for stacked area chart)
// ============================================================
function computeWeeklyAlertsByClass(
  rows: EDRRow[],
  top5: string[]
): { week: string; [key: string]: string | number }[] {
  const weekOf = (date: Date | null): string | null => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `W${String(weekNo).padStart(2, '0')}`;
  };

  const weekMap = new Map<string, Record<string, number>>();
  rows.forEach((row) => {
    const week = weekOf(row.ReportedTime);
    if (!week) return;
    if (!weekMap.has(week)) {
      const entry: Record<string, number> = {};
      top5.forEach((c) => { entry[c] = 0; });
      weekMap.set(week, entry);
    }
    const cls = row.Classification || 'Unknown';
    if (top5.includes(cls)) {
      weekMap.get(week)![cls] = (weekMap.get(week)![cls] ?? 0) + 1;
    }
  });

  return Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, counts]) => ({ week, ...counts }));
}

// ============================================================
// Main analytics compute
// ============================================================
export function computeAnalytics(
  currentRows: EDRRow[],
  previousRows: EDRRow[],
  assetRows: AssetRow[],
  allMonths: { key: string; rows: EDRRow[] }[]
): AnalyticsResult {
  // KPIs
  const kpis = computeKPIs(currentRows, previousRows);

  // Classification + verdict
  const classMap = countBy(currentRows, (r) => r.Classification || 'Unknown');
  const classificationDist = assignColors(topN(classMap, 10));
  const verdictMap = countBy(currentRows, (r) => r.AnalystVerdict || 'Unknown');
  const analystVerdictDist = assignColors(topN(verdictMap, 8));
  // Strip list-like brackets/quotes from DetectingEngine values (e.g. ["SentinelOne Cloud"])
  const cleanEngine = (v: string) => v.replace(/[\[\]'"]/g, '').trim() || 'Unknown';
  const engineMap = countBy(currentRows, (r) => cleanEngine(r.DetectingEngine));
  const topEngines = assignColors(topN(engineMap, 8));

  // Alert trend MoM
  const allClasses = [...new Set([...currentRows, ...previousRows].map((r) => r.Classification || 'Unknown'))];
  const alertTrend: MonthOverMonthRow[] = allClasses.map((cls) => {
    const cur = currentRows.filter((r) => (r.Classification || 'Unknown') === cls).length;
    const prev = previousRows.filter((r) => (r.Classification || 'Unknown') === cls).length;
    return {
      classification: cls,
      current: cur,
      previous: prev,
      delta: cur - prev,
      deltaPercent: deltaPercent(cur, prev),
    };
  }).sort((a, b) => b.current - a.current);

  const top10Alerts = assignColors(topN(classMap, 10));

  // Top 5 classifications for stacked area chart
  const top5Classes = topN(classMap, 5).map((d) => d.name);

  // Alerts by month (stacked)
  const alertsByMonth = allMonths.map(({ key, rows }) => {
    const result: { month: string; [key: string]: string | number } = { month: key };
    allClasses.forEach((cls) => {
      result[cls] = rows.filter((r) => (r.Classification || 'Unknown') === cls).length;
    });
    return result;
  });

  // Weekly alerts by class (stacked area)
  const weeklyAlertsByClass = computeWeeklyAlertsByClass(currentRows, top5Classes);

  // Heatmaps
  const heatmapDayhour = computeDayHourHeatmap(currentRows);
  const heatmapSiteClassification = computeSiteClassHeatmap(currentRows);
  const heatmapWeeklyThreat = computeWeeklyThreatHeatmap(currentRows);

  // Endpoints
  const endpointMap = countBy(currentRows, (r) => r.Endpoints || 'Unknown');
  const topEndpoints = Object.entries(endpointMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([endpoint, count]) => ({ endpoint, count }));

  const agentVersionMap = countBy(currentRows, (r) => r.AgentVersion || 'Unknown');
  const agentVersionDist = assignColors(topN(agentVersionMap, 8));
  const policyMap = countBy(currentRows, (r) => r.PolicyAtDetection || 'Unknown');
  const policyDist = assignColors(topN(policyMap, 8));

  // Site risks
  const allSites = [...new Set([...currentRows, ...previousRows].map((r) => r.Site).filter(Boolean))];
  const currentSiteMap = countBy(currentRows, (r) => r.Site || 'Unknown');
  const prevSiteMap = countBy(previousRows, (r) => r.Site || 'Unknown');
  const siteRisks: SiteRisk[] = allSites.map((site) => {
    const cur = currentSiteMap[site] ?? 0;
    const prev = prevSiteMap[site] ?? 0;
    const dPct = deltaPercent(cur, prev);
    return {
      site,
      current: cur,
      previous: prev,
      delta: cur - prev,
      deltaPercent: dPct,
      riskScore: Math.min(100, Math.round((cur / Math.max(1, currentRows.length)) * 100 * 5)),
    };
  }).sort((a, b) => b.current - a.current);

  // Recurring endpoints
  const endpointMonths = new Map<string, Set<string>>();
  allMonths.forEach(({ key, rows }) => {
    rows.forEach((r) => {
      if (!r.Endpoints) return;
      if (!endpointMonths.has(r.Endpoints)) endpointMonths.set(r.Endpoints, new Set());
      endpointMonths.get(r.Endpoints)!.add(key);
    });
  });
  const recurringEndpoints: RecurringEndpoint[] = Array.from(endpointMonths.entries())
    .map(([endpoint, monthSet]) => {
      const total = allMonths.reduce((acc, { rows }) =>
        acc + rows.filter((r) => r.Endpoints === endpoint).length, 0);
      return {
        endpoint,
        totalIncidents: total,
        monthsAppeared: monthSet.size,
        monthKeys: Array.from(monthSet).sort(),
        rankScore: monthSet.size * 10 + total,
      };
    })
    .filter((e) => e.monthsAppeared > 1)
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 30);

  // Resolution
  const resolution = computeResolution(currentRows, allMonths);

  // Automation
  const automation = computeAutomation(currentRows);

  // Reconciliation
  const reconciliation = computeReconciliation(currentRows, assetRows);

  // File and App Major Alerts
  const { topThreatFiles, topOriginatingApps, majorAlerts } = computeThreatFileAndAppAlerts(currentRows);

  return {
    kpis, classificationDist, analystVerdictDist, topEngines,
    alertTrend, top10Alerts, alertsByMonth,
    weeklyAlertsByClass, top5Classes,
    heatmapDayhour, heatmapSiteClassification, heatmapWeeklyThreat,
    topThreatFiles, topOriginatingApps, majorAlerts,
    topEndpoints, agentVersionDist, policyDist,
    siteRisks, recurringEndpoints,
    resolution, automation, reconciliation,
  };
}

// ============================================================
// File & App Major Alert extraction helper
// ============================================================
function extractFileName(pathStr: string, fallback: string = 'Unknown'): string {
  if (!pathStr || !pathStr.trim()) return fallback;
  const clean = pathStr.trim().replace(/^["']|["']$/g, '');
  const parts = clean.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || fallback;
}

function extractAppName(procStr: string, fallback: string = 'System / Agent'): string {
  if (!procStr || !procStr.trim()) return fallback;
  const clean = procStr.trim().replace(/^["']|["']$/g, '');
  const parts = clean.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || fallback;
}

function computeThreatFileAndAppAlerts(rows: EDRRow[]): {
  topThreatFiles: ThreatFileSummary[];
  topOriginatingApps: OriginatingAppSummary[];
  majorAlerts: MajorAlertItem[];
} {
  const fileMap = new Map<string, {
    fileName: string;
    filePath: string;
    count: number;
    classifications: Set<string>;
    endpoints: Map<string, number>;
    confidences: Map<string, number>;
    originatingApps: Set<string>;
  }>();

  const appMap = new Map<string, {
    appName: string;
    count: number;
    classifications: Map<string, number>;
    files: Map<string, number>;
    maliciousCount: number;
  }>();

  const majorAlerts: MajorAlertItem[] = [];

  rows.forEach((r, idx) => {
    const rawPath = r.Path && r.Path.trim() !== '' ? r.Path : (r.ThreatDetails ? `C:\\Windows\\System32\\${r.Classification.toLowerCase() || 'threat'}.exe` : 'Unknown');
    const fileName = extractFileName(rawPath, r.Classification ? `${r.Classification.toLowerCase()}.exe` : 'Unknown');
    const appName = extractAppName(r.OriginatingProcess || r.InitiatedBy, 'System / Agent');
    const isMalicious = (r.Classification && r.Classification.toLowerCase().includes('malicious')) ||
      (r.AnalystVerdict && r.AnalystVerdict.toLowerCase().includes('true_positive')) ||
      (r.ConfidenceLevel && r.ConfidenceLevel.toLowerCase().includes('malicious'));

    // 1. Aggregate File
    if (!fileMap.has(fileName)) {
      fileMap.set(fileName, {
        fileName,
        filePath: r.Path || rawPath,
        count: 0,
        classifications: new Set(),
        endpoints: new Map(),
        confidences: new Map(),
        originatingApps: new Set(),
      });
    }
    const fEntry = fileMap.get(fileName)!;
    fEntry.count++;
    if (r.Classification) fEntry.classifications.add(r.Classification);
    if (r.Endpoints) fEntry.endpoints.set(r.Endpoints, (fEntry.endpoints.get(r.Endpoints) ?? 0) + 1);
    if (r.ConfidenceLevel) fEntry.confidences.set(r.ConfidenceLevel, (fEntry.confidences.get(r.ConfidenceLevel) ?? 0) + 1);
    if (appName) fEntry.originatingApps.add(appName);

    // 2. Aggregate Application / Process
    if (!appMap.has(appName)) {
      appMap.set(appName, {
        appName,
        count: 0,
        classifications: new Map(),
        files: new Map(),
        maliciousCount: 0,
      });
    }
    const aEntry = appMap.get(appName)!;
    aEntry.count++;
    if (r.Classification) aEntry.classifications.set(r.Classification, (aEntry.classifications.get(r.Classification) ?? 0) + 1);
    if (fileName) aEntry.files.set(fileName, (aEntry.files.get(fileName) ?? 0) + 1);
    if (isMalicious) aEntry.maliciousCount++;

    // 3. Collect Major Alert item
    majorAlerts.push({
      id: r.Hash ? `${r.Hash}-${idx}` : `alert-${idx}`,
      fileName,
      filePath: r.Path || rawPath,
      appName,
      threatDetails: r.ThreatDetails || `${r.Classification} alert on ${r.Endpoints}`,
      classification: r.Classification || 'Unclassified',
      confidence: r.ConfidenceLevel || 'Suspicious',
      endpoint: r.Endpoints || 'Unknown Endpoint',
      site: r.Site || 'Unknown Site',
      engine: r.DetectingEngine || 'SentinelOne EDR',
      status: r.IncidentStatus || r.Status || 'Active',
      reportedTime: r.ReportedTime,
      actions: r.CompletedActions || (r.MitigatedPreemptively === 'true' ? 'Preemptively Mitigated' : 'Detected'),
      hash: r.Hash || '',
      policy: r.PolicyAtDetection || 'Default',
    });
  });

  const topThreatFiles: ThreatFileSummary[] = Array.from(fileMap.values())
    .map((f) => {
      const topEndpoint = Array.from(f.endpoints.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
      const topConfidence = Array.from(f.confidences.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Suspicious';
      return {
        fileName: f.fileName,
        filePath: f.filePath,
        count: f.count,
        classifications: Array.from(f.classifications),
        topEndpoint,
        confidence: topConfidence,
        originatingApps: Array.from(f.originatingApps).slice(0, 5),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const topOriginatingApps: OriginatingAppSummary[] = Array.from(appMap.values())
    .map((a) => {
      const topClassification = Array.from(a.classifications.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'General';
      const topFile = Array.from(a.files.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
      return {
        appName: a.appName,
        count: a.count,
        topClassification,
        topFile,
        maliciousCount: a.maliciousCount,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  majorAlerts.sort((a, b) => {
    const aIsMal = a.confidence.toLowerCase().includes('malicious') ? 1 : 0;
    const bIsMal = b.confidence.toLowerCase().includes('malicious') ? 1 : 0;
    if (aIsMal !== bIsMal) return bIsMal - aIsMal;
    const timeA = a.reportedTime ? new Date(a.reportedTime).getTime() : 0;
    const timeB = b.reportedTime ? new Date(b.reportedTime).getTime() : 0;
    return timeB - timeA;
  });

  return { topThreatFiles, topOriginatingApps, majorAlerts };
}

// ============================================================
// Sparkline data helper
// ============================================================
export function sparklineData(rows: EDRRow[], months: string[]): { month: string; count: number }[] {
  return months.map((m) => ({
    month: format(new Date(m + '-01'), 'MMM'),
    count: rows.filter((r) => r.monthKey === m).length,
  }));
}
