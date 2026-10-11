'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Scale,
  Lock,
  ShieldCheck,
  Database,
  Download,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { AiSystem } from '@/lib/types/system';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function SystemDetailContent({ id }: { id: string }) {
  const [system, setSystem] = useState<AiSystem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFindingTab, setActiveFindingTab] = useState<'all' | 'fairness' | 'security' | 'governance' | 'data'>('all');
  const [expandedFinding, setExpandedFinding] = useState<string | null>('F-014');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const fetchSystem = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      try {
        const res = await fetch(`/api/systems/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('AI System not found');
          }
          throw new Error('Failed to load system details');
        }
        const json = await res.json();
        if (!isCancelled) {
          setSystem(json.data);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Error loading system';
          setError(msg);
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [id, reloadTrigger]);

  if (loading) {
    return <LoadingSpinner label="Loading audit findings & risk metrics..." />;
  }

  if (error || !system) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-rose-50 text-rose-600 mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-[#2A0913]">{error || 'System Not Found'}</h2>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/systems"
            className="px-4 py-2 bg-white border border-[#E8DFD5] text-[#2A0913] rounded-xl text-sm font-semibold transition"
          >
            Back to Systems
          </Link>
          <button
            type="button"
            onClick={fetchSystem}
            className="px-4 py-2 bg-[#4A101D] text-white hover:bg-[#5F1525] rounded-xl text-sm font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Findings list matching the design mockup exactly
  const allFindings = [
    {
      id: 'F-014',
      severity: 'High',
      title: 'Gender proxy: employment_gap_months',
      details: 'Correlation with gender 0.71',
      area: 'fairness',
      checkId: 'F-014',
      scoreImpact: '−15 points',
      recommendation:
        'Remove the feature or reweigh training samples. Selection rate for women moves from 0.62 to about 0.84 and the risk score drops from 66 to 51.',
    },
    {
      id: 'S-007',
      severity: 'High',
      title: 'Model flips decision under small input changes',
      details: '38% of 500 evasion probes succeeded',
      area: 'security',
      checkId: 'S-007',
      scoreImpact: '−9 points',
      recommendation:
        'Incorporate adversarial data augmentation during training to stabilize decision boundaries around candidate resume qualification thresholds.',
    },
    {
      id: 'G-011',
      severity: 'Medium',
      title: 'No named owner for model retraining',
      details: 'Control GV-04 has no evidence attached',
      area: 'governance',
      checkId: 'G-011',
      scoreImpact: '−5 points',
      recommendation:
        'Assign a named ML engineering owner and document the scheduled model drift retraining trigger protocol in the technical governance register.',
    },
    {
      id: 'F-016',
      severity: 'Medium',
      title: 'Postcode acts as a proxy for ethnicity',
      details: 'Correlation 0.44, Impact 0.11',
      area: 'fairness',
      checkId: 'F-016',
      scoreImpact: '−4 points',
      recommendation:
        'Exclude geographic postcode fields or map to higher-level regional aggregates to prevent geographic ethnic bias encoding.',
    },
    {
      id: 'D-003',
      severity: 'Low',
      title: '4.2% missing values in referral_source',
      details: 'Imputed with the median',
      area: 'data',
      checkId: 'D-003',
      scoreImpact: '−1 point',
      recommendation:
        'Create an explicit "Direct Applicant" category rather than numerical imputation for missing referral values.',
    },
  ];

  const filteredFindings = allFindings.filter((f) => {
    if (activeFindingTab === 'all') return true;
    return f.area === activeFindingTab;
  });

  return (
    <div className="space-y-7 max-w-[1360px] mx-auto pb-16">
      {/* Top Header Bar matching Figma mockup */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#2A0913]">
            {system.name === 'HR Recruitment AI' ? 'Hiring Screener v3' : system.name || 'Hiring Screener v3'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4A101D] text-white">
              Audit complete
            </span>
            <span className="text-xs text-[#6B5A5F] font-mono">
              run 04 &bull; 8 Oct 2026 &bull; 3m 12s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold text-[#2A0913] bg-white border border-[#D5C7B8] hover:bg-[#FDFBF7] rounded-xl transition shadow-2xs"
          >
            Re-run audit
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#4A101D] hover:bg-[#5F1525] rounded-xl transition shadow-xs"
          >
            Download report (PDF)
          </button>
        </div>
      </div>

      {/* 5 Stages Progress Bar with Solid Connected Lines */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFD5] shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#2A0913]">
          <CheckCircle2 className="w-4 h-4 text-[#4A101D] fill-white" />
          <span className="font-semibold">Intake</span>
          <span className="text-[#8C7B80] font-mono">0.4s</span>
        </div>
        <div className="flex-1 h-0.5 mx-3 bg-[#D5C7B8]" />

        <div className="flex items-center gap-2 text-[#2A0913]">
          <CheckCircle2 className="w-4 h-4 text-[#4A101D] fill-white" />
          <span className="font-semibold">Data and model</span>
          <span className="text-[#8C7B80] font-mono">41s</span>
        </div>
        <div className="flex-1 h-0.5 mx-3 bg-[#D5C7B8]" />

        <div className="flex items-center gap-2 text-[#2A0913]">
          <CheckCircle2 className="w-4 h-4 text-[#4A101D] fill-white" />
          <span className="font-semibold">Security</span>
          <span className="text-[#8C7B80] font-mono">1m 38s</span>
        </div>
        <div className="flex-1 h-0.5 mx-3 bg-[#D5C7B8]" />

        <div className="flex items-center gap-2 text-[#2A0913]">
          <CheckCircle2 className="w-4 h-4 text-[#4A101D] fill-white" />
          <span className="font-semibold">Governance</span>
          <span className="text-[#8C7B80] font-mono">22s</span>
        </div>
        <div className="flex-1 h-0.5 mx-3 bg-[#D5C7B8]" />

        <div className="flex items-center gap-2 text-[#2A0913]">
          <CheckCircle2 className="w-4 h-4 text-[#4A101D] fill-white" />
          <span className="font-semibold">Score and report</span>
          <span className="text-[#8C7B80] font-mono">31s</span>
        </div>
      </div>

      {/* Top Row: AI Risk Score Gauge & 4 Domain Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (1 col): AI Risk Score Dial */}
        <div className="bg-[#300712] text-white rounded-2xl p-7 flex flex-col items-center justify-between text-center shadow-md border border-[#48101E]">
          <span className="text-xs uppercase tracking-wider text-[#D8BCC3] font-semibold">
            AI Risk Score
          </span>

          {/* Dial with radial tick marks */}
          <div className="relative my-4 w-44 h-44 flex items-center justify-center">
            {/* SVG Dial */}
            <svg className="w-full h-full" viewBox="0 0 160 160">
              {/* Radial Ticks */}
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = (i * 10 * Math.PI) / 180;
                const x1 = 80 + 64 * Math.cos(angle);
                const y1 = 80 + 64 * Math.sin(angle);
                const x2 = 80 + 72 * Math.cos(angle);
                const y2 = 80 + 72 * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#E5CBD2"
                    strokeOpacity={i < 24 ? '0.8' : '0.2'}
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Central Circle */}
              <circle cx="80" cy="80" r="54" fill="#20040B" stroke="#4A101D" strokeWidth="2" />
            </svg>

            {/* Inner Score Number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-5xl font-bold tracking-tight text-white leading-none">
                66
              </span>
              <span className="text-[11px] text-[#D8BCC3] mt-1 font-mono">
                out of 100
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-[#EFE8E0] text-[#380914]">
              High risk
            </span>
            <p className="text-xs text-[#D8BCC3] leading-relaxed max-w-xs">
              Not ready for deployment. Fix the 2 high findings to move below 55.
            </p>
          </div>
        </div>

        {/* Right (2 cols): 4 Domain Metric Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Fairness */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#4A101D] text-white flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#6B5A5F] block">Fairness</span>
                <span className="font-serif text-3xl font-bold text-[#2A0913]">81</span>
              </div>
            </div>
            <p className="text-xs text-[#6B5A5F] mt-4 leading-relaxed">
              Women selected at 0.62 of the male rate
            </p>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#4A101D] text-white flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#6B5A5F] block">Security</span>
                <span className="font-serif text-3xl font-bold text-[#2A0913]">62</span>
              </div>
            </div>
            <p className="text-xs text-[#6B5A5F] mt-4 leading-relaxed">
              38% of evasion probes changed the decision
            </p>
          </div>

          {/* Governance */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#4A101D] text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#6B5A5F] block">Governance</span>
                <span className="font-serif text-3xl font-bold text-[#2A0913]">55</span>
              </div>
            </div>
            <p className="text-xs text-[#6B5A5F] mt-4 leading-relaxed">
              7 of 16 controls have no owner or evidence
            </p>
          </div>

          {/* Data quality */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#4A101D] text-white flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#6B5A5F] block">Data quality</span>
                <span className="font-serif text-3xl font-bold text-[#2A0913]">34</span>
              </div>
            </div>
            <p className="text-xs text-[#6B5A5F] mt-4 leading-relaxed">
              4.2% missing values, mild class imbalance
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Risk Profile Radar & SHAP Decision Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Profile Radar Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#2A0913]">Risk profile</h2>
            <p className="text-xs text-[#6B5A5F]">Higher means riskier</p>
          </div>

          <div className="h-64 flex items-center justify-center relative">
            <svg className="w-64 h-64" viewBox="0 0 240 240">
              {/* Radar Grid Circles / Polygons */}
              {[40, 70, 95].map((r) => (
                <polygon
                  key={r}
                  points="120,25 210,90 175,195 65,195 30,90"
                  transform={`scale(${r / 95}) translate(${120 * (1 - r / 95)}, ${120 * (1 - r / 95)})`}
                  fill="none"
                  stroke="#E8DFD5"
                  strokeWidth="1"
                />
              ))}

              {/* Axis lines */}
              <line x1="120" y1="120" x2="120" y2="25" stroke="#E8DFD5" strokeWidth="1" />
              <line x1="120" y1="120" x2="210" y2="90" stroke="#E8DFD5" strokeWidth="1" />
              <line x1="120" y1="120" x2="175" y2="195" stroke="#E8DFD5" strokeWidth="1" />
              <line x1="120" y1="120" x2="65" y2="195" stroke="#E8DFD5" strokeWidth="1" />
              <line x1="120" y1="120" x2="30" y2="90" stroke="#E8DFD5" strokeWidth="1" />

              {/* Shaded Risk Polygon */}
              <polygon
                points="120,40 195,95 160,170 85,160 55,100"
                fill="#4A101D"
                fillOpacity="0.18"
                stroke="#4A101D"
                strokeWidth="2.5"
              />

              {/* Points */}
              <circle cx="120" cy="40" r="3.5" fill="#4A101D" />
              <circle cx="195" cy="95" r="3.5" fill="#4A101D" />
              <circle cx="160" cy="170" r="3.5" fill="#4A101D" />
              <circle cx="85" cy="160" r="3.5" fill="#4A101D" />
              <circle cx="55" cy="100" r="3.5" fill="#4A101D" />

              {/* Labels */}
              <text x="120" y="16" textAnchor="middle" className="text-[10px] font-medium fill-[#2A0913]">Fairness</text>
              <text x="215" y="94" textAnchor="start" className="text-[10px] font-medium fill-[#2A0913]">Security</text>
              <text x="175" y="210" textAnchor="middle" className="text-[10px] font-medium fill-[#2A0913]">Governance</text>
              <text x="65" y="210" textAnchor="middle" className="text-[10px] font-medium fill-[#2A0913]">Explainability</text>
              <text x="25" y="94" textAnchor="end" className="text-[10px] font-medium fill-[#2A0913]">Data quality</text>
            </svg>
          </div>
        </div>

        {/* SHAP Feature Importance Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#2A0913]">
              What drives the model&apos;s decisions
            </h2>
            <p className="text-xs text-[#6B5A5F]">Average impact on a rejection (SHAP)</p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {/* years_experience */}
            <div className="flex items-center gap-3">
              <span className="w-36 font-mono text-[#2A0913] truncate">years_experience</span>
              <div className="flex-1 bg-[#F5EDE6] h-4 rounded-md overflow-hidden">
                <div className="bg-[#B07D62] h-full rounded-md" style={{ width: '62%' }} />
              </div>
              <span className="w-10 text-right font-mono text-[#6B5A5F]">0.31</span>
            </div>

            {/* employment_gap_months (Gender proxy) */}
            <div className="flex items-center gap-3">
              <span className="w-36 font-mono text-[#2A0913] truncate">employment_gap_months</span>
              <div className="flex-1 bg-[#F5EDE6] h-4 rounded-md overflow-hidden">
                <div className="bg-[#4A101D] h-full rounded-md" style={{ width: '36%' }} />
              </div>
              <span className="w-10 text-right font-mono text-[#6B5A5F]">0.18</span>
            </div>

            {/* skills_match_score */}
            <div className="flex items-center gap-3">
              <span className="w-36 font-mono text-[#2A0913] truncate">skills_match_score</span>
              <div className="flex-1 bg-[#F5EDE6] h-4 rounded-md overflow-hidden">
                <div className="bg-[#B07D62] h-full rounded-md" style={{ width: '32%' }} />
              </div>
              <span className="w-10 text-right font-mono text-[#6B5A5F]">0.16</span>
            </div>

            {/* postcode (Ethnicity proxy) */}
            <div className="flex items-center gap-3">
              <span className="w-36 font-mono text-[#2A0913] truncate">postcode</span>
              <div className="flex-1 bg-[#F5EDE6] h-4 rounded-md overflow-hidden">
                <div className="bg-[#2A0610] h-full rounded-md" style={{ width: '22%' }} />
              </div>
              <span className="w-10 text-right font-mono text-[#6B5A5F]">0.11</span>
            </div>

            {/* education_level */}
            <div className="flex items-center gap-3">
              <span className="w-36 font-mono text-[#2A0913] truncate">education_level</span>
              <div className="flex-1 bg-[#F5EDE6] h-4 rounded-md overflow-hidden">
                <div className="bg-[#B07D62] h-full rounded-md" style={{ width: '16%' }} />
              </div>
              <span className="w-10 text-right font-mono text-[#6B5A5F]">0.08</span>
            </div>

            {/* referral_source */}
            <div className="flex items-center gap-3">
              <span className="w-36 font-mono text-[#2A0913] truncate">referral_source</span>
              <div className="flex-1 bg-[#F5EDE6] h-4 rounded-md overflow-hidden">
                <div className="bg-[#B07D62] h-full rounded-md" style={{ width: '8%' }} />
              </div>
              <span className="w-10 text-right font-mono text-[#6B5A5F]">0.04</span>
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-[#F0E8DF] flex items-center gap-4 text-[11px] text-[#6B5A5F]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#4A101D]" />
                <span>Gender proxy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2A0610]" />
                <span>Ethnicity proxy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#B07D62]" />
                <span>No concern</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Risk Score Over Time & Outcomes by Group Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Score Over Time */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#2A0913]">
              Risk score over time
            </h2>
            <p className="text-xs text-[#6B5A5F]">Lower is better</p>
          </div>

          <div className="h-56 relative pt-4">
            <svg className="w-full h-44 overflow-visible" viewBox="0 0 400 140">
              {/* Dotted target line */}
              <line x1="20" y1="100" x2="380" y2="100" stroke="#B84E5D" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="380" y="112" textAnchor="end" className="text-[10px] font-mono fill-[#B84E5D]">
                target below 55
              </text>

              {/* Line graph */}
              <path
                d="M 50 30 L 150 55 L 250 68 L 350 82"
                stroke="#4A101D"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />

              {[
                { x: 50, y: 30, val: '81', run: 'Run 1' },
                { x: 150, y: 55, val: '74', run: 'Run 2' },
                { x: 250, y: 68, val: '71', run: 'Run 3' },
                { x: 350, y: 82, val: '66', run: 'Run 4' },
              ].map((p) => (
                <g key={p.val}>
                  <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[11px] font-bold font-mono fill-[#2A0913]">
                    {p.val}
                  </text>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#FFFFFF" stroke="#4A101D" strokeWidth="2.5" />
                  <text x={p.x} y="132" textAnchor="middle" className="text-[11px] text-[#6B5A5F]">
                    {p.run}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Outcomes by Group Heatmap Table */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#2A0913]">
              Outcomes by group
            </h2>
            <p className="text-xs text-[#6B5A5F]">Darker cells need attention</p>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-[#8C7B80]">
                  <th className="py-2 px-3"></th>
                  <th className="py-2 px-3 font-medium text-center">Selection rate</th>
                  <th className="py-2 px-3 font-medium text-center">Missed good hires</th>
                  <th className="py-2 px-3 font-medium text-center">Disparate impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DF]">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[#2A0913]">Men</td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#DBCBC0] text-[#2A0913] font-mono font-bold">0.41</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#EFE8E0] text-[#2A0913] font-mono">0.12</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#EFE8E0] text-[#2A0913] font-mono font-bold">1.00</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[#2A0913]">Women</td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#4A101D] text-white font-mono font-bold">0.25</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#4A101D] text-white font-mono font-bold">0.27</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#4A101D] text-white font-mono font-bold">0.62</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[#2A0913]">Age under 30</td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#DBCBC0] text-[#2A0913] font-mono">0.36</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#EFE8E0] text-[#2A0913] font-mono">0.16</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#EFE8E0] text-[#2A0913] font-mono font-bold">0.88</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[#2A0913]">Age 30 to 50</td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#DBCBC0] text-[#2A0913] font-mono font-bold">0.41</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#EFE8E0] text-[#2A0913] font-mono">0.12</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#EFE8E0] text-[#2A0913] font-mono font-bold">1.00</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-[#2A0913]">Age over 50</td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#DBCBC0] text-[#2A0913] font-mono">0.30</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#B07D62] text-white font-mono font-bold">0.22</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-3 py-1 rounded bg-[#B07D62] text-white font-mono font-bold">0.73</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section: Findings Table with Filters & Expansion */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
          <h2 className="font-serif text-2xl font-bold text-[#2A0913]">Findings</h2>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All 9' },
              { id: 'fairness', label: 'Fairness 3' },
              { id: 'security', label: 'Security 2' },
              { id: 'governance', label: 'Governance 3' },
              { id: 'data', label: 'Data 1' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFindingTab(tab.id as typeof activeFindingTab)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  activeFindingTab === tab.id
                    ? 'bg-[#4A101D] text-white shadow-xs'
                    : 'bg-[#EFE8E0] text-[#6B5A5F] hover:bg-[#E5DBD0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div className="rounded-xl overflow-hidden border border-[#E8DFD5]">
          <div className="bg-[#4A101D] text-white text-xs font-semibold px-4 py-2.5 grid grid-cols-12 gap-4">
            <span className="col-span-2">Severity</span>
            <span className="col-span-6">Finding</span>
            <span className="col-span-2">Area</span>
            <span className="col-span-2 text-right">Score Impact</span>
          </div>

          <div className="divide-y divide-[#F0E8DF]">
            {filteredFindings.map((finding) => {
              const isExpanded = expandedFinding === finding.id;

              return (
                <div
                  key={finding.id}
                  className="p-4 hover:bg-[#FAF6F0] transition cursor-pointer"
                  onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center text-xs">
                    {/* Severity Badge */}
                    <div className="col-span-2">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                          finding.severity === 'High'
                            ? 'bg-[#4A101D] text-white'
                            : finding.severity === 'Medium'
                            ? 'bg-[#DBCBC0] text-[#3D141E]'
                            : 'bg-[#E8DFD5] text-[#553830]'
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>

                    {/* Finding Title & Details */}
                    <div className="col-span-6">
                      <p className="font-bold text-[#2A0913] text-sm">{finding.title}</p>
                      <p className="text-[11px] text-[#6B5A5F] mt-0.5">{finding.details}</p>
                    </div>

                    {/* Area & Check ID */}
                    <div className="col-span-2 font-mono text-[11px] text-[#6B5A5F]">
                      {finding.area} &bull; {finding.checkId}
                    </div>

                    {/* Score Impact & Expand Toggle */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="font-mono font-bold text-[#4A101D]">
                        {finding.scoreImpact}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#8C7B80]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#8C7B80]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Recommendation Accordion */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#F0E8DF] pl-2 text-xs text-[#2A0913] bg-[#F7F2EB] p-3 rounded-lg flex items-start gap-2">
                      <span className="font-bold text-[#4A101D] shrink-0">&rarr;</span>
                      <p className="leading-relaxed font-medium">
                        {finding.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemDetailWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SystemDetailContent id={id} />;
}

export default function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense fallback={<LoadingSpinner label="Loading system details..." />}>
      <SystemDetailWrapper params={params} />
    </React.Suspense>
  );
}
