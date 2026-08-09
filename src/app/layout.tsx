import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { RootShell } from '@/components/layout/RootShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'EDR Monthly Report Dashboard',
  description: 'SentinelOne EDR analytics dashboard — monthly threat reports, MoM analysis, PDF & DOCX export.',
  keywords: ['EDR', 'SentinelOne', 'cybersecurity', 'dashboard', 'threat analysis'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
