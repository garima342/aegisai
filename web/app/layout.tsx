import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AegisAI - AI Trust, Risk & Compliance Auditor",
  description: "Audit AI/ML systems pre-deployment and output a risk score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex h-screen overflow-hidden`}>
        {/* Sidebar */}
        <aside className="w-64 bg-[#5C1A2B] text-white flex flex-col h-full shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tight">AegisAI</h1>
            <p className="text-sm opacity-80 mt-1">Trust & Compliance</p>
          </div>
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link href="/" className="block px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition">Dashboard</Link>
            <Link href="/systems" className="block px-4 py-2 rounded hover:bg-white/10 transition">Systems</Link>
            <Link href="/assessments" className="block px-4 py-2 rounded hover:bg-white/10 transition">Assessments</Link>
            <Link href="/reports" className="block px-4 py-2 rounded hover:bg-white/10 transition">Reports</Link>
            <Link href="/health" className="block px-4 py-2 rounded hover:bg-white/10 transition">Health Status</Link>
          </nav>
          <div className="p-4 border-t border-white/10 text-xs opacity-70">
            AegisAI Core v1.0
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
