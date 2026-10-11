'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Shield,
  Key,
  Users,
  Check,
  CheckCircle2,
  Copy,
  Save,
  Bell,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'policies' | 'integrations' | 'team'>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Form states
  const [workspaceName, setWorkspaceName] = useState('University AI Trust & Governance Lab');
  const [ownerEmail, setOwnerEmail] = useState('garima@university.edu');
  const [maxRiskScore, setMaxRiskScore] = useState(55);
  const [disparateImpactThreshold, setDisparateImpactThreshold] = useState(0.8);
  const [autoBlockDeployment, setAutoBlockDeployment] = useState(true);
  const [requireAuditorSignoff, setRequireAuditorSignoff] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const apiKey = 'aegis_live_9f81a7b3984d720c6a518e';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Settings successfully saved and synchronized.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-[1360px] mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#380914] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#4A101D] flex items-center gap-3 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#2A0913]">
          Settings
        </h1>
        <p className="text-[#6B5A5F] text-sm mt-1">
          Manage workspace policies, risk scoring thresholds, API keys, and reviewer access.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[#E8DFD5] space-x-6 text-sm">
        {[
          { id: 'general', label: 'General & Profile', icon: Sliders },
          { id: 'policies', label: 'Risk Policies & Thresholds', icon: Shield },
          { id: 'integrations', label: 'API & Integrations', icon: Key },
          { id: 'team', label: 'Team & Members', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 font-semibold text-xs md:text-sm flex items-center gap-2 border-b-2 transition select-none ${
                isActive
                  ? 'border-[#4A101D] text-[#4A101D]'
                  : 'border-transparent text-[#6B5A5F] hover:text-[#2A0913]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General & Profile */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl bg-white p-7 rounded-2xl border border-[#E8DFD5] shadow-xs">
          <h2 className="font-serif text-xl font-bold text-[#2A0913]">Workspace Details</h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#2A0913] mb-1.5">Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-white border border-[#D5C7B8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A101D]/20 focus:border-[#4A101D] text-[#2A0913]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2A0913] mb-1.5">Workspace Owner Email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-white border border-[#D5C7B8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A101D]/20 focus:border-[#4A101D] text-[#2A0913]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#2A0913] mb-1.5">Model Artifact Retention</label>
              <select className="w-full px-4 py-2 text-sm bg-white border border-[#D5C7B8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A101D]/20 focus:border-[#4A101D] text-[#2A0913]">
                <option value="90">90 days encrypted storage (Audit-ready standard)</option>
                <option value="180">180 days</option>
                <option value="365">1 year (Enterprise compliance)</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4A101D] accent-[#4A101D] border-[#D5C7B8]"
                />
                <div>
                  <p className="font-semibold text-[#2A0913]">Email Notifications for High-Risk Audits</p>
                  <p className="text-[#6B5A5F] text-[11px]">Send automatic alerts when an audit score exceeds the deployment threshold.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0E8DF] flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4A101D] hover:bg-[#5F1525] text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Risk Policies & Thresholds */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl bg-white p-7 rounded-2xl border border-[#E8DFD5] shadow-xs">
          <h2 className="font-serif text-xl font-bold text-[#2A0913]">Scoring & Governance Thresholds</h2>
          <p className="text-xs text-[#6B5A5F]">
            Configure the numerical parameters that govern whether an AI system is marked &ldquo;Not ready for deployment&rdquo;.
          </p>

          <div className="space-y-5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-[#2A0913]">Maximum Target Risk Score</label>
                <span className="font-mono font-bold text-[#4A101D] text-sm">{maxRiskScore} / 100</span>
              </div>
              <input
                type="range"
                min="30"
                max="80"
                value={maxRiskScore}
                onChange={(e) => setMaxRiskScore(Number(e.target.value))}
                className="w-full accent-[#4A101D]"
              />
              <p className="text-[11px] text-[#6B5A5F] mt-1">
                Models scoring higher than this value (e.g. Hiring Screener v3 at 66) require risk remediation before deployment approval.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-[#2A0913]">Disparate Impact Fairness Floor</label>
                <span className="font-mono font-bold text-[#4A101D] text-sm">{disparateImpactThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="0.95"
                step="0.05"
                value={disparateImpactThreshold}
                onChange={(e) => setDisparateImpactThreshold(Number(e.target.value))}
                className="w-full accent-[#4A101D]"
              />
              <p className="text-[11px] text-[#6B5A5F] mt-1">
                The EEOC Four-Fifths benchmark: groups with selection rates below 0.80 of the reference rate are automatically flagged.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoBlockDeployment}
                  onChange={(e) => setAutoBlockDeployment(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4A101D] accent-[#4A101D] border-[#D5C7B8]"
                />
                <div>
                  <p className="font-semibold text-[#2A0913]">Auto-flag High Severity Findings</p>
                  <p className="text-[#6B5A5F] text-[11px]">Enforce mandatory remediation steps for any check yielding &ge; 6 severity points.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireAuditorSignoff}
                  onChange={(e) => setRequireAuditorSignoff(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4A101D] accent-[#4A101D] border-[#D5C7B8]"
                />
                <div>
                  <p className="font-semibold text-[#2A0913]">Require Named Reviewer for EU AI Act High-Risk Models</p>
                  <p className="text-[#6B5A5F] text-[11px]">Mandate human-in-the-loop sign-off on Annex III systems before report export.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0E8DF] flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4A101D] hover:bg-[#5F1525] text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <Save className="w-4 h-4" />
              Update Policies
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: API & Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 max-w-2xl bg-white p-7 rounded-2xl border border-[#E8DFD5] shadow-xs text-xs">
          <h2 className="font-serif text-xl font-bold text-[#2A0913]">CI/CD Pipeline & API Keys</h2>
          <p className="text-[#6B5A5F]">
            Trigger automated AegisAI risk audits directly from your GitHub Actions or GitLab CI pipelines.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block font-semibold text-[#2A0913] mb-1.5">Workspace Secret API Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="w-full px-4 py-2 font-mono text-xs bg-[#FAF6F0] border border-[#D5C7B8] rounded-xl text-[#2A0913] select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3.5 py-2 bg-white border border-[#D5C7B8] hover:bg-[#FAF6F0] rounded-xl font-semibold text-xs text-[#2A0913] inline-flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E8DFD5] space-y-2">
              <p className="font-semibold text-[#2A0913]">Quick CI/CD Shell Snippet</p>
              <pre className="p-3 bg-[#2A0610] text-[#E5CBD2] rounded-lg font-mono text-[11px] overflow-x-auto">
{`curl -X POST https://aegisai.university.edu/api/systems/sys-hr-recruitment-01/assessments \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Team & Members */}
      {activeTab === 'team' && (
        <div className="space-y-6 max-w-2xl bg-white p-7 rounded-2xl border border-[#E8DFD5] shadow-xs text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#2A0913]">Team Members</h2>
              <p className="text-[#6B5A5F] mt-0.5">Users authorized to review, audit, and export compliance reports.</p>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 bg-[#4A101D] text-white rounded-xl font-semibold text-xs hover:bg-[#5F1525]"
            >
              + Invite Reviewer
            </button>
          </div>

          <div className="divide-y divide-[#F0E8DF] border border-[#E8DFD5] rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#380914] text-white font-bold flex items-center justify-center">
                  G
                </div>
                <div>
                  <p className="font-bold text-[#2A0913]">Garima Sethi</p>
                  <p className="text-[11px] text-[#6B5A5F]">garima@university.edu</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#EFE8E0] text-[#380914] font-semibold text-[11px]">
                Workspace Owner
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#B89E97] text-white font-bold flex items-center justify-center">
                  A
                </div>
                <div>
                  <p className="font-bold text-[#2A0913]">Audit Committee Reviewer</p>
                  <p className="text-[11px] text-[#6B5A5F]">compliance@university.edu</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FAF6F0] text-[#6B5A5F] font-medium text-[11px]">
                Compliance Auditor
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
