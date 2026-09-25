'use client';

import React, { useState, useEffect } from 'react';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export function RootShell({ children }: { children: React.ReactNode }) {
  // Synchronously initialize from localStorage on client, default to 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') return saved;
      } catch {
        // Fallback to light
      }
    }
    return 'light';
  });

  // Keep theme class and localStorage in sync whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('theme', theme);
    } catch {
      // localStorage may not be available
    }
  }, [theme]);

  return (
    <DashboardProvider>
      <TooltipProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-base)]">
            <Sidebar />
            <SidebarInset className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[var(--bg-base)]">
              <Header theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
              <main className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-6 w-full page-enter">
                  {children}
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </DashboardProvider>
  );
}
