'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Upload, LayoutDashboard, Bell, Crosshair, Monitor,
  Globe, AlertTriangle, CheckCircle2, Zap,
  FileText, ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TooltipRootProps } from '@base-ui/react/tooltip';

const NAV_ITEMS = [
  { href: '/upload',     label: 'Upload Data',        icon: Upload },
  { href: '/overview',   label: 'Executive Summary',  icon: LayoutDashboard },
  { href: '/alerts',     label: 'Alerts',             icon: Bell },
  { href: '/threats',    label: 'Threat Analysis',    icon: Crosshair },
  { href: '/endpoints',  label: 'Endpoint Summary',   icon: Monitor },
  { href: '/regional',   label: 'Regional Hotspot',   icon: Globe },
  { href: '/persistent', label: 'Persistent Risks',   icon: AlertTriangle },
  { href: '/resolution', label: 'Resolution Status',  icon: CheckCircle2 },
  { href: '/automation', label: 'Automation',         icon: Zap },
  { href: '/report',     label: 'Generate Report',    icon: FileText },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'relative flex flex-col flex-shrink-0 border-r border-white/[0.08] transition-all duration-300 ease-in-out',
        'bg-[var(--bg-card)]',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg gradient-purple flex items-center justify-center glow-purple">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight whitespace-nowrap">EDR Dashboard</p>
            <p className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">SentinelOne Analytics</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Tooltip key={href}>
              <TooltipTrigger render={
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group',
                    collapsed ? 'justify-center' : '',
                    active
                      ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30'
                      : 'text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]'
                  )}
                >
                  <Icon className={cn(
                    'flex-shrink-0 transition-colors',
                    collapsed ? 'w-5 h-5' : 'w-4 h-4',
                    active ? 'text-[var(--accent-purple)]' : 'group-hover:text-[var(--accent-purple)]'
                  )} />
                  {!collapsed && (
                    <span className="whitespace-nowrap font-medium">{label}</span>
                  )}
                  {active && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-purple)]" />
                  )}
                </Link>
              } />
              {collapsed && (
                <TooltipContent side="right" className="bg-[var(--bg-elevated)] border-white/10 text-[var(--text-primary)]">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-muted)]',
            'hover:bg-white/[0.05] hover:text-[var(--text-secondary)] transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
