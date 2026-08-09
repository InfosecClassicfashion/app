'use client';

import React, { useState, useRef } from 'react';
import { FileText, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportDocument } from '@/components/report/ReportDocument';

type ExportStatus = 'idle' | 'generating' | 'done' | 'error';

export default function ReportPage() {
  const { analytics, months, reportingMonth, hasData, edrRows } = useDashboard();
  const reportRef = useRef<HTMLDivElement>(null);
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

  // ---- PDF Export ----
  const handlePdfExport = async () => {
    setStatus('generating');
    setStatusMsg('Capturing pages…');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const reportEl = reportRef.current;
      if (!reportEl) throw new Error('Report element not found');

      const pages = reportEl.querySelectorAll<HTMLElement>('.pdf-page');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [794, 1123] });

      for (let i = 0; i < pages.length; i++) {
        setStatusMsg(`Rendering page ${i + 1} of ${pages.length}…`);
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, allowTaint: false,
          backgroundColor: i === 0 ? '#0B0E1A' : '#FFFFFF',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123, undefined, 'FAST');
      }

      const safeMonth = (reportingMonth || 'monthly').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `EDR_Report_${safeMonth}.pdf`;
      const pdfBlob = pdf.output('blob');
      triggerFileDownload(pdfBlob, filename);

      setStatus('done');
      setStatusMsg(`Downloaded: ${filename}`);
    } catch (err) {
      setStatus('error');
      setStatusMsg(String(err));
    }
  };

  // ---- DOCX Export ----
  const handleDocxExport = async () => {
    setStatus('generating');
    setStatusMsg('Building DOCX…');
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table: DocxTable,
        TableRow: DocxRow, TableCell: DocxCell, WidthType, AlignmentType } = await import('docx');
      const { default: html2canvas } = await import('html2canvas');
      const { ImageRun } = await import('docx');

      const reportEl = reportRef.current;
      if (!reportEl) throw new Error('Report element not found');

      const pages = reportEl.querySelectorAll<HTMLElement>('.pdf-page');
      const imageRuns: InstanceType<typeof ImageRun>[] = [];

      for (let i = 0; i < pages.length; i++) {
        setStatusMsg(`Capturing page ${i + 1} of ${pages.length}…`);
        const canvas = await html2canvas(pages[i], {
          scale: 1.5, useCORS: true, allowTaint: false,
          backgroundColor: i === 0 ? '#0B0E1A' : '#FFFFFF', logging: false,
        });
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
        const buf = await blob.arrayBuffer();
        imageRuns.push(new ImageRun({
          data: buf,
          transformation: { width: 600, height: Math.round(600 * (1123 / 794)) },
          type: 'png',
        }));
      }

      setStatusMsg('Assembling document…');

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: `EDR Monthly Security Report — ${reportLabel}`,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({ text: `Generated: ${new Date().toLocaleDateString()}` }),
            new Paragraph({ text: '' }),
            ...imageRuns.map((ir) => new Paragraph({ children: [ir] })),
          ],
        }],
      });

      const buf = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buf)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const safeMonth = (reportingMonth || 'monthly').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `EDR_Report_${safeMonth}.docx`;
      triggerFileDownload(blob, filename);

      setStatus('done');
      setStatusMsg(`Downloaded: ${filename}`);
    } catch (err) {
      setStatus('error');
      setStatusMsg(String(err));
    }
  };

  const isGenerating = status === 'generating';

  const StatusIcon = status === 'done' ? CheckCircle2 : status === 'error' ? AlertCircle : FileText;
  const statusColor = status === 'done' ? '#10B981' : status === 'error' ? '#EF4444' : '#8B5CF6';

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Generate Report</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Export a professional monthly EDR report for {reportLabel}
        </p>
      </div>

      {/* Report card */}
      <div className="glass-card p-6 max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center flex-shrink-0 glow-purple">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Monthly EDR Security Report — {reportLabel}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {edrRows.length.toLocaleString()} incidents · {months.length} month{months.length !== 1 ? 's' : ''} of data
            </p>

            {/* Sections list */}
            <div className="mt-4 grid grid-cols-2 gap-1.5">
              {[
                'Cover Page', 'Table of Contents', 'Executive Summary',
                'Alert Analysis', 'Endpoint Summary', 'Regional Hotspot',
                'Persistent Endpoints', 'Resolution Status',
                'Asset Reconciliation',
              ].map((section) => (
                <div key={section} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-purple)] flex-shrink-0" />
                  {section}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status */}
        {status !== 'idle' && (
          <div className="mt-4 p-3 rounded-lg border border-white/[0.06] bg-[var(--bg-elevated)] flex items-center gap-3">
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: statusColor }} />
            ) : (
              <StatusIcon className="w-4 h-4 flex-shrink-0" style={{ color: statusColor }} />
            )}
            <p className="text-xs text-[var(--text-secondary)]">{statusMsg}</p>
          </div>
        )}

        {/* Export button */}
        <div className="mt-5 flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                disabled={isGenerating}
                className="gap-2 gradient-purple text-white border-0 hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isGenerating ? 'Generating…' : 'Export Report'}
              </Button>
            } />
            <DropdownMenuContent
              align="start"
              className="bg-[var(--bg-elevated)] border-white/10 text-[var(--text-primary)] w-48"
            >
              <DropdownMenuItem
                onClick={handlePdfExport}
                className="text-sm cursor-pointer focus:bg-white/[0.05]"
              >
                <FileText className="w-4 h-4 mr-2 text-red-400" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDocxExport}
                className="text-sm cursor-pointer focus:bg-white/[0.05]"
              >
                <FileText className="w-4 h-4 mr-2 text-blue-400" />
                Export as Word (.docx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
          PDF/DOCX generation captures 9 A4 pages and may take 15–30 seconds.
        </p>
      </div>

      {/* Hidden offscreen report for capture */}
      <div ref={reportRef} aria-hidden="true">
        {analytics && (
          <ReportDocument
            analytics={analytics}
            months={months}
            reportingMonth={reportingMonth}
          />
        )}
      </div>
    </div>
  );
}
