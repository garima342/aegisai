import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AegisAI - AI Trust, Risk & Compliance Auditor',
  description: 'Audit AI/ML systems pre-deployment and output audit-ready risk reports.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="bg-[#F7F2EB] text-[#221216] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

