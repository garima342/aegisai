'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Database,
  Shield,
  Sliders,
  BarChart2,
  Check,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F2EB] text-[#221216] selection:bg-[#4A101D] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#E8DFD5] bg-[#F7F2EB]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#380914] text-white flex items-center justify-center shadow-xs">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#2A0913]">
              AegisAI
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B5A5F]">
            <a href="#how-it-works" className="hover:text-[#2A0913] transition">
              How it works
            </a>
            <a href="#what-we-check" className="hover:text-[#2A0913] transition">
              What we check
            </a>
            <Link href="/results" className="hover:text-[#2A0913] transition">
              Sample report
            </Link>
            <a href="#" className="hover:text-[#2A0913] transition">
              Docs
            </a>
          </nav>

          {/* Right Auth CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#2A0913] hover:text-[#4A101D] transition"
            >
              Sign in
            </Link>
            <Link
              href="/systems/new"
              className="px-5 py-2.5 rounded-full bg-[#4A101D] hover:bg-[#5F1525] text-white text-sm font-semibold transition shadow-xs"
            >
              Start an audit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline & Value Proposition */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE8E0] border border-[#E0D5C9] text-xs font-semibold text-[#4A101D]">
            <span className="w-2 h-2 rounded-full bg-[#4A101D] animate-pulse" />
            AI trust, risk and compliance auditor
          </div>

          <h1 className="font-serif text-5xl lg:text-6xl font-bold tracking-tight text-[#2A0913] leading-[1.12]">
            Scan your AI <br />
            before it goes live.
          </h1>

          <p className="text-[#6B5A5F] text-base lg:text-lg leading-relaxed max-w-xl">
            AegisAI audits models and training data for bias, security gaps and weak governance,
            then gives you one risk score and a report an auditor can sign off.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/systems/new"
              className="px-6 py-3 rounded-full bg-[#4A101D] hover:bg-[#5F1525] text-white font-semibold text-sm transition shadow-sm"
            >
              Start an audit
            </Link>
            <Link
              href="/results"
              className="px-6 py-3 rounded-full bg-white hover:bg-[#FDFBF7] text-[#2A0913] border border-[#D5C7B8] font-semibold text-sm transition shadow-2xs"
            >
              View sample report
            </Link>
          </div>

          {/* 3 Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#E8DFD5] max-w-lg">
            <div>
              <p className="font-serif text-3xl font-bold text-[#2A0913]">5</p>
              <p className="text-xs text-[#7A6660] mt-1 font-medium">risk areas covered</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-[#2A0913]">0 to 100</p>
              <p className="text-xs text-[#7A6660] mt-1 font-medium">single risk score</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-[#2A0913]">PDF</p>
              <p className="text-xs text-[#7A6660] mt-1 font-medium">audit-ready report</p>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Mockup Visual with Neural Net */}
        <div className="lg:col-span-5 relative">
          <div className="bg-[#2D0712] rounded-3xl p-6 shadow-2xl border border-[#4E1323] text-white relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono text-[#D8BCC3]">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                hiring_screener_v3.pkl
              </span>
              <span>security: 64%</span>
            </div>

            {/* Stylized Interactive Neural Net */}
            <div className="relative my-6 h-56 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 320 180" fill="none">
                <line x1="40" y1="50" x2="120" y2="35" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="40" y1="90" x2="120" y2="90" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="40" y1="130" x2="120" y2="145" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="120" y1="35" x2="200" y2="45" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="120" y1="90" x2="200" y2="90" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="120" y1="145" x2="200" y2="135" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="200" y1="45" x2="280" y2="90" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="200" y1="90" x2="280" y2="90" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="200" y1="135" x2="280" y2="90" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />

                {/* Vertical illuminated divider */}
                <line x1="160" y1="10" x2="160" y2="170" stroke="#FFFFFF" strokeOpacity="0.3" strokeDasharray="3 3" />

                {/* Highlighted active scan path */}
                <path
                  d="M 40 90 L 120 90 L 200 90 L 280 90"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                />

                <circle cx="40" cy="90" r="5" fill="#FFFFFF" />
                <circle cx="40" cy="90" r="9" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
                <circle cx="120" cy="90" r="4.5" fill="#FFFFFF" />
                <circle cx="200" cy="90" r="4.5" fill="#FFFFFF" />
                <circle cx="280" cy="90" r="5" fill="#FFFFFF" />
              </svg>

              {/* Tooltip 1 */}
              <div className="absolute top-6 left-6 bg-white text-[#2A0913] text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-md border border-[#D5C7B8]">
                gender proxy: 0.71
              </div>

              {/* Tooltip 2 */}
              <div className="absolute bottom-6 right-6 bg-[#4A101D] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-md">
                evasion risk: high
              </div>
            </div>

            {/* Floating Risk Score Callout */}
            <div className="bg-white text-[#2A0913] p-4 rounded-2xl shadow-xl flex items-center justify-between border border-[#E8DFD5]">
              <div>
                <p className="text-[11px] text-[#7A6660] font-semibold uppercase">AI Risk Score</p>
                <p className="font-serif text-3xl font-bold leading-none mt-1">66</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                  High risk
                </span>
              </div>

              <div className="space-y-1.5 text-right">
                <div className="flex items-center gap-2 justify-end text-xs">
                  <span className="text-[#6B5A5F]">Gender proxy</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#4A101D] text-white font-mono text-[10px] font-bold">
                    High
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end text-xs">
                  <span className="text-[#6B5A5F]">Evasion probes</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#4A101D] text-white font-mono text-[10px] font-bold">
                    High
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end text-xs">
                  <span className="text-[#6B5A5F]">Retraining owner</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#DBCBC0] text-[#2A0913] font-mono text-[10px] font-bold">
                    Medium
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Three Lenses on Every Model */}
      <section id="what-we-check" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#E8DFD5]">
        <div className="space-y-3 mb-14">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#2A0913]">
            Three lenses on every model.
          </h2>
          <p className="text-[#6B5A5F] text-sm lg:text-base max-w-2xl leading-relaxed">
            Each scan checks how fairly the model treats people, how easily it can be fooled, and
            whether anyone is accountable for it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Fairness */}
          <div className="bg-white rounded-2xl p-7 border border-[#E8DFD5] shadow-xs flex flex-col justify-between space-y-6">
            <div className="h-44 bg-[#FBF8F4] rounded-xl p-4 flex flex-col justify-between border border-[#F0E8DF]">
              <div className="relative h-28 flex items-end justify-center gap-10">
                {/* 0.80 Threshold Dotted Line */}
                <div className="absolute top-[35%] left-0 right-0 border-b-2 border-dashed border-[#B84E5D]/60 flex justify-end">
                  <span className="text-[10px] font-mono text-[#B84E5D] bg-[#FBF8F4] px-1">
                    0.80 threshold
                  </span>
                </div>

                {/* Men Bar */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#2A0913]">1.00</span>
                  <div className="w-12 bg-[#B89E97] rounded-t-md h-24" />
                  <span className="text-xs text-[#6B5A5F]">Men</span>
                </div>

                {/* Women Bar */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#4A101D]">0.62</span>
                  <div className="w-12 bg-[#4A101D] rounded-t-md h-14" />
                  <span className="text-xs text-[#6B5A5F]">Women</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-[#2A0913]">Fairness</h3>
              <p className="text-xs text-[#6B5A5F] mt-2 leading-relaxed">
                Compares outcomes across groups and flags features that act as proxies.
              </p>
            </div>
          </div>

          {/* Card 2: Security */}
          <div className="bg-white rounded-2xl p-7 border border-[#E8DFD5] shadow-xs flex flex-col justify-between space-y-6">
            <div className="h-44 bg-[#FBF8F4] rounded-xl p-4 flex flex-col justify-center border border-[#F0E8DF] relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 200 120" fill="none">
                {/* Decision boundary dashed line */}
                <line x1="20" y1="100" x2="180" y2="20" stroke="#8C7B80" strokeWidth="1.5" strokeDasharray="4 4" />
                {/* Scatter points */}
                <circle cx="50" cy="80" r="4" fill="#B89E97" />
                <circle cx="70" cy="95" r="4" fill="#B89E97" />
                <circle cx="85" cy="70" r="4.5" fill="#4A101D" />
                <circle cx="130" cy="50" r="4.5" fill="#4A101D" />
                <circle cx="150" cy="65" r="4" fill="#2A0610" />
                <circle cx="170" cy="80" r="4" fill="#2A0610" />

                {/* Adversarial perturbation arrow */}
                <path
                  d="M 85 70 Q 110 50 130 50"
                  stroke="#4A101D"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                  markerEnd="url(#arrow)"
                />
              </svg>
              <span className="text-[10px] text-center font-mono text-[#8C7B80] block mt-1">
                small input change = new decision
              </span>
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-[#2A0913]">Security</h3>
              <p className="text-xs text-[#6B5A5F] mt-2 leading-relaxed">
                Probes the model with small input changes to see if decisions flip.
              </p>
            </div>
          </div>

          {/* Card 3: Governance */}
          <div className="bg-white rounded-2xl p-7 border border-[#E8DFD5] shadow-xs flex flex-col justify-between space-y-6">
            <div className="h-44 bg-[#FBF8F4] rounded-xl p-4 flex items-center justify-between border border-[#F0E8DF]">
              {/* Badge 9/16 */}
              <div className="w-16 h-16 rounded-full border-4 border-[#4A101D] flex items-center justify-center">
                <span className="font-serif text-base font-bold text-[#2A0913]">9/16</span>
              </div>

              {/* Checklist */}
              <div className="space-y-1.5 text-[11px] text-[#2A0913]">
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#4A101D]" />
                  <span>Model owner named</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#4A101D]" />
                  <span>Data retention policy</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#4A101D]" />
                  <span>Bias testing evidence</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#8C7B80]">
                  <span className="w-3.5 h-3.5 rounded-full border border-[#8C7B80] inline-block" />
                  <span>Retraining owner</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-[#2A0913]">Governance</h3>
              <p className="text-xs text-[#6B5A5F] mt-2 leading-relaxed">
                Maps findings to controls so missing owners and evidence stand out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: One Scan, Five Stages */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#E8DFD5]">
        <div className="space-y-3 mb-16">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#2A0913]">
            One scan, five stages.
          </h2>
          <p className="text-[#6B5A5F] text-sm lg:text-base max-w-2xl leading-relaxed">
            Describe your AI system, upload the model and data, and AegisAI runs each stage in order.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative">
          {/* Stage 1 */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#4A101D] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-mono text-[#8C7B80]">Stage 1</p>
            <h4 className="font-serif text-lg font-bold text-[#2A0913]">Describe the system</h4>
            <p className="text-xs text-[#6B5A5F] leading-relaxed">
              Purpose, users, data sources and who is affected.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#4A101D] text-white flex items-center justify-center shadow-xs">
              <Database className="w-6 h-6" />
            </div>
            <p className="text-xs font-mono text-[#8C7B80]">Stage 2</p>
            <h4 className="font-serif text-lg font-bold text-[#2A0913]">Check data and model</h4>
            <p className="text-xs text-[#6B5A5F] leading-relaxed">
              Missing values, drift, imbalance and unfair outcomes between groups.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#4A101D] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <p className="text-xs font-mono text-[#8C7B80]">Stage 3</p>
            <h4 className="font-serif text-lg font-bold text-[#2A0913]">
              Test security and explainability
            </h4>
            <p className="text-xs text-[#6B5A5F] leading-relaxed">
              Adversarial probes, plus SHAP to show why the model decides.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#4A101D] text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-6 h-6" />
            </div>
            <p className="text-xs font-mono text-[#8C7B80]">Stage 4</p>
            <h4 className="font-serif text-lg font-bold text-[#2A0913]">Map to governance</h4>
            <p className="text-xs text-[#6B5A5F] leading-relaxed">
              Match findings to controls so gaps are visible to compliance teams.
            </p>
          </div>

          {/* Stage 5 */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#4A101D] text-white flex items-center justify-center shadow-xs">
              <BarChart2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-mono text-[#8C7B80]">Stage 5</p>
            <h4 className="font-serif text-lg font-bold text-[#2A0913]">Score and report</h4>
            <p className="text-xs text-[#6B5A5F] leading-relaxed">
              One risk score, a ranked findings list and a downloadable report.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Deep Maroon Container - Every finding comes with evidence and a fix */}
      <section className="bg-[#380914] text-white py-24 my-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Every finding comes with evidence and a fix.
            </h2>
            <p className="text-[#E5CBD2] text-sm lg:text-base leading-relaxed">
              No vague warnings. Each issue shows where it was found, how serious it is and what to
              change.
            </p>

            <div className="space-y-3 pt-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>Ranked by severity</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>Tied to the exact feature or test</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>Expected score change after the fix</span>
              </div>
            </div>
          </div>

          {/* Right Column: Mini Report Window Mockup matching Figma */}
          <div className="lg:col-span-7 bg-[#F7F2EB] text-[#2A0913] rounded-3xl p-6 shadow-2xl border border-white/20">
            {/* Window title bar */}
            <div className="flex items-center gap-2 pb-4 border-b border-[#E8DFD5] text-xs font-mono text-[#8C7B80]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="ml-2">AegisAI Hiring Screener v3 Report</span>
            </div>

            {/* Matrix & Findings Preview */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-bold text-[#2A0913]">
                  Outcomes by group
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#4A101D] text-white">
                  Score 66 &bull; High risk
                </span>
              </div>

              {/* Heatmap Matrix */}
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[#8C7B80]">
                      <th className="py-1.5 px-2"></th>
                      <th className="py-1.5 px-2 text-center">Selection rate</th>
                      <th className="py-1.5 px-2 text-center">Missed good hires</th>
                      <th className="py-1.5 px-2 text-center">Disparate impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E8DF]">
                    <tr>
                      <td className="py-1.5 px-2 font-medium">Men</td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#DBCBC0] font-mono">0.41</span></td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#EFE8E0] font-mono">0.12</span></td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#EFE8E0] font-mono font-bold">1.00</span></td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-medium">Women</td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#4A101D] text-white font-mono font-bold">0.25</span></td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#4A101D] text-white font-mono font-bold">0.27</span></td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#4A101D] text-white font-mono font-bold">0.62</span></td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-medium">Age under 30</td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#DBCBC0] font-mono">0.36</span></td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#EFE8E0] font-mono">0.16</span></td>
                      <td className="py-1.5 px-2 text-center"><span className="px-2 py-0.5 rounded bg-[#EFE8E0] font-mono font-bold">0.88</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Finding Banner */}
              <div className="p-3 bg-white rounded-xl border border-[#E8DFD5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#4A101D] text-white font-bold text-[10px]">
                    High
                  </span>
                  <span className="font-bold text-[#2A0913]">
                    Gender proxy: employment_gap_months
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#4A101D]">
                  Fix: reweigh samples, risk 66 &rarr; 51
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center space-y-6">
        <h2 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#2A0913]">
          See where your AI stands today.
        </h2>
        <div>
          <Link
            href="/systems/new"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#4A101D] hover:bg-[#5F1525] text-white text-sm font-semibold transition shadow-md"
          >
            Start an audit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8DFD5] py-8 bg-[#F7F2EB]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C7B80]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#380914] text-white flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="font-serif text-sm font-bold text-[#2A0913]">AegisAI</span>
          </div>

          <p>AI Trust, Risk and Compliance Auditor</p>
        </div>
      </footer>
    </div>
  );
}
