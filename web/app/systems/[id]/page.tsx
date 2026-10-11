'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Layers,
  Database,
  Box,
  FileText,
  AlertTriangle,
  Play,
  CheckCircle2,
  Clock,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { AiSystem } from '@/lib/types/system';
import { RiskTierBadge } from '@/components/ui/RiskTierBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function SystemDetailContent({ id }: { id: string }) {

  const [system, setSystem] = useState<AiSystem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingAssessment, setCreatingAssessment] = useState(false);
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

  const handleStartNewAssessment = async () => {
    setCreatingAssessment(true);
    try {
      const res = await fetch(`/api/systems/${id}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runDataRisk: true,
          runSecurity: true,
          runGovernance: true,
        }),
      });
      if (res.ok) {
        fetchSystem();
      }
    } catch (err) {
      console.error('Failed to trigger assessment:', err);
    } finally {
      setCreatingAssessment(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getArtifactIcon = (kind: string) => {
    switch (kind) {
      case 'dataset':
        return <Database className="w-4 h-4 text-indigo-600" />;
      case 'model':
        return <Box className="w-4 h-4 text-amber-600" />;
      case 'documentation':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      default:
        return <Layers className="w-4 h-4 text-stone-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Audit Completed
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
            <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
            Running Audit
          </span>
        );
      case 'intake_complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
            <CheckCircle2 className="w-3 h-3 text-sky-600" />
            Intake Ready
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
            <Clock className="w-3 h-3 text-stone-500" />
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading AI system metadata and audit trails..." />;
  }

  if (error || !system) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-rose-50 text-rose-600 mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">{error || 'System Not Found'}</h2>
        <p className="text-sm text-stone-500">
          The requested system ID could not be loaded or may have been removed.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/systems"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold transition"
          >
            Back to Systems
          </Link>
          <button
            type="button"
            onClick={fetchSystem}
            className="px-4 py-2 bg-[#5C1A2B] text-white hover:bg-[#722136] rounded-xl text-sm font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Back Button & Header */}
      <div>
        <Link
          href="/systems"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Systems Overview
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-stone-900">
                {system.name}
              </h1>
              <RiskTierBadge tier={system.riskTier} size="md" />
            </div>
            <p className="text-stone-500 text-sm mt-1 max-w-2xl">
              {system.description || system.purpose}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleStartNewAssessment}
              disabled={creatingAssessment}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5C1A2B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#722136] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5C1A2B] transition disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              {creatingAssessment ? 'Starting...' : 'New Assessment'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Metadata Overview Card & Regulatory Risk Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: 2 spans */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information & Purpose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Intended Business Purpose
                </h4>
                <p className="text-stone-800 mt-1 leading-relaxed">
                  {system.purpose}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Operational Deployment Setting
                </h4>
                <p className="text-stone-800 mt-1 leading-relaxed">
                  {system.intendedUse}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-100 text-xs">
                <div>
                  <span className="text-stone-400 font-semibold block">Architecture</span>
                  <span className="font-mono text-stone-800 font-medium">
                    {system.modelType}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 font-semibold block">Domain Context</span>
                  <span className="capitalize text-stone-800 font-medium">
                    {system.domainContext.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 font-semibold block">Owner / Lead</span>
                  <span className="text-stone-800 font-medium">{system.owner}</span>
                </div>
              </div>

              {system.sensitiveAttributes && system.sensitiveAttributes.length > 0 && (
                <div className="pt-4 border-t border-stone-100">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                    Monitored Sensitive Attributes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {system.sensitiveAttributes.map((attr) => (
                      <span
                        key={attr}
                        className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-mono border border-stone-200"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LLM Endpoint Config if available */}
          {system.llmConfig && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#5C1A2B]" />
                  <CardTitle>LLM Application Security Configuration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-stone-700 block">Target Endpoint URL</span>
                  <code className="text-stone-800 bg-stone-100 px-2 py-1 rounded block mt-1 overflow-x-auto">
                    {system.llmConfig.endpointUrl}
                  </code>
                </div>
                <div>
                  <span className="font-semibold text-stone-700 block">Active System Prompt</span>
                  <pre className="text-stone-800 bg-stone-50 border border-stone-200 p-3 rounded-lg mt-1 font-mono text-[11px] whitespace-pre-wrap">
                    {system.llmConfig.systemPrompt}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Associated Assessments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audit Assessments</CardTitle>
                <CardDescription>
                  Historical and pending security, fairness, and governance audits.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {(!system.assessments || system.assessments.length === 0) ? (
                <div className="p-8 text-center text-sm text-stone-500">
                  No assessments executed yet. Click &quot;New Assessment&quot; to begin.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {system.assessments.map((asmt) => (
                    <div
                      key={asmt.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-sm text-stone-900">
                            {asmt.id}
                          </span>
                          {getStatusBadge(asmt.status)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500">
                          <span>
                            Created {new Date(asmt.createdAt).toLocaleDateString()}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            Scope:
                            {asmt.runDataRisk && ' [M2 Data]'}
                            {asmt.runSecurity && ' [M3 Security]'}
                            {asmt.runGovernance && ' [M4 Governance]'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/assessments`}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
                        >
                          View Assessment
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Risk Rationale & Artifacts */}
        <div className="space-y-6">
          {/* Risk Classification Rationale Card */}
          <Card variant="highlight">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#5C1A2B]" />
                <CardTitle className="text-base">Compliance Classification</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-stone-700">
              <div>
                <span className="font-semibold text-stone-900 block mb-1">
                  Assigned Risk Tier:
                </span>
                <RiskTierBadge tier={system.riskTier} size="sm" />
              </div>

              {system.riskRationale && (
                <div className="pt-2">
                  <span className="font-semibold text-stone-900 block mb-1">
                    Regulatory Basis:
                  </span>
                  <p className="leading-relaxed text-stone-600 bg-white p-3 rounded-xl border border-stone-200">
                    {system.riskRationale}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registered Artifacts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registered Artifacts</CardTitle>
              <CardDescription>
                Files bound to intake and audits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!system.artifacts || system.artifacts.length === 0) ? (
                <div className="p-4 text-center text-xs text-stone-400">
                  No artifacts uploaded.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {system.artifacts.map((artifact) => (
                    <div
                      key={artifact.id}
                      className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {getArtifactIcon(artifact.kind)}
                        <div className="truncate">
                          <p className="font-medium text-stone-800 truncate" title={artifact.filename}>
                            {artifact.filename}
                          </p>
                          <p className="text-stone-400 text-[11px]">
                            {formatSize(artifact.size)} &bull; {artifact.kind}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
