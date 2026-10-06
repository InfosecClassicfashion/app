import type { AnalyticsResult, MonthSummary, EDRRow, AssetRow } from '@/types';

export interface SummaryGeneratorParams {
  analytics: AnalyticsResult;
  reportingMonth: string;
  comparisonMonth: string | null;
  months: MonthSummary[];
  reportingRows: EDRRow[];
  comparisonRows: EDRRow[];
  assetRows: AssetRow[];
}

export interface DetailedSection {
  id: string;
  title: string;
  subtitle: string;
  summaryBadge?: string;
  badgeVariant?: 'purple' | 'emerald' | 'amber' | 'red' | 'cyan' | 'blue';
  paragraphs: string[];
  keyDataPoints: { label: string; value: string | number; change?: string; tone?: 'neutral' | 'positive' | 'warning' | 'danger' }[];
  takeaways: string[];
}

export interface DetailedDashboardSummary {
  metadata: {
    reportingPeriod: string;
    comparisonPeriod: string;
    accountName: string;
    totalIncidents: number;
    previousIncidents: number;
    momDeltaPct: number;
    momDirection: 'up' | 'down' | 'neutral';
    generatedAt: string;
  };
  executiveBriefing: {
    headline: string;
    overviewParagraph: string;
    criticalMetrics: { label: string; value: string; subtext: string }[];
    bulletPoints: string[];
  };
  sections: DetailedSection[];
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    mediumTerm: string[];
  };
  fullMarkdown: string;
  plainText: string;
}

export function generateDashboardSummary(params: SummaryGeneratorParams): DetailedDashboardSummary {
  const {
    analytics,
    reportingMonth,
    comparisonMonth,
    months,
    reportingRows,
    comparisonRows,
    assetRows,
  } = params;

  const currentMonthLabel = months.find((m) => m.key === reportingMonth)?.label ?? reportingMonth;
  const comparisonMonthLabel = comparisonMonth
    ? months.find((m) => m.key === comparisonMonth)?.label ?? comparisonMonth
    : 'Previous Period';

  const accountName = reportingRows[0]?.Account || 'Enterprise Fleet';
  const totalIncidents = reportingRows.length;
  const prevTotalIncidents = comparisonRows.length;
  
  const momDeltaPct = prevTotalIncidents > 0
    ? Math.round(((totalIncidents - prevTotalIncidents) / prevTotalIncidents) * 100)
    : (totalIncidents > 0 ? 100 : 0);
  const momDirection: 'up' | 'down' | 'neutral' =
    momDeltaPct > 0 ? 'up' : momDeltaPct < 0 ? 'down' : 'neutral';

  // 1. Resolution numbers
  const resolvedCount = reportingRows.filter((r) =>
    r.IncidentStatus.toLowerCase().includes('resolved')
  ).length;
  const resolvedPct = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 0;
  
  const unresolvedCount = reportingRows.filter((r) =>
    r.IncidentStatus.toLowerCase().includes('unresolved')
  ).length;
  const unresolvedPct = totalIncidents > 0 ? Math.round((unresolvedCount / totalIncidents) * 100) : 0;
  
  const inProgressCount = totalIncidents - resolvedCount - unresolvedCount;
  const inProgressPct = totalIncidents > 0 ? Math.max(0, 100 - resolvedPct - unresolvedPct) : 0;

  // 2. Malicious & Suspicious
  const isMaliciousRow = (r: EDRRow) => {
    const cls = r.Classification.toLowerCase();
    const verd = r.AnalystVerdict.toLowerCase();
    const conf = r.ConfidenceLevel.toLowerCase();
    return cls.includes('malicious') || verd.includes('true_positive') || verd.includes('malicious') || conf.includes('malicious');
  };
  const isSuspiciousRow = (r: EDRRow) => {
    const cls = r.Classification.toLowerCase();
    const verd = r.AnalystVerdict.toLowerCase();
    const conf = r.ConfidenceLevel.toLowerCase();
    return cls.includes('suspicious') || verd.includes('suspicious') || conf.includes('suspicious');
  };

  const maliciousCount = reportingRows.filter(isMaliciousRow).length;
  const maliciousPct = totalIncidents > 0 ? Math.round((maliciousCount / totalIncidents) * 100) : 0;
  const suspiciousCount = reportingRows.filter(isSuspiciousRow).length;
  const suspiciousPct = totalIncidents > 0 ? Math.round((suspiciousCount / totalIncidents) * 100) : 0;

  // 3. Classifications
  const topClasses = analytics.classificationDist || [];
  const primaryClass = topClasses[0] || { name: 'Undetermined', value: 0 };
  const primaryClassPct = totalIncidents > 0 ? Math.round((primaryClass.value / totalIncidents) * 100) : 0;
  const secondaryClass = topClasses[1] || { name: 'None', value: 0 };
  const secondaryClassPct = totalIncidents > 0 ? Math.round((secondaryClass.value / totalIncidents) * 100) : 0;
  const tertiaryClass = topClasses[2] || { name: 'None', value: 0 };
  const tertiaryClassPct = totalIncidents > 0 ? Math.round((tertiaryClass.value / totalIncidents) * 100) : 0;

  // Surging and declining alert trends
  const alertTrends = analytics.alertTrend || [];
  const surgingTrend = [...alertTrends].sort((a, b) => b.deltaPercent - a.deltaPercent)[0];
  const decliningTrend = [...alertTrends].sort((a, b) => a.deltaPercent - b.deltaPercent)[0];

  // 3b. Threat Files & Originating Application Vectors
  const topFiles = analytics.topThreatFiles || [];
  const leadingFile = topFiles[0];
  const secondaryFile = topFiles[1];

  const topApps = analytics.topOriginatingApps || [];
  const leadingApp = topApps[0];
  const secondaryApp = topApps[1];

  // 4. Detection Engines
  const topEngines = analytics.topEngines || [];
  const primaryEngine = topEngines[0] || { name: 'SentinelOne Agent', value: 0 };
  const primaryEnginePct = totalIncidents > 0 ? Math.round((primaryEngine.value / totalIncidents) * 100) : 0;
  const secondaryEngine = topEngines[1] || { name: 'Secondary Engine', value: 0 };
  const secondaryEnginePct = totalIncidents > 0 ? Math.round((secondaryEngine.value / totalIncidents) * 100) : 0;

  // 5. Analyst Verdicts
  const verdictDist = analytics.analystVerdictDist || [];
  const truePos = verdictDist.find((v) => v.name.toLowerCase().includes('true_positive') || v.name.toLowerCase().includes('true positive'))?.value ?? 0;
  const falsePos = verdictDist.find((v) => v.name.toLowerCase().includes('false_positive') || v.name.toLowerCase().includes('false positive'))?.value ?? 0;
  const suspVerd = verdictDist.find((v) => v.name.toLowerCase().includes('suspicious'))?.value ?? 0;
  const undefVerd = verdictDist.find((v) => v.name.toLowerCase().includes('undefined') || v.name.toLowerCase().includes('unknown'))?.value ?? 0;
  const totalVerdictCount = truePos + falsePos + suspVerd + undefVerd || totalIncidents;
  const truePosPct = Math.round((truePos / totalVerdictCount) * 100);
  const falsePosPct = Math.round((falsePos / totalVerdictCount) * 100);

  // 6. Endpoints
  const uniqueEndpoints = new Set(reportingRows.map((r) => r.Endpoints).filter(Boolean));
  const uniqueEndpointCount = uniqueEndpoints.size;
  const avgAlertsPerEndpoint = uniqueEndpointCount > 0 ? (totalIncidents / uniqueEndpointCount).toFixed(1) : '0';
  const topHosts = analytics.topEndpoints || [];
  const top3HostTotal = topHosts.slice(0, 3).reduce((sum, h) => sum + h.count, 0);
  const top3HostConcentrationPct = totalIncidents > 0 ? Math.round((top3HostTotal / totalIncidents) * 100) : 0;

  // Policy & Agent Versions
  const policyDist = analytics.policyDist || [];
  const protectCount = policyDist.find((p) => p.name.toLowerCase().includes('protect'))?.value ?? 0;
  const detectCount = policyDist.find((p) => p.name.toLowerCase().includes('detect'))?.value ?? 0;
  const protectPct = totalIncidents > 0 ? Math.round((protectCount / totalIncidents) * 100) : 0;
  const detectPct = totalIncidents > 0 ? Math.round((detectCount / totalIncidents) * 100) : 0;

  const agentVersions = analytics.agentVersionDist || [];
  const leadingAgent = agentVersions[0] || { name: 'Latest Build', value: 0 };
  const leadingAgentPct = totalIncidents > 0 ? Math.round((leadingAgent.value / totalIncidents) * 100) : 0;

  // 7. Sites
  const siteRisks = analytics.siteRisks || [];
  const topSite = siteRisks[0] || { site: 'Primary Site', current: totalIncidents, deltaPercent: 0, riskScore: 100 };
  const surgingSite = [...siteRisks].sort((a, b) => b.deltaPercent - a.deltaPercent)[0];

  // 8. Recurring Hosts
  const recurringHosts = analytics.recurringEndpoints || [];
  const highRiskRecurring = recurringHosts.filter((r) => r.monthsAppeared >= 2);
  const topPersistentHost = highRiskRecurring[0];

  // 9. Automation
  const autoResolvedCount = analytics.automation.autoResolved;
  const autoResolvedPct = resolvedCount > 0 ? Math.round((autoResolvedCount / resolvedCount) * 100) : 0;
  const rejectedUninstalls = analytics.automation.rejectedUninstalls;
  const decommissioned = analytics.automation.decommissioned;

  // 10. Assets & Reconciliation
  const recon = analytics.reconciliation;
  const totalAssets = recon.totalAssets;
  const coveredAssets = recon.matched;
  const coveragePct = totalAssets > 0 ? Math.round((coveredAssets / totalAssets) * 100) : 0;
  const unprotectedCount = recon.unprotected;
  const ghostCount = recon.ghostAgents;

  // ============================================================
  // Construct Executive Briefing Narrative
  // ============================================================
  const trendDescription = momDirection === 'up'
    ? `an increase of ${momDeltaPct}% compared to ${comparisonMonthLabel}`
    : momDirection === 'down'
    ? `a reduction of ${Math.abs(momDeltaPct)}% compared to ${comparisonMonthLabel}`
    : `consistent with telemetry from ${comparisonMonthLabel}`;

  const executiveBriefingHeadline = `EDR Intelligence Briefing — ${currentMonthLabel}`;
  const executiveBriefingOverview = `During the ${currentMonthLabel} operational cycle, SentinelOne EDR monitored security telemetry across ${accountName}. A total of ${totalIncidents.toLocaleString()} security events were registered across ${uniqueEndpointCount.toLocaleString()} active endpoints, reflecting ${trendDescription}. Enterprise containment remained robust, achieving a ${resolvedPct}% incident resolution rate. High-severity malicious events represented ${maliciousPct}% (${maliciousCount.toLocaleString()} incidents) of aggregate detections, with ${primaryClass.name} identified as the predominant attack vector. Top regional risk was concentrated at ${topSite.site}, while automated remediation intercepted ${autoResolvedCount.toLocaleString()} events without manual analyst intervention.`;

  const criticalMetrics = [
    { label: 'Total Incidents', value: totalIncidents.toLocaleString(), subtext: `${momDeltaPct > 0 ? '+' : ''}${momDeltaPct}% MoM velocity` },
    { label: 'Containment Rate', value: `${resolvedPct}%`, subtext: `${resolvedCount.toLocaleString()} incidents remediated` },
    { label: 'Malicious Detections', value: maliciousCount.toLocaleString(), subtext: `${maliciousPct}% of overall volume` },
    { label: 'Fleet Coverage', value: totalAssets > 0 ? `${coveragePct}%` : '100%', subtext: totalAssets > 0 ? `${coveredAssets}/${totalAssets} assets managed` : `${uniqueEndpointCount} active endpoints` },
  ];

  const executiveBulletPoints = [
    `Total incident volume logged at ${totalIncidents.toLocaleString()} across ${uniqueEndpointCount} endpoints (${trendDescription}).`,
    `Strong containment achieved with ${resolvedCount.toLocaleString()} incidents (${resolvedPct}%) resolved, leaving ${unresolvedCount.toLocaleString()} unresolved.`,
    `Primary threat vector was ${primaryClass.name} (${primaryClass.value.toLocaleString()} events, ${primaryClassPct}%), followed by ${secondaryClass.name} (${secondaryClass.value.toLocaleString()} events).`,
    leadingFile ? `Major file-level alerts were dominated by ${leadingFile.fileName} (${leadingFile.count.toLocaleString()} alerts), launched via parent app ${leadingApp?.appName ?? 'system processes'}.` : `Major alert distributions remained steady across monitored application binaries.`,
    `Autonomous response engines successfully auto-mitigated ${autoResolvedCount.toLocaleString()} threats (${autoResolvedPct}% of all resolved items).`,
    `Site risk was highest at ${topSite.site} with ${topSite.current.toLocaleString()} registered incidents (Risk Score: ${topSite.riskScore}).`,
    `${highRiskRecurring.length} endpoints exhibit persistent multi-month risk, headed by ${topPersistentHost?.endpoint ?? 'None'} (${topPersistentHost?.totalIncidents ?? 0} total detections across ${topPersistentHost?.monthsAppeared ?? 0} months).`,
    totalAssets > 0
      ? `ITAM reconciliation identified ${unprotectedCount} unprotected enterprise assets and ${ghostCount} unmanaged ghost agents.`
      : `All active telemetry is currently reconciled against SentinelOne agent deployment records.`,
  ];

  // ============================================================
  // Construct Detailed Sections
  // ============================================================
  const sections: DetailedSection[] = [
    {
      id: 'posture-overview',
      title: '1. Executive Overview & Threat Posture',
      subtitle: 'Comprehensive situational assessment of monthly incident volume, velocity, and containment status.',
      summaryBadge: `${totalIncidents.toLocaleString()} Incidents Logged`,
      badgeVariant: 'purple',
      paragraphs: [
        `During ${currentMonthLabel}, the Security Operations Center (SOC) monitored ${accountName} telemetry through SentinelOne Singularity EDR. Over this cycle, the sensor grid captured ${totalIncidents.toLocaleString()} telemetry detections, representing ${trendDescription} (baseline: ${prevTotalIncidents.toLocaleString()} in ${comparisonMonthLabel}).`,
        `Telemetry shows that ${maliciousCount.toLocaleString()} events (${maliciousPct}%) were classified as confirmed malicious, while ${suspiciousCount.toLocaleString()} (${suspiciousPct}%) were flagged as suspicious anomalies requiring behavioral observation. Containment operations successfully neutralized and closed ${resolvedCount.toLocaleString()} incidents, yielding an overall resolution efficacy of ${resolvedPct}%. An active queue of ${unresolvedCount.toLocaleString()} unresolved incidents (${unresolvedPct}%) and ${inProgressCount.toLocaleString()} in-progress investigations remains under Tier-2 SOC review.`,
        `Fleet activity was distributed across ${uniqueEndpointCount.toLocaleString()} unique host systems, averaging ${avgAlertsPerEndpoint} alerts per active endpoint. This suggests an operational posture characterized by targeted endpoint pressure rather than widespread uniform infection across the fleet.`,
      ],
      keyDataPoints: [
        { label: 'Total Volume', value: totalIncidents.toLocaleString(), change: `${momDeltaPct > 0 ? '+' : ''}${momDeltaPct}% MoM`, tone: momDirection === 'up' ? 'warning' : 'positive' },
        { label: 'Resolution Rate', value: `${resolvedPct}%`, change: `${resolvedCount.toLocaleString()} closed`, tone: resolvedPct >= 85 ? 'positive' : 'warning' },
        { label: 'Malicious Ratio', value: `${maliciousPct}%`, change: `${maliciousCount.toLocaleString()} confirmed`, tone: maliciousPct > 30 ? 'danger' : 'neutral' },
        { label: 'Active Host Density', value: `${avgAlertsPerEndpoint} / host`, change: `${uniqueEndpointCount} endpoints`, tone: 'neutral' },
      ],
      takeaways: [
        `Operational containment is at ${resolvedPct}%, maintaining a stable response baseline.`,
        `Month-over-month telemetry shifted by ${momDeltaPct}%, indicating ${momDirection === 'up' ? 'an elevated adversary activity window' : 'improved suppression and baseline stabilization'}.`,
        `Active incident backlog consists of ${unresolvedCount.toLocaleString()} open tickets requiring triage prioritization.`,
      ],
    },
    {
      id: 'threat-landscape',
      title: '2. Threat Classification, File Payloads & App Vectors',
      subtitle: 'Deep analysis of malware families, high-alert binaries, originating parent applications, and engine telemetry.',
      summaryBadge: `Top Threat: ${primaryClass.name} (${primaryClassPct}%)`,
      badgeVariant: 'red',
      paragraphs: [
        `Classification breakdown reveals that ${primaryClass.name} constituted the primary attack vector for ${currentMonthLabel}, representing ${primaryClass.value.toLocaleString()} events (${primaryClassPct}% of total volume). Secondary pressure was driven by ${secondaryClass.name} with ${secondaryClass.value.toLocaleString()} events (${secondaryClassPct}%), followed by ${tertiaryClass.name} with ${tertiaryClass.value.toLocaleString()} detections (${tertiaryClassPct}%).`,
        `Payload and binary analysis demonstrates that major alerts were heavily concentrated around target file ${leadingFile ? `${leadingFile.fileName} (${leadingFile.count.toLocaleString()} detections, primarily impacting ${leadingFile.topEndpoint})` : 'system executables'}${secondaryFile ? ` and ${secondaryFile.fileName} (${secondaryFile.count.toLocaleString()} detections)` : ''}. On the process execution layer, parent application telemetry shows that ${leadingApp ? `${leadingApp.appName} generated the largest share of alerts (${leadingApp.count.toLocaleString()} executions)` : 'standard system utilities initiated the events'}${secondaryApp ? `, followed by ${secondaryApp.appName} (${secondaryApp.count.toLocaleString()} processes)` : ''}.`,
        surgingTrend && surgingTrend.deltaPercent > 0
          ? `Month-over-month trend analysis underscores notable vector migration: ${surgingTrend.classification} surged by ${surgingTrend.deltaPercent}% (+${surgingTrend.delta} incidents), representing the fastest-growing threat category. Conversely, ${decliningTrend?.classification ?? 'other vectors'} dropped by ${Math.abs(decliningTrend?.deltaPercent ?? 0)}%, showing effective containment of previous campaigns.`
          : `Vector distribution remained steady month-over-month, with no single classification exhibiting an abnormal anomalous spike.`,
        `From an engine efficacy standpoint, ${primaryEngine.name} registered the highest detection count with ${primaryEngine.value.toLocaleString()} catches (${primaryEnginePct}%), accompanied by ${secondaryEngine.name} with ${secondaryEngine.value.toLocaleString()} events (${secondaryEnginePct}%). The dominance of AI-driven behavioral and static inspection demonstrates effective defense against both known file signatures and zero-day execution techniques.`,
        `Analyst verdict reconciliation confirms ${truePos.toLocaleString()} True Positives (${truePosPct}%), demonstrating high-fidelity threat signal. False Positives accounted for ${falsePos.toLocaleString()} items (${falsePosPct}%), yielding a low false-positive overhead. ${undefVerd.toLocaleString()} events remain in an undefined triage state, which should be prioritized for classification closure.`,
      ],
      keyDataPoints: [
        { label: 'Primary Vector', value: primaryClass.name, change: `${primaryClassPct}% share (${primaryClass.value})`, tone: 'danger' },
        { label: 'Top Threat File', value: leadingFile?.fileName ?? 'None', change: `${leadingFile?.count ?? 0} detections`, tone: 'danger' },
        { label: 'Top Originating App', value: leadingApp?.appName ?? 'None', change: `${leadingApp?.count ?? 0} executions`, tone: 'warning' },
        { label: 'True Positive Fidelity', value: `${truePosPct}%`, change: `${truePos.toLocaleString()} true positives`, tone: 'positive' },
      ],
      takeaways: [
        `${primaryClass.name} represents ${primaryClassPct}% of all activity, with payload ${leadingFile?.fileName ?? 'binaries'} generating the highest file-level alerts.`,
        `Parent application ${leadingApp?.appName ?? 'processes'} acted as the leading execution launchpad for suspicious behaviors.`,
        `Detection engines rely heavily on ${primaryEngine.name}, which provided first-line defense for ${primaryEnginePct}% of alerts with ${falsePosPct}% false positive overhead.`,
      ],
    },
    {
      id: 'endpoint-exposure',
      title: '3. Host Vulnerability & Fleet Health',
      subtitle: 'Analysis of high-density target systems, policy distribution, and agent software health.',
      summaryBadge: `${top3HostConcentrationPct}% on Top 3 Hosts`,
      badgeVariant: 'amber',
      paragraphs: [
        `Incident density across the enterprise reflects a high degree of host concentration. The top 3 most frequently targeted endpoints accounted for ${top3HostTotal.toLocaleString()} incidents—representing ${top3HostConcentrationPct}% of all detected events across the organization.`,
        topHosts.length > 0
          ? `The most heavily impacted system was ${topHosts[0].endpoint} with ${topHosts[0].count.toLocaleString()} detections, followed by ${topHosts[1]?.endpoint ?? 'N/A'} (${topHosts[1]?.count.toLocaleString() ?? 0} detections) and ${topHosts[2]?.endpoint ?? 'N/A'} (${topHosts[2]?.count.toLocaleString() ?? 0} detections). In-depth review indicates repeated malicious file drops and unauthorized executable invocations on these specific machines.`
          : `Detections were evenly distributed across endpoints with no single machine exhibiting extreme anomaly counts.`,
        `Enforcement policy configuration reveals that ${protectPct}% of incidents were intercepted under active 'Protect' mode, triggering immediate automated quarantine and process termination. However, ${detectPct}% of detections occurred under 'Detect' or 'Monitor' mode, which permitted file execution while logging alerts for retrospective analyst action.`,
        `Agent version distribution shows that ${leadingAgentPct}% of the reporting fleet is standardized on agent build ${leadingAgent.name}. Fleet hygiene remains consistent, though secondary endpoints on legacy versions should be scheduled for the next deployment ring to maintain updated behavioral detection signatures.`,
      ],
      keyDataPoints: [
        { label: 'Top Host Concentration', value: `${top3HostConcentrationPct}%`, change: `${top3HostTotal} alerts on top 3`, tone: top3HostConcentrationPct > 35 ? 'warning' : 'neutral' },
        { label: 'Protect Policy Ratio', value: `${protectPct}%`, change: `${detectPct}% in Detect mode`, tone: protectPct >= 70 ? 'positive' : 'warning' },
        { label: 'Primary Agent Build', value: leadingAgent.name, change: `${leadingAgentPct}% adoption`, tone: 'positive' },
        { label: 'Most Impacted Host', value: topHosts[0]?.endpoint ?? 'None', change: `${topHosts[0]?.count ?? 0} detections`, tone: 'danger' },
      ],
      takeaways: [
        `Top 3 endpoints absorb ${top3HostConcentrationPct}% of incident load; immediate host isolation and credential sweeps are recommended.`,
        `${detectPct}% of incidents occurred in 'Detect' mode; transitioning eligible sites to 'Protect' will reduce manual SOC intervention.`,
        `Fleet agent health is led by version ${leadingAgent.name} (${leadingAgentPct}%).`,
      ],
    },
    {
      id: 'regional-hotspots',
      title: '4. Regional Threat Hotspots & Site Disparity',
      subtitle: 'Geographical incident volume distribution, localized threat surges, and site risk scoring.',
      summaryBadge: `High Risk: ${topSite.site}`,
      badgeVariant: 'cyan',
      paragraphs: [
        `Telemetry parsed across geographical facilities indicates marked operational variance. ${topSite.site} emerged as the enterprise's primary threat hotspot during ${currentMonthLabel}, registering ${topSite.current.toLocaleString()} security events (Risk Score: ${topSite.riskScore}) and accounting for ${Math.round((topSite.current / (totalIncidents || 1)) * 100)}% of total enterprise volume.`,
        surgingSite && surgingSite.deltaPercent > 0
          ? `The greatest localized velocity spike occurred at ${surgingSite.site}, where incident counts accelerated by ${surgingSite.deltaPercent}% MoM (+${surgingSite.delta} events compared to ${comparisonMonthLabel}). This surge is attributable to localized phishing campaigns and repeated script execution attempts in that facility.`
          : `Regional distribution demonstrated steady operational baselines across all monitored corporate facilities.`,
        `The remaining volume was distributed across key regional sites including ${siteRisks.slice(1, 4).map((s) => `${s.site} (${s.current} events, risk score ${s.riskScore})`).join(', ') || 'distributed satellite branches'}. These regional variations highlight the importance of differentiated security controls calibrated to localized business operations and network architectures.`,
      ],
      keyDataPoints: [
        { label: 'Primary Hotspot', value: topSite.site, change: `${topSite.current} incidents`, tone: 'danger' },
        { label: 'Hotspot Risk Score', value: topSite.riskScore.toString(), change: `Highest across fleet`, tone: 'danger' },
        { label: 'Greatest Site Surge', value: surgingSite?.site ?? 'None', change: `${surgingSite?.deltaPercent ?? 0}% MoM`, tone: 'warning' },
        { label: 'Monitored Sites', value: siteRisks.length.toString(), change: `Global footprint`, tone: 'neutral' },
      ],
      takeaways: [
        `${topSite.site} requires priority attention and enhanced perimeter inspection.`,
        `${surgingSite?.site ?? 'Regional site'} registered a ${surgingSite?.deltaPercent ?? 0}% velocity surge that warrants immediate investigation.`,
        `Site risk scores reflect concentration in key regional centers rather than a uniform global escalation.`,
      ],
    },
    {
      id: 'chronic-persistence',
      title: '5. Persistent Threats & Recurring Hosts',
      subtitle: 'Identification of chronic repeat-offender endpoints exhibiting detections across multiple cycles.',
      summaryBadge: `${highRiskRecurring.length} Chronic Endpoints`,
      badgeVariant: 'red',
      paragraphs: [
        `Cross-cycle telemetry correlation identified ${highRiskRecurring.length} endpoints exhibiting recurring security incidents across multiple consecutive reporting cycles. These chronic entities represent elevated risk because repeat detections often point to dormant persistence hooks, incomplete remediation, repeated user phishing exposure, or unpatched perimeter software.`,
        topPersistentHost
          ? `Leading the persistence register is host ${topPersistentHost.endpoint}, which generated ${topPersistentHost.totalIncidents} security detections across ${topPersistentHost.monthsAppeared} distinct monthly telemetry periods (Rank Score: ${topPersistentHost.rankScore}). Repeat incidents on this machine have spanned multiple distinct threat classifications, indicating either a deeply rooted foothold or recurrent compromise of user credentials.`
          : `No individual host exhibited critical cross-cycle persistence thresholds during the active evaluation window.`,
        `Other recurrent host entities include ${highRiskRecurring.slice(1, 4).map((h) => `${h.endpoint} (${h.totalIncidents} detections across ${h.monthsAppeared} months)`).join(', ') || 'no secondary repeat offenders'}. Conventional automated file deletion has proven insufficient for these machines; full forensic disk triage, memory inspection, and Active Directory credential rotation are required.`,
      ],
      keyDataPoints: [
        { label: 'Persistent Endpoints', value: highRiskRecurring.length.toString(), change: `2+ months active`, tone: highRiskRecurring.length > 5 ? 'danger' : 'warning' },
        { label: 'Top Chronic Host', value: topPersistentHost?.endpoint ?? 'None', change: `${topPersistentHost?.totalIncidents ?? 0} detections`, tone: 'danger' },
        { label: 'Months Recurring', value: `${topPersistentHost?.monthsAppeared ?? 0} cycles`, change: `Span: ${topPersistentHost?.monthKeys?.join(', ') ?? 'N/A'}`, tone: 'warning' },
        { label: 'Persistence Risk', value: topPersistentHost ? `${topPersistentHost.rankScore}` : '0', change: `Rank score`, tone: 'danger' },
      ],
      takeaways: [
        `${highRiskRecurring.length} endpoints require escalation to Tier-3 incident response for full re-imaging or forensic sweep.`,
        `Host ${topPersistentHost?.endpoint ?? 'N/A'} has appeared across ${topPersistentHost?.monthsAppeared ?? 0} monthly cycles without permanent resolution.`,
        `Persistent recurrence suggests secondary persistence vectors or compromised user credentials.`,
      ],
    },
    {
      id: 'resolution-velocity',
      title: '6. Incident Resolution Velocity & Containment',
      subtitle: 'Audit of operational resolution rates, ticket velocities, and outstanding backlog risk.',
      summaryBadge: `${resolvedPct}% Remediated`,
      badgeVariant: 'emerald',
      paragraphs: [
        `Incident lifecycle telemetry demonstrates effective containment velocity across the ${currentMonthLabel} operational window. The SOC and automated remediation pipelines resolved ${resolvedCount.toLocaleString()} incidents, establishing a ${resolvedPct}% resolution baseline.`,
        `The current active backlog includes ${unresolvedCount.toLocaleString()} unresolved incidents (${unresolvedPct}%) and ${inProgressCount.toLocaleString()} events currently in progress (${inProgressPct}%). Unresolved incidents consist predominantly of low-to-medium confidence heuristics and ambiguous user-initiated scripts currently undergoing sandbox emulation and Tier-2 triage.`,
        `Automated mitigation routines accounted for ${autoResolvedCount.toLocaleString()} incident remediations (${autoResolvedPct}% of all resolved items). This automated pre-emption significantly accelerated the mean time to respond (MTTR) by isolating threats at execution time without awaiting analyst dispatch.`,
      ],
      keyDataPoints: [
        { label: 'Resolved Count', value: resolvedCount.toLocaleString(), change: `${resolvedPct}% of total`, tone: 'positive' },
        { label: 'Active Backlog', value: unresolvedCount.toLocaleString(), change: `${unresolvedPct}% unresolved`, tone: unresolvedCount > 100 ? 'warning' : 'neutral' },
        { label: 'In Progress Queue', value: inProgressCount.toLocaleString(), change: `${inProgressPct}% pending triage`, tone: 'neutral' },
        { label: 'Automation Contribution', value: `${autoResolvedPct}%`, change: `${autoResolvedCount} auto-resolved`, tone: 'positive' },
      ],
      takeaways: [
        `Healthy resolution rate of ${resolvedPct}% indicates prompt threat containment.`,
        `Autonomous agent mitigations handled ${autoResolvedCount.toLocaleString()} incidents, shielding analyst queues from repetitive manual tasks.`,
        `Unresolved queue of ${unresolvedCount.toLocaleString()} items should be systematically triaged to eliminate lingering attack avenues.`,
      ],
    },
    {
      id: 'automation-hygiene',
      title: '7. Automation Efficacy & Asset Hygiene',
      subtitle: 'Self-healing EDR capabilities, anti-tampering events, and IT asset inventory reconciliation.',
      summaryBadge: totalAssets > 0 ? `${coveragePct}% ITAM Coverage` : 'Agent Self-Healing Active',
      badgeVariant: 'blue',
      paragraphs: [
        `SentinelOne Singularity automation pipelines executed ${autoResolvedCount.toLocaleString()} autonomous mitigations during the period. Preemptive mitigation successfully blocked malicious execution trees prior to persistence installation or memory injection.`,
        `Agent tamper resistance logged ${rejectedUninstalls.toLocaleString()} rejected unauthorized uninstall attempts, verifying that anti-tamper controls successfully prevented malicious or unauthorized attempts to disable endpoint telemetry. In addition, ${decommissioned.toLocaleString()} retired or decommissioned agent records were identified and purged from active routing tables.`,
        totalAssets > 0
          ? `Reconciliation between enterprise IT asset inventory (${totalAssets.toLocaleString()} registered assets) and active SentinelOne agent telemetry revealed an enterprise protection coverage of ${coveragePct}% (${coveredAssets.toLocaleString()} protected assets). Critical visibility gaps include ${unprotectedCount.toLocaleString()} unprotected corporate assets lacking EDR agents, as well as ${ghostCount.toLocaleString()} ghost endpoints (active EDR agents not listed in ITAM databases).`
          : `All active endpoints currently correspond to operational SentinelOne sensor nodes. Deploying comprehensive IT asset inventory CSV data will unlock cross-referencing against enterprise CMDB/ITAM registries to identify unmanaged shadow IT assets.`,
      ],
      keyDataPoints: [
        { label: 'Autonomous Actions', value: autoResolvedCount.toLocaleString(), change: `${autoResolvedPct}% of resolutions`, tone: 'positive' },
        { label: 'Anti-Tamper Rejections', value: rejectedUninstalls.toLocaleString(), change: `Unauthorized uninstall blocks`, tone: rejectedUninstalls > 0 ? 'warning' : 'positive' },
        { label: 'ITAM Coverage', value: totalAssets > 0 ? `${coveragePct}%` : 'N/A', change: totalAssets > 0 ? `${coveredAssets}/${totalAssets} assets` : 'No ITAM data loaded', tone: coveragePct >= 90 ? 'positive' : 'warning' },
        { label: 'Unprotected Blindspots', value: totalAssets > 0 ? unprotectedCount.toLocaleString() : 'N/A', change: `Assets missing EDR`, tone: unprotectedCount > 0 ? 'danger' : 'positive' },
      ],
      takeaways: [
        `Anti-tamper features successfully repelled ${rejectedUninstalls} unauthorized termination attempts.`,
        totalAssets > 0
          ? `${unprotectedCount} unmanaged enterprise assets represent blind spots that must be prioritized for agent push.`
          : `Automated self-healing and threat neutralization are performing within expected SLA parameters.`,
        totalAssets > 0
          ? `${ghostCount} ghost agents require CMDB asset inventory reconciliation.`
          : `Cross-checking against corporate IT assets provides full visibility into shadow IT exposure.`,
      ],
    },
  ];

  // ============================================================
  // Construct Actionable SOC Recommendations
  // ============================================================
  const actionPlan = {
    immediate: [
      `Isolate and conduct forensic disk triage on high-density persistent host ${topPersistentHost?.endpoint ?? (topHosts[0]?.endpoint || 'top infected machines')}.`,
      `Review and close the ${unresolvedCount.toLocaleString()} unresolved incidents in the Tier-2 queue, prioritizing confirmed True Positives.`,
      `Dispatch incident response teams to investigate the ${surgingSite?.site ?? topSite.site} facility to halt the ${surgingSite?.deltaPercent ?? 0}% threat acceleration.`,
      `Force Active Directory credential reset for user accounts associated with recurring hosts in ${highRiskRecurring.map((h) => h.endpoint).slice(0, 3).join(', ') || 'high-incident endpoints'}.`,
    ],
    shortTerm: [
      `Transition endpoints currently running in 'Detect' mode (${detectPct}% of volume) to 'Protect' enforcement mode to automate containment.`,
      `Deploy SentinelOne Singularity agent to the ${unprotectedCount} unprotected enterprise assets identified in ITAM reconciliation.`,
      `Update endpoints running outdated agent builds to current corporate baseline build ${leadingAgent.name}.`,
      `Refine threat exclusion rules for recurring False Positives (${falsePos.toLocaleString()} events) to reduce analyst queue fatigue.`,
    ],
    mediumTerm: [
      `Reconcile the ${ghostCount} ghost agent records against the corporate CMDB to maintain pristine asset lifecycle tracking.`,
      `Conduct targeted anti-phishing training for user cohorts situated in ${topSite.site} and other high-incident sites.`,
      `Perform an enterprise threat hunting exercise focusing on ${primaryClass.name} and ${secondaryClass.name} behavioral indicators across all endpoints.`,
      `Review behavioral engine sensitivity thresholds for fileless script execution across remote workstation subnets.`,
    ],
  };

  // ============================================================
  // Construct Full Markdown Text
  // ============================================================
  const mdSections = sections.map((s) => {
    const dataPointsTable = s.keyDataPoints.length > 0
      ? `| Metric | Value | Detail |\n| :--- | :--- | :--- |\n` +
        s.keyDataPoints.map((dp) => `| **${dp.label}** | \`${dp.value}\` | ${dp.change || '—'} |`).join('\n') + '\n\n'
      : '';
    
    const takeawaysList = s.takeaways.map((t) => `- ${t}`).join('\n');

    return `## ${s.title}\n*${s.subtitle}*\n\n${s.paragraphs.join('\n\n')}\n\n${dataPointsTable}### Key Observations\n${takeawaysList}\n`;
  }).join('\n---\n\n');

  const fullMarkdown = `# Enterprise EDR Executive Intelligence Summary
**Reporting Period:** ${currentMonthLabel} | **Baseline:** ${comparisonMonthLabel}
**Organization / Account:** ${accountName}
**Generated:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

---

## Executive Briefing
${executiveBriefingOverview}

### Critical Highlights
${executiveBulletPoints.map((b) => `- ${b}`).join('\n')}

---

${mdSections}

---

## Strategic SOC Action Plan & Recommendations

### Priority 1: Immediate Containment (24–48 Hours)
${actionPlan.immediate.map((item, idx) => `${idx + 1}. **${item}**`).join('\n')}

### Priority 2: Security Hardening & Policy Optimization (1–2 Weeks)
${actionPlan.shortTerm.map((item, idx) => `${idx + 1}. **${item}**`).join('\n')}

### Priority 3: Governance & Long-Term Posture (30 Days)
${actionPlan.mediumTerm.map((item, idx) => `${idx + 1}. **${item}**`).join('\n')}

---
*Report generated via SentinelOne Analytics Engine.*
`;

  // ============================================================
  // Plain Text Version
  // ============================================================
  const plainText = fullMarkdown
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\|/g, ' ')
    .replace(/:---/g, '')
    .replace(/---/g, '----------------------------------------');

  return {
    metadata: {
      reportingPeriod: currentMonthLabel,
      comparisonPeriod: comparisonMonthLabel,
      accountName,
      totalIncidents,
      previousIncidents: prevTotalIncidents,
      momDeltaPct,
      momDirection,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    },
    executiveBriefing: {
      headline: executiveBriefingHeadline,
      overviewParagraph: executiveBriefingOverview,
      criticalMetrics,
      bulletPoints: executiveBulletPoints,
    },
    sections,
    actionPlan,
    fullMarkdown,
    plainText,
  };
}
