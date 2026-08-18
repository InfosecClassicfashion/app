'use client';

import React, { useState, useEffect } from 'react';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export function RootShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  // Default dark on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <DashboardProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Header theme={theme} onToggleTheme={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="max-w-[1400px] mx-auto px-6 md:px-8 w-full page-enter">
                {children}
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </DashboardProvider>
  );
}
