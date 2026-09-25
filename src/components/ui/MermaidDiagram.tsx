'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCode } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MermaidDiagramProps {
  definition: string;
  id: string;
  className?: string;
}

export function MermaidDiagram({ definition, id, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          darkMode: true,
          themeVariables: {
            primaryColor: '#8B5CF6',
            primaryTextColor: '#E2E8F0',
            primaryBorderColor: '#3D2C6E',
            lineColor: '#94A3B8',
            sectionBkgColor: '#1E2638',
            altSectionBkgColor: '#161B22',
            gridColor: '#334155',
            titleColor: '#E2E8F0',
            edgeLabelBackground: '#161B22',
            background: '#0D1117',
            secondaryColor: '#1E2638',
            tertiaryColor: '#161B22',
            fontFamily: 'Inter, sans-serif',
          },
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, definition);
        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    }
    render();
    return () => { cancelled = true; };
  }, [definition, id]);

  const handleExportSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = async () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;
    const { svgToPng } = await import('@/lib/chart-export');
    const dataUrl = await svgToPng(svgEl as SVGElement, 2);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${id}.png`;
    a.click();
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Export buttons */}
      {svgContent && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSvg}
            className="h-7 text-xs gap-1.5 border-white/10 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <FontAwesomeIcon icon={faCode} className="w-3 h-3" />
            SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPng}
            className="h-7 text-xs gap-1.5 border-white/10 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
            PNG
          </Button>
        </div>
      )}

      {/* Diagram */}
      <div ref={containerRef} className="mermaid-container w-full overflow-auto">
        {error ? (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <p className="font-medium mb-1">Diagram Error</p>
            <pre className="text-xs whitespace-pre-wrap">{error}</pre>
          </div>
        ) : svgContent ? (
          <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        ) : (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
