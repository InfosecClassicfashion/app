'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileLines,
  faDownload,
  faSpinner,
  faCircleCheck,
  faCircleExclamation,
  faEye,
  faFilePowerpoint,
} from '@fortawesome/free-solid-svg-icons';
import { useDashboard } from '@/contexts/DashboardContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ExportStatus = 'idle' | 'generating' | 'done' | 'error';

export default function ReportPage() {
  const { analytics, months, reportingMonth, hasData, edrRows } = useDashboard();
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  if (!hasData) return <EmptyState />;
  if (!analytics) return <EmptyState title="No data for selected month" showUploadLink={false} />;

  const reportLabel = months.find((m) => m.key === reportingMonth)?.label ?? reportingMonth;

  // Helper for reliable browser file download
  const triggerFileDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 2000);
  };

  // Helper to generate the react-pdf blob
  const generatePdfBlob = async (): Promise<Blob> => {
    const { pdf } = await import('@react-pdf/renderer');
    const { ReportDocument } = await import('@/components/report/ReportDocument');

    const docElement = (
      <ReportDocument
        analytics={analytics}
        months={months}
        reportingMonth={reportingMonth}
      />
    );

    return await pdf(docElement).toBlob();
  };

  // ---- PDF Export (react-pdf/renderer) ----
  const handlePdfExport = async () => {
    setStatus('generating');
    setStatusMsg('Compiling vector PDF document with @react-pdf/renderer…');
    try {
      const pdfBlob = await generatePdfBlob();
      const safeMonth = (reportingMonth || 'monthly').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `EDR_Security_Report_${safeMonth}.pdf`;
      triggerFileDownload(pdfBlob, filename);

      setStatus('done');
      setStatusMsg(`Downloaded: ${filename}`);
    } catch (err) {
      console.error('PDF export failed:', err);
      setStatus('error');
      setStatusMsg(String(err));
    }
  };

  // ---- PDF In-Browser Preview ----
  const handlePreviewPdf = async () => {
    setStatus('generating');
    setStatusMsg('Rendering PDF for preview…');
    try {
      const pdfBlob = await generatePdfBlob();
      const previewUrl = URL.createObjectURL(pdfBlob);
      window.open(previewUrl, '_blank');

      setStatus('done');
      setStatusMsg('Report preview opened in new tab');
    } catch (err) {
      console.error('PDF preview failed:', err);
      setStatus('error');
      setStatusMsg(String(err));
    }
  };

  // ---- DOCX Export ----
  const handleDocxExport = async () => {
    setStatus('generating');
    setStatusMsg('Building DOCX report…');
    try {
      const {
        Document, Packer, Paragraph, TextRun, HeadingLevel, Table,
        TableRow, TableCell, WidthType, AlignmentType,
      } = await import('docx');

      const safeMonth = (reportingMonth || 'monthly').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `EDR_Security_Report_${safeMonth}.docx`;

      const createHeaderCell = (text: string) =>
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })] })],
          shading: { fill: '1E293B' },
        });

      const createCell = (text: string) =>
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text })] })],
        });

      // Executive Summary KPIs table
      const kpiRows = [
        new TableRow({
          children: [
            createHeaderCell('KPI Metric'),
            createHeaderCell('Value'),
            createHeaderCell('Previous'),
          ],
        }),
        ...analytics.kpis.slice(0, 4).map(
          (k) =>
            new TableRow({
              children: [
                createCell(k.label),
                createCell(String(k.value)),
                createCell(k.previous !== undefined ? String(k.previous) : '—'),
              ],
            })
        ),
      ];

      // Top Alerts table
      const alertRows = [
        new TableRow({
          children: [
            createHeaderCell('Alert Classification'),
            createHeaderCell('Incident Count'),
          ],
        }),
        ...analytics.classificationDist.slice(0, 8).map(
          (c) =>
            new TableRow({
              children: [
                createCell(c.name),
                createCell(c.value.toLocaleString()),
              ],
            })
        ),
      ];

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: `EDR Monthly Security Report — ${reportLabel}`,
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Generated: ${new Date().toLocaleDateString()} | Target Account: Classic Fashion Apparel`, italics: true, color: '64748B' }),
                ],
              }),
              new Paragraph({ text: '' }),
              new Paragraph({
                text: 'Executive Summary Key Performance Indicators',
                heading: HeadingLevel.HEADING_2,
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: kpiRows,
              }),
              new Paragraph({ text: '' }),
              new Paragraph({
                text: 'Alert Classification Breakdown',
                heading: HeadingLevel.HEADING_2,
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: alertRows,
              }),
              new Paragraph({ text: '' }),
              new Paragraph({
                text: 'Incident Resolution Velocities',
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Total Detections: ${analytics.kpis[0]?.value ?? '0'} | Resolved: ${analytics.kpis[1]?.value ?? '0'} | Active Endpoints: ${analytics.kpis[3]?.value ?? '0'}`,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const buf = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buf)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      triggerFileDownload(blob, filename);

      setStatus('done');
      setStatusMsg(`Downloaded: ${filename}`);
    } catch (err) {
      console.error('DOCX export failed:', err);
      setStatus('error');
      setStatusMsg(String(err));
    }
  };

  // ---- PowerPoint Export (pptxgenjs) ----
  const handlePptxExport = async () => {
    setStatus('generating');
    setStatusMsg('Compiling executive PowerPoint presentation with pptxgenjs…');
    try {
      const { generateReportPowerPoint } = await import('@/components/report/pptxReportGenerator');
      const pptxBlob = await generateReportPowerPoint({
        analytics,
        months,
        reportingMonth,
        accountName: 'Classic Fashion Apparel',
      });
      const safeMonth = (reportingMonth || 'monthly').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `EDR_Security_Report_${safeMonth}.pptx`;
      triggerFileDownload(pptxBlob, filename);

      setStatus('done');
      setStatusMsg(`Downloaded: ${filename}`);
    } catch (err) {
      console.error('PowerPoint export failed:', err);
      setStatus('error');
      setStatusMsg(String(err));
    }
  };

  const isGenerating = status === 'generating';
  const statusIcon = status === 'done' ? faCircleCheck : status === 'error' ? faCircleExclamation : faFileLines;
  const statusColor = status === 'done' ? '#10B981' : status === 'error' ? '#EF4444' : '#2563EB';

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-heading tracking-wider text-[var(--text-primary)]">Generate Report</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Export an executive monthly EDR security report for {reportLabel}
        </p>
      </div>

      {/* Report card */}
      <div className="glass-card p-6 max-w-2xl border border-white/[0.08]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/25">
            <FontAwesomeIcon icon={faFileLines} className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading tracking-wider text-[var(--text-primary)]">
                Monthly EDR Security Report — {reportLabel}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                react-pdf
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                pptxgenjs
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {edrRows.length.toLocaleString()} incidents · {months.length} month{months.length !== 1 ? 's' : ''} of telemetry data
            </p>

            {/* Sections list */}
            <div className="mt-4 grid grid-cols-2 gap-1.5">
              {[
                '01. Executive Cover Page',
                '02. Table of Contents',
                '03. Executive Summary',
                '04. Alert Analysis (MoM)',
                '05. Endpoint Detections',
                '06. Regional Threat Hotspots',
                '07. Persistent Risky Endpoints',
                '08. Incident Resolution Status',
                '09. Asset Reconciliation',
              ].map((section) => (
                <div key={section} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {section}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status banner */}
        {status !== 'idle' && (
          <div className="mt-4 p-3 rounded-lg border border-white/[0.08] bg-[var(--bg-elevated)] flex items-center gap-3">
            {isGenerating ? (
              <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: statusColor }} />
            ) : (
              <FontAwesomeIcon icon={statusIcon} className="w-4 h-4 flex-shrink-0" style={{ color: statusColor }} />
            )}
            <p className="text-xs text-[var(--text-secondary)]">{statusMsg}</p>
          </div>
        )}

        {/* Export & Preview buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                disabled={isGenerating}
                className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-md shadow-blue-600/25 disabled:opacity-50"
              >
                {isGenerating ? (
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                )}
                {isGenerating ? 'Generating…' : 'Export Report'}
              </Button>
            } />
            <DropdownMenuContent
              align="start"
              className="bg-[var(--bg-elevated)] border-white/10 text-[var(--text-primary)] w-56"
            >
              <DropdownMenuItem
                onClick={handlePptxExport}
                className="text-sm cursor-pointer focus:bg-white/[0.05]"
              >
                <FontAwesomeIcon icon={faFilePowerpoint} className="w-4 h-4 mr-2 text-amber-400" />
                Export as PowerPoint (.pptx)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePdfExport}
                className="text-sm cursor-pointer focus:bg-white/[0.05]"
              >
                <FontAwesomeIcon icon={faFileLines} className="w-4 h-4 mr-2 text-blue-400" />
                Export as PDF (react-pdf)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePreviewPdf}
                className="text-sm cursor-pointer focus:bg-white/[0.05]"
              >
                <FontAwesomeIcon icon={faEye} className="w-4 h-4 mr-2 text-emerald-400" />
                Preview PDF in New Tab
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDocxExport}
                className="text-sm cursor-pointer focus:bg-white/[0.05]"
              >
                <FontAwesomeIcon icon={faFileLines} className="w-4 h-4 mr-2 text-indigo-400" />
                Export as Word (.docx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            disabled={isGenerating}
            onClick={handlePptxExport}
            className="text-xs gap-1.5 border-amber-500/30 text-amber-300 hover:text-white hover:bg-amber-500/20"
          >
            <FontAwesomeIcon icon={faFilePowerpoint} className="w-3.5 h-3.5 text-amber-400" />
            PowerPoint (.pptx)
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isGenerating}
            onClick={handlePreviewPdf}
            className="text-xs gap-1.5 border-white/10 text-[var(--text-secondary)] hover:text-white"
          >
            <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5 text-emerald-400" />
            Quick Preview
          </Button>

          {status !== 'idle' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStatus('idle'); setStatusMsg(''); }}
              className="text-xs text-[var(--text-muted)]"
            >
              Reset
            </Button>
          )}
        </div>

        <p className="text-[11px] text-[var(--text-dim)] mt-3">
          Vector rendering with @react-pdf/renderer and executive slide decks with pptxgenjs produce high-resolution, editable deliverables in 1–2 seconds.
        </p>
      </div>
    </div>
  );
}
