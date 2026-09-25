'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faUpload,
  faGaugeHigh,
  faBell,
  faCrosshairs,
  faDesktop,
  faGlobe,
  faTriangleExclamation,
  faCircleCheck,
  faBolt,
  faFileLines,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useDashboard } from '@/contexts/DashboardContext';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof faUpload;
}

const INGESTION_ITEMS: NavItem[] = [
  { href: '/upload', label: 'Upload Data', icon: faUpload },
];

const ANALYTICS_ITEMS: NavItem[] = [
  { href: '/overview',   label: 'Executive Summary', icon: faGaugeHigh },
  { href: '/alerts',     label: 'Alerts',            icon: faBell },
  { href: '/threats',    label: 'Threat Analysis',   icon: faCrosshairs },
  { href: '/endpoints',  label: 'Endpoint Summary',  icon: faDesktop },
  { href: '/regional',   label: 'Regional Hotspot',  icon: faGlobe },
  { href: '/persistent', label: 'Persistent Risks',  icon: faTriangleExclamation },
  { href: '/resolution', label: 'Resolution Status', icon: faCircleCheck },
  { href: '/automation', label: 'Automation',        icon: faBolt },
];

const REPORT_ITEMS: NavItem[] = [
  { href: '/report', label: 'Generate Report', icon: faFileLines },
];

export function Sidebar({ className, ...props }: React.ComponentProps<typeof ShadcnSidebar>) {
  const pathname = usePathname();
  const { hasData, edrRows, reportingMonth } = useDashboard();
  const { state, toggleSidebar } = useSidebar();

  const renderMenuItem = (item: NavItem, badgeValue?: string | number) => {
    const active = pathname === item.href;
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          render={<Link href={item.href} />}
          isActive={active}
          tooltip={item.label}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
            active
              ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] font-semibold border border-[var(--accent-purple)]/30 hover:bg-[var(--accent-purple)]/25 hover:text-[var(--accent-purple)]'
              : 'text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]'
          )}
        >
          <FontAwesomeIcon
            icon={item.icon}
            className={cn(
              'w-4 h-4 flex-shrink-0 transition-colors',
              active ? 'text-[var(--accent-purple)]' : 'text-[var(--text-muted)] group-hover:text-[var(--accent-purple)]'
            )}
          />
          <span className="font-medium whitespace-nowrap">{item.label}</span>
          {active && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-purple)] group-data-[collapsible=icon]:hidden" />
          )}
        </SidebarMenuButton>
        {badgeValue !== undefined && (
          <SidebarMenuBadge className="bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 text-[10px] px-1.5 py-0.5">
            {badgeValue}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <ShadcnSidebar
      collapsible="icon"
      className={cn('border-r border-white/[0.08] bg-[var(--bg-card)]', className)}
      {...props}
    >
      {/* Sidebar Header Block */}
      <SidebarHeader className="border-b border-white/[0.06] p-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg gradient-purple flex items-center justify-center glow-purple">
            <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-white" />
          </div>
          <div className="overflow-hidden group-data-[collapsible=icon]:hidden transition-opacity duration-200">
            <p className="text-base font-heading font-medium tracking-wider text-white leading-tight whitespace-nowrap">
              EDR Dashboard
            </p>
            <p className="text-[10px] text-[var(--text-muted)] whitespace-nowrap font-sans">
              SentinelOne Analytics
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Content Block */}
      <SidebarContent className="px-2 py-2 gap-4">
        {/* Ingestion Group */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)] px-2 mb-1">
            Data Ingestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {INGESTION_ITEMS.map((item) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Group */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)] px-2 mb-1">
            Analytics & Detection
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ANALYTICS_ITEMS.map((item) =>
                renderMenuItem(
                  item,
                  item.href === '/alerts' && hasData ? edrRows.length : undefined
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Reporting Group */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)] px-2 mb-1">
            Export & Reports
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {REPORT_ITEMS.map((item) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer Block */}
      <SidebarFooter className="border-t border-white/[0.06] p-2 flex flex-col gap-2">
        {/* Dataset status card (hidden when icon-only) */}
        {hasData ? (
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Active Month
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {reportingMonth}
            </p>
            <p className="text-[10px] text-[var(--text-dim)]">
              {edrRows.length.toLocaleString()} events loaded
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-white/[0.02] border border-dashed border-white/10 p-2.5 text-center group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-[var(--text-muted)]">No data active</p>
            <Link
              href="/upload"
              className="text-[11px] text-[var(--accent-purple)] hover:underline font-medium inline-block mt-0.5"
            >
              Upload dataset
            </Link>
          </div>
        )}

        {/* Collapse toggle block */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => toggleSidebar()}
              tooltip={state === 'collapsed' ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text-secondary)] transition-colors"
            >
              <FontAwesomeIcon
                icon={state === 'collapsed' ? faChevronRight : faChevronLeft}
                className="w-3.5 h-3.5"
              />
              <span className="group-data-[collapsible=icon]:hidden">
                {state === 'collapsed' ? 'Expand' : 'Collapse'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Interactive resize rail block */}
      <SidebarRail />
    </ShadcnSidebar>
  );
}

export const AppSidebar = Sidebar;
