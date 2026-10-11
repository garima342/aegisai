'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Cpu,
  Shield,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { AiSystem } from '@/lib/types/system';
import { RiskTierBadge } from '@/components/ui/RiskTierBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';

export default function SystemsPage() {
  const [systems, setSystems] = useState<AiSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const fetchSystems = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedTier && selectedTier !== 'all') params.append('riskTier', selectedTier);

        const res = await fetch(`/api/systems?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to load registered AI systems');
        }
        const json = await res.json();
        if (!isCancelled) {
          setSystems(json.data || []);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load systems';
          setError(msg);
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [search, selectedTier, reloadTrigger]);

  const formatModelType = (type: string) => {
    switch (type) {
      case 'tabular_classifier':
        return 'Tabular Classifier';
      case 'tabular_regressor':
        return 'Tabular Regressor';
      case 'llm_app':
        return 'LLM Application';
      case 'rag_system':
        return 'RAG System';
      case 'agent':
        return 'Autonomous Agent';
      default:
        return 'Custom / Other';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Registered AI Systems
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage your AI inventory, risk tier classifications, and audit assessments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/systems/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#5C1A2B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#722136] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5C1A2B] transition"
          >
            <Plus className="w-4 h-4" />
            New System
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by system name, purpose, domain, or owner..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
            aria-label="Search systems"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Filter className="w-4 h-4 text-stone-400" />
            <label htmlFor="tier-filter" className="sr-only">Filter by risk tier</label>
            <select
              id="tier-filter"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="py-2 px-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C1A2B]/20 focus:border-[#5C1A2B] transition"
            >
              <option value="all">All Risk Tiers</option>
              <option value="high">High Risk</option>
              <option value="limited">Limited Risk</option>
              <option value="minimal">Minimal Risk</option>
              <option value="unacceptable">Unacceptable</option>
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-stone-200 p-1 bg-stone-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchSystems}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && systems.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No AI Systems Found"
          description={
            search || selectedTier !== 'all'
              ? 'No systems matched your search filters. Try adjusting your search query or tier filter.'
              : 'Register your first AI/ML system to establish audit readiness, bias controls, and risk classification.'
          }
          actionLabel={search || selectedTier !== 'all' ? 'Clear Filters' : 'Register AI System'}
          actionHref={search || selectedTier !== 'all' ? undefined : '/systems/new'}
          onAction={
            search || selectedTier !== 'all'
              ? () => {
                  setSearch('');
                  setSelectedTier('all');
                }
              : undefined
          }
        />
      )}

      {/* Systems Cards Grid View */}
      {!loading && !error && systems.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systems.map((system) => (
            <Card
              key={system.id}
              variant="interactive"
              className="flex flex-col justify-between"
            >
              <div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base line-clamp-1">
                      <Link
                        href={`/systems/${system.id}`}
                        className="hover:text-[#5C1A2B] transition"
                      >
                        {system.name}
                      </Link>
                    </CardTitle>
                    <RiskTierBadge tier={system.riskTier} size="sm" />
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {system.description || system.purpose}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="font-medium text-stone-700">Architecture:</span>
                    <span>{formatModelType(system.modelType)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="font-medium text-stone-700">Domain:</span>
                    <span className="capitalize">{system.domainContext.replace('_', ' ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="font-medium text-stone-700">Owner:</span>
                    <span className="truncate">{system.owner}</span>
                  </div>

                  {system.sensitiveAttributes && system.sensitiveAttributes.length > 0 && (
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1">
                      {system.sensitiveAttributes.map((attr) => (
                        <span
                          key={attr}
                          className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-mono"
                        >
                          {attr}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </div>

              <CardFooter className="pt-4 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  {new Date(system.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/systems/${system.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-[#5C1A2B] hover:text-[#722136] transition"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Systems Table View */}
      {!loading && !error && systems.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-xs font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th scope="col" className="px-6 py-4">System Name</th>
                  <th scope="col" className="px-6 py-4">Risk Tier</th>
                  <th scope="col" className="px-6 py-4">Architecture</th>
                  <th scope="col" className="px-6 py-4">Domain</th>
                  <th scope="col" className="px-6 py-4">Owner</th>
                  <th scope="col" className="px-6 py-4">Created</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {systems.map((system) => (
                  <tr key={system.id} className="hover:bg-stone-50/80 transition">
                    <td className="px-6 py-4 font-medium text-stone-900">
                      <Link
                        href={`/systems/${system.id}`}
                        className="hover:text-[#5C1A2B] transition"
                      >
                        {system.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <RiskTierBadge tier={system.riskTier} size="sm" />
                    </td>
                    <td className="px-6 py-4">{formatModelType(system.modelType)}</td>
                    <td className="px-6 py-4 capitalize">{system.domainContext.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-stone-500">{system.owner}</td>
                    <td className="px-6 py-4 text-stone-400 text-xs">
                      {new Date(system.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/systems/${system.id}`}
                        className="text-xs font-semibold text-[#5C1A2B] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
