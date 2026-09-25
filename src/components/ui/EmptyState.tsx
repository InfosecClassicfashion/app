'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showUploadLink?: boolean;
}

export function EmptyState({
  title = 'No data loaded',
  description = 'Upload your EDR export CSV to get started. You can also load sample data to explore the dashboard.',
  showUploadLink = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8">
      {/* Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-[var(--bg-elevated)] border border-white/[0.08] flex items-center justify-center">
          <FontAwesomeIcon icon={faChartSimple} className="w-9 h-9 text-[var(--text-dim)]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg gradient-purple flex items-center justify-center">
          <FontAwesomeIcon icon={faUpload} className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center max-w-sm">
        <h3 className="text-2xl font-heading tracking-wider text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
      </div>

      {/* CTA */}
      {showUploadLink && (
        <Link href="/upload">
          <Button
            className="gap-2 gradient-purple text-white border-0 hover:opacity-90 transition-opacity"
          >
            <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
            Upload Data
          </Button>
        </Link>
      )}
    </div>
  );
}
