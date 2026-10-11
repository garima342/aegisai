'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  systemName: string;
  domain: string;
  runDate: string;
  riskScore: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  pages: number;
  fileSize: string;
  href: string;
  summary: string;
}

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const reports: ReportItem[] = [
    {
      id: 'rep-01',
      title: 'Pre-Deployment AI Audit & EU AI Act Conformity Report',
      systemName: 'Hiring Screener v3',
      domain: 'HR recruitment',
      runDate: '8 Oct 2026, 10:05',
      riskScore: 66,
      riskLevel: 'High',
      pages: 42,
      fileSize: '3.4 MB',
      href: '/results',
      summary:
        'Full compliance assessment against EU AI Act Annex III (Employment & Recruitment). Highlights 2 critical gender and demographic proxy vulnerabilities requiring reweighing.',
    },
    {
      id: 'rep-02',
      title: 'Adversarial Robustness & LLM Red-Teaming Report',
      systemName: 'Support Chatbot',
      domain: 'Customer service',
      runDate: 'Yesterday, 16:30',
      riskScore: 73,
      riskLevel: 'High',
      pages: 28,
      fileSize: '2.1 MB',
      href: '/systems',
      summary:
        'Red-team evaluation against OWASP Top 10 for LLMs. Identified prompt injection vulnerabilities that bypass standard system prompt guardrails in customer ticket resolution.',
    },
    {
      id: 'rep-03',
      title: 'Algorithmic Fairness & Disparate Impact Evaluation',
      systemName: 'Loan Approval Model',
      domain: 'Finance',
      runDate: '3 Oct 2026, 14:15',
      riskScore: 48,
      riskLevel: 'Medium',
      pages: 36,
      fileSize: '4.8 MB',
      href: '/systems',
      summary:
        'Fairness audit measuring Equalized Odds, Demographic Parity, and predictive parity across sensitive age and regional zip code brackets.',
    },
    {
      id: 'rep-04',
      title: 'Data Drift & Model Stability Health Certification',
      systemName: 'Churn Predictor',
      domain: 'Marketing',
      runDate: '29 Sep 2026, 09:20',
      riskScore: 27,
      riskLevel: 'Low',
      pages: 18,
      fileSize: '1.6 MB',
      href: '/systems',
      summary:
        'Continuous monitoring review showing benign feature drift (< 3.2% PSI) and stable decision calibration across the preceding 90 days.',
    },
    {
      id: 'rep-05',
      title: 'Pre-Flight Governance & Technical Documentation Review',
      systemName: 'Fraud Detector',
      domain: 'Finance',
      runDate: '24 Sep 2026, 11:45',
      riskScore: 39,
      riskLevel: 'Low',
      pages: 24,
      fileSize: '2.9 MB',
      href: '/systems',
      summary:
        'Verification of model cards, training provenance, data lineage logs, and technical risk control assignments for regulatory filing.',
    },
  ];

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.systemName.toLowerCase().includes(search.toLowerCase()) ||
      r.domain.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'high') return r.riskLevel === 'High';
    if (filter === 'low') return r.riskLevel === 'Low' || r.riskLevel === 'Medium';
    return true;
  });

  const handleDownload = (report: ReportItem, format: 'PDF' | 'JSON') => {
    // Generate text/json export download for user convenience
    const content = JSON.stringify(
      {
        reportId: report.id,
        system: report.systemName,
        title: report.title,
        riskScore: report.riskScore,
        riskLevel: report.riskLevel,
        generatedAt: report.runDate,
        summary: report.summary,
        auditor: 'Garima Sethi (Workspace Owner)',
        framework: 'AegisAI Trust Engine v1.0 / EU AI Act & NIST AI RMF',
      },
      null,
      2
    );

    const blob = new Blob([content], {
      type: format === 'JSON' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.systemName.replace(/\s+/g, '_')}_Audit_Report.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadToast(`Downloaded ${report.systemName} Audit Report (${format})`);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  return (
    <div className="space-y-8 max-w-[1360px] mx-auto pb-16">
      {/* Toast Alert */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#380914] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#4A101D] flex items-center gap-3 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#2A0913]">
            Audit Reports
          </h1>
          <p className="text-[#6B5A5F] text-sm mt-1">
            Export auditor-ready conformity reports, technical documentation, and compliance summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#2A0913] bg-white border border-[#D5C7B8] hover:bg-[#FDFBF7] rounded-xl transition shadow-2xs"
          >
            <FileText className="w-4 h-4 text-[#4A101D]" />
            View latest audit
          </Link>
          <Link
            href="/systems/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#4A101D] hover:bg-[#5F1525] rounded-xl transition shadow-xs"
          >
            Run new scan
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs">
          <p className="text-xs font-medium text-[#6B5A5F]">Total reports</p>
          <p className="text-3xl font-serif font-bold text-[#2A0913] mt-2">14</p>
          <p className="text-[11px] text-[#4A101D] font-semibold mt-1">Across 8 registered AI models</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs">
          <p className="text-xs font-medium text-[#6B5A5F]">High-risk warnings</p>
          <p className="text-3xl font-serif font-bold text-[#4A101D] mt-2">2</p>
          <p className="text-[11px] text-[#6B5A5F] mt-1">Requires remediation before sign-off</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs">
          <p className="text-xs font-medium text-[#6B5A5F]">Standard compliance</p>
          <p className="text-3xl font-serif font-bold text-[#2A0913] mt-2">EU AI Act</p>
          <p className="text-[11px] text-[#6B5A5F] mt-1">Annex III High-Risk conformity check</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs">
          <p className="text-xs font-medium text-[#6B5A5F]">Average audit score</p>
          <p className="text-3xl font-serif font-bold text-[#2A0913] mt-2">58</p>
          <p className="text-[11px] text-[#6B5A5F] mt-1">Target threshold: &lt; 55</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B80]" />
          <input
            type="text"
            placeholder="Search reports by system or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#D5C7B8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A101D]/20 focus:border-[#4A101D] text-[#2A0913] shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-[#4A101D] text-white shadow-xs'
                : 'bg-white border border-[#D5C7B8] text-[#6B5A5F] hover:bg-[#FAF6F0]'
            }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('high')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === 'high'
                ? 'bg-[#4A101D] text-white shadow-xs'
                : 'bg-white border border-[#D5C7B8] text-[#6B5A5F] hover:bg-[#FAF6F0]'
            }`}
          >
            High Risk Attention
          </button>
          <button
            type="button"
            onClick={() => setFilter('low')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === 'low'
                ? 'bg-[#4A101D] text-white shadow-xs'
                : 'bg-white border border-[#D5C7B8] text-[#6B5A5F] hover:bg-[#FAF6F0]'
            }`}
          >
            Low / Moderate Risk
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs hover:border-[#D5C7B8] transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-serif text-lg font-bold text-[#2A0913]">
                  {report.systemName}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EFE8E0] text-[#6B5A5F] font-medium">
                  {report.domain}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    report.riskLevel === 'High'
                      ? 'bg-[#4A101D] text-white'
                      : report.riskLevel === 'Medium'
                      ? 'bg-[#DBCBC0] text-[#2A0913]'
                      : 'bg-[#E8DFD5] text-[#2A0913]'
                  }`}
                >
                  Score: {report.riskScore} &bull; {report.riskLevel} risk
                </span>
              </div>

              <h3 className="text-sm font-semibold text-[#2A0913]">{report.title}</h3>
              <p className="text-xs text-[#6B5A5F] leading-relaxed">{report.summary}</p>

              <div className="flex items-center gap-4 text-[11px] text-[#8C7B80] pt-1">
                <span>{report.runDate}</span>
                <span>&bull;</span>
                <span>{report.pages} pages</span>
                <span>&bull;</span>
                <span>{report.fileSize}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href={report.href}
                className="px-3.5 py-2 text-xs font-semibold text-[#2A0913] bg-white border border-[#D5C7B8] hover:bg-[#FAF6F0] rounded-xl transition inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>View online</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => handleDownload(report, 'JSON')}
                className="px-3.5 py-2 text-xs font-semibold text-[#2A0913] bg-white border border-[#D5C7B8] hover:bg-[#FAF6F0] rounded-xl transition inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload(report, 'PDF')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4A101D] hover:bg-[#5F1525] rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E8DFD5]">
            <FileText className="w-10 h-10 text-[#8C7B80] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#2A0913]">No reports matched your query</h3>
            <p className="text-xs text-[#6B5A5F] mt-1">Try adjusting your search terms or filters above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
