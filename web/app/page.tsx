'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Audit data matching the design mockup exactly
  const recentAudits = [
    {
      id: 'sys-hr-recruitment-01',
      name: 'Hiring Screener v3',
      domain: 'HR recruitment',
      status: 'Complete',
      riskScore: 66,
      highFindings: 2,
      lastScan: 'Today, 10:05',
      href: '/systems/sys-hr-recruitment-01',
    },
    {
      id: 'asmt-resume-parser',
      name: 'Resume Parser v2',
      domain: 'HR recruitment',
      status: 'Scanning 64%',
      riskScore: null,
      highFindings: null,
      lastScan: 'Running now',
      href: '/systems/sys-hr-recruitment-01',
    },
    {
      id: 'sys-cs-assistant-02',
      name: 'Support Chatbot',
      domain: 'Customer service',
      status: 'Complete',
      riskScore: 73,
      highFindings: 3,
      lastScan: 'Yesterday',
      href: '/systems/sys-cs-assistant-02',
    },
    {
      id: 'sys-loan-03',
      name: 'Loan Approval Model',
      domain: 'Finance',
      status: 'Complete',
      riskScore: 48,
      highFindings: 1,
      lastScan: '3 Oct',
      href: '/systems',
    },
    {
      id: 'sys-churn-04',
      name: 'Churn Predictor',
      domain: 'Marketing',
      status: 'Complete',
      riskScore: 27,
      highFindings: 0,
      lastScan: '29 Sep',
      href: '/systems',
    },
    {
      id: 'sys-fraud-05',
      name: 'Fraud Detector',
      domain: 'Finance',
      status: 'Complete',
      riskScore: 39,
      highFindings: 0,
      lastScan: '24 Sep',
      href: '/systems',
    },
  ];

  const filteredAudits = recentAudits.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1360px] mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#2A0913]">
            Dashboard
          </h1>
          <p className="text-[#6B5A5F] text-sm mt-1">
            Welcome back, Garima. 8 AI systems monitored.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B80]" />
            <input
              type="text"
              placeholder="Search systems and findings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white/90 border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4A101D]/20 focus:border-[#4A101D] transition shadow-2xs"
            />
          </div>

          <Link
            href="/systems/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#4A101D] hover:bg-[#5F1525] rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New audit
          </Link>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <p className="text-xs font-medium text-[#6B5A5F]">Audits run</p>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-4xl font-bold font-serif text-[#2A0913]">24</span>
            {/* Sparkline curve */}
            <svg className="w-20 h-7 text-[#4A101D]" viewBox="0 0 80 28" fill="none">
              <path
                d="M 2 24 Q 20 18 35 22 T 60 14 T 78 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="78" cy="4" r="3" fill="currentColor" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#4A101D] mt-3">+6 this month</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <p className="text-xs font-medium text-[#6B5A5F]">Average risk score</p>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-4xl font-bold font-serif text-[#2A0913]">58</span>
            <svg className="w-20 h-7 text-[#4A101D]" viewBox="0 0 80 28" fill="none">
              <path
                d="M 2 4 Q 25 12 45 15 T 78 22"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="78" cy="22" r="3" fill="currentColor" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#4A101D] mt-3">−13 points since May</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <p className="text-xs font-medium text-[#6B5A5F]">Open high findings</p>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-4xl font-bold font-serif text-[#2A0913]">6</span>
            <svg className="w-20 h-7 text-[#4A101D]" viewBox="0 0 80 28" fill="none">
              <path
                d="M 2 8 Q 30 10 50 16 T 78 24"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="78" cy="24" r="3" fill="currentColor" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#4A101D] mt-3">−5 since last month</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <p className="text-xs font-medium text-[#6B5A5F]">Controls covered</p>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-4xl font-bold font-serif text-[#2A0913]">72%</span>
            <svg className="w-20 h-7 text-[#4A101D]" viewBox="0 0 80 28" fill="none">
              <path
                d="M 2 24 Q 25 20 45 14 T 78 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="78" cy="6" r="3" fill="currentColor" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#4A101D] mt-3">+9% this quarter</p>
        </div>
      </div>

      {/* Middle Section: Average Risk Score Chart & Scanning Now Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Average Risk Score Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-7 border border-[#E8DFD5] shadow-xs space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#2A0913]">
              Average risk score
            </h2>
            <p className="text-xs text-[#6B5A5F] mt-0.5">
              Across all audited systems. Lower is better.
            </p>
          </div>

          {/* Line Chart Component */}
          <div className="relative pt-4 pb-2">
            <div className="h-64 w-full relative flex flex-col justify-between">
              {/* Y Axis Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] font-mono text-[#A8989D]">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right">70</span>
                  <div className="flex-1 border-b border-[#F0E8DF]" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right">60</span>
                  <div className="flex-1 border-b border-[#F0E8DF]" />
                </div>
                <div className="flex items-center gap-3 relative">
                  <span className="w-6 text-right">50</span>
                  <div className="flex-1 border-b border-[#F0E8DF]" />
                </div>
              </div>

              {/* SVG Trend Line with Area Gradient */}
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 240">
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4A101D" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4A101D" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                <path
                  d="M 60 40 L 160 55 L 260 85 L 360 110 L 460 145 L 560 165 L 560 220 L 60 220 Z"
                  fill="url(#scoreGradient)"
                />

                {/* Target Threshold Line at 55 */}
                <line
                  x1="60"
                  y1="185"
                  x2="560"
                  y2="185"
                  stroke="#B84E5D"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x="560"
                  y="204"
                  textAnchor="end"
                  className="text-[11px] font-mono fill-[#B84E5D]"
                >
                  target below 55
                </text>

                {/* Solid Trend Curve */}
                <path
                  d="M 60 40 L 160 55 L 260 85 L 360 110 L 460 145 L 560 165"
                  stroke="#4A101D"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Points with numeric labels */}
                {[
                  { cx: 60, cy: 40, val: '71' },
                  { cx: 160, cy: 55, val: '69' },
                  { cx: 260, cy: 85, val: '66' },
                  { cx: 360, cy: 110, val: '63' },
                  { cx: 460, cy: 145, val: '60' },
                  { cx: 560, cy: 165, val: '58' },
                ].map((pt) => (
                  <g key={pt.val}>
                    <text
                      x={pt.cx}
                      y={pt.cy - 12}
                      textAnchor="middle"
                      className="text-xs font-bold font-mono fill-[#2A0913]"
                    >
                      {pt.val}
                    </text>
                    <circle
                      cx={pt.cx}
                      cy={pt.cy}
                      r="5"
                      fill="#FFFFFF"
                      stroke="#4A101D"
                      strokeWidth="3"
                    />
                  </g>
                ))}
              </svg>

              {/* X Axis Labels */}
              <div className="absolute bottom-0 left-9 right-4 flex justify-between text-xs text-[#6B5A5F] font-medium pt-2">
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right (1 col): Scanning Now Card */}
        <div className="bg-[#380914] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between border border-[#4E1323]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                Scanning now
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                live
              </span>
            </div>
            <p className="text-xs font-mono text-[#D8BCC3] mt-0.5">
              resume_parser_v2.pkl
            </p>

            {/* Neural Net Diagram Graphic */}
            <div className="my-5 p-3 rounded-xl bg-black/25 border border-white/10 relative h-36 flex flex-col justify-between">
              <svg className="w-full h-full" viewBox="0 0 280 110" fill="none">
                {/* Connections */}
                <path d="M 30 55 L 90 25 M 30 55 L 90 55 M 30 55 L 90 85" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />
                <path d="M 90 25 L 160 35 M 90 55 L 160 55 M 90 85 L 160 75" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />
                <path d="M 160 35 L 240 55 M 160 55 L 240 55 M 160 75 L 240 55" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />

                {/* Highlighted active scan line */}
                <path
                  d="M 30 55 L 90 55 L 160 55 L 240 55"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />

                {/* Layer 1 Nodes (Inputs) */}
                <circle cx="30" cy="55" r="5" fill="#FFFFFF" />
                <circle cx="30" cy="55" r="9" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.6" />

                {/* Layer 2 Nodes (Features) */}
                <circle cx="90" cy="25" r="4" fill="#E5CBD2" fillOpacity="0.7" />
                <circle cx="90" cy="55" r="4" fill="#FFFFFF" />
                <circle cx="90" cy="85" r="4" fill="#E5CBD2" fillOpacity="0.7" />

                {/* Layer 3 Nodes (Model) */}
                <circle cx="160" cy="35" r="4" fill="#E5CBD2" fillOpacity="0.7" />
                <circle cx="160" cy="55" r="4" fill="#FFFFFF" />
                <circle cx="160" cy="75" r="4" fill="#E5CBD2" fillOpacity="0.7" />

                {/* Layer 4 Nodes (Decision) */}
                <circle cx="240" cy="55" r="5" fill="#FFFFFF" />
                <circle cx="240" cy="55" r="8" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.5" />
              </svg>

              <div className="flex justify-between text-[10px] font-mono text-[#D8BCC3] px-2 border-t border-white/10 pt-1">
                <span>inputs</span>
                <span>features</span>
                <span>model</span>
                <span>decision</span>
              </div>
            </div>

            {/* Stage Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#E5CBD2]">
                <span>Security stage</span>
                <span className="font-mono font-bold text-white">64%</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-[64%]" />
              </div>
            </div>

            {/* Checklist */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-white">
                <div className="w-4 h-4 rounded-full bg-white text-[#380914] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-white text-[#380914]" />
                </div>
                <span>Intake</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <div className="w-4 h-4 rounded-full bg-white text-[#380914] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-white text-[#380914]" />
                </div>
                <span>Data and model</span>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span>Security</span>
              </div>
              <div className="flex items-center gap-2 text-[#A88A92]">
                <div className="w-4 h-4 rounded-full border border-white/30 shrink-0" />
                <span>Governance</span>
              </div>
              <div className="flex items-center gap-2 text-[#A88A92]">
                <div className="w-4 h-4 rounded-full border border-white/30 shrink-0" />
                <span>Score and report</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audits & Risk Level Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Recent Audits Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-serif text-2xl font-bold text-[#2A0913]">
              Recent audits
            </h2>
            <Link
              href="/systems"
              className="text-xs font-semibold text-[#4A101D] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#E8DFD5]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#4A101D] text-white text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">System</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk score</th>
                  <th className="py-3 px-4">High</th>
                  <th className="py-3 px-4">Last scan</th>
                  <th className="py-3 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DF] text-xs">
                {filteredAudits.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAF6F0] transition group cursor-pointer"
                  >
                    {/* System Name & Domain */}
                    <td className="py-3 px-4">
                      <Link href={item.href} className="block">
                        <span className="font-bold text-[#2A0913] group-hover:text-[#4A101D]">
                          {item.name}
                        </span>
                        <span className="block text-[11px] text-[#6B5A5F]">
                          {item.domain}
                        </span>
                      </Link>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4">
                      {item.status.includes('Scanning') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-[#4A101D] text-white text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          {item.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium bg-[#EFE8E0] text-[#4A2D35] text-[11px]">
                          {item.status}
                        </span>
                      )}
                    </td>

                    {/* Risk Score Pill & Bar */}
                    <td className="py-3 px-4">
                      {item.riskScore !== null ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-1.5 rounded-full ${
                              item.riskScore > 60
                                ? 'bg-[#4A101D]'
                                : item.riskScore > 40
                                ? 'bg-[#B07D62]'
                                : 'bg-[#D4A373]'
                            }`}
                          />
                          <span className="font-serif font-bold text-sm text-[#2A0913]">
                            {item.riskScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#8C7B80] italic">In progress</span>
                      )}
                    </td>

                    {/* High Findings Badge */}
                    <td className="py-3 px-4">
                      {item.highFindings !== null ? (
                        item.highFindings > 0 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#4A101D] text-white font-mono font-bold text-[11px]">
                            {item.highFindings}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#E8DFD5] text-[#6B5A5F] font-mono text-[11px]">
                            0
                          </span>
                        )
                      ) : (
                        <span className="text-[#8C7B80]">−</span>
                      )}
                    </td>

                    {/* Last Scan */}
                    <td className="py-3 px-4 text-[#6B5A5F]">
                      {item.lastScan}
                    </td>

                    {/* Chevron */}
                    <td className="py-3 px-3 text-right">
                      <Link href={item.href}>
                        <ChevronRight className="w-4 h-4 text-[#8C7B80] group-hover:text-[#4A101D] inline-block transition" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 col): Systems by Risk Level & Top Open Findings */}
        <div className="space-y-6">
          {/* Systems by Risk Level Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#2A0913]">
              Systems by risk level
            </h2>

            <div className="flex items-center justify-between pt-2">
              {/* Donut Chart */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#EFE8E0"
                    strokeWidth="3.8"
                  />
                  {/* Segment: High (25% = 2/8) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4A101D"
                    strokeWidth="4"
                    strokeDasharray="25, 100"
                    strokeDashoffset="0"
                  />
                  {/* Segment: Medium (37.5% = 3/8) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#B07D62"
                    strokeWidth="4"
                    strokeDasharray="37.5, 100"
                    strokeDashoffset="-25"
                  />
                  {/* Segment: Low (37.5% = 3/8) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E0D1C1"
                    strokeWidth="4"
                    strokeDasharray="37.5, 100"
                    strokeDashoffset="-62.5"
                  />
                </svg>

                {/* Donut Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-serif text-2xl font-bold text-[#2A0913] leading-none">
                    8
                  </span>
                  <span className="text-[10px] text-[#6B5A5F] mt-0.5">systems</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-xs bg-[#4A101D]" />
                  <span className="text-[#6B5A5F] w-14">High</span>
                  <span className="font-bold font-mono text-[#2A0913]">2</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-xs bg-[#B07D62]" />
                  <span className="text-[#6B5A5F] w-14">Medium</span>
                  <span className="font-bold font-mono text-[#2A0913]">3</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-xs bg-[#E0D1C1]" />
                  <span className="text-[#6B5A5F] w-14">Low</span>
                  <span className="font-bold font-mono text-[#2A0913]">3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Open Findings Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
            <h2 className="font-serif text-2xl font-bold text-[#2A0913]">
              Top open findings
            </h2>

            <div className="space-y-3.5 text-xs">
              {/* Finding 1 */}
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded-md bg-[#4A101D] text-white font-bold text-[10px] shrink-0 mt-0.5">
                  High
                </span>
                <div>
                  <p className="font-bold text-[#2A0913]">
                    Gender proxy: employment_gap_months
                  </p>
                  <p className="text-[11px] text-[#6B5A5F]">Hiring Screener v3</p>
                </div>
              </div>

              {/* Finding 2 */}
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded-md bg-[#4A101D] text-white font-bold text-[10px] shrink-0 mt-0.5">
                  High
                </span>
                <div>
                  <p className="font-bold text-[#2A0913]">
                    Prompt injection bypasses refusal rules
                  </p>
                  <p className="text-[11px] text-[#6B5A5F]">Support Chatbot</p>
                </div>
              </div>

              {/* Finding 3 */}
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded-md bg-[#4A101D] text-white font-bold text-[10px] shrink-0 mt-0.5">
                  High
                </span>
                <div>
                  <p className="font-bold text-[#2A0913]">
                    Model flips decision under small input changes
                  </p>
                  <p className="text-[11px] text-[#6B5A5F]">Hiring Screener v3</p>
                </div>
              </div>

              {/* Finding 4 */}
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded-md bg-[#DBCBC0] text-[#3D141E] font-bold text-[10px] shrink-0 mt-0.5">
                  Medium
                </span>
                <div>
                  <p className="font-bold text-[#2A0913]">
                    No named owner for model retraining
                  </p>
                  <p className="text-[11px] text-[#6B5A5F]">Loan Approval Model</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
