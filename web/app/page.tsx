import Link from 'next/link';
import { dbStore } from '@/lib/store';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { RiskTierBadge } from '@/components/ui/RiskTierBadge';

export default function Home() {
  const systems = Array.from(dbStore.systems.values());
  const assessments = Array.from(dbStore.assessments.values());
  const highRiskCount = systems.filter((s) => s.riskTier === 'high' || s.riskTier === 'unacceptable').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">
            Welcome to AegisAI. Audit AI/ML systems pre-deployment and output audit-ready risk reports.
          </p>
        </div>
        <div>
          <Link
            href="/systems/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#5C1A2B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#722136] transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Assessment / System
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200">
          <h3 className="font-semibold text-stone-500 text-xs uppercase tracking-wider">
            Registered Systems
          </h3>
          <p className="text-4xl font-bold text-[#5C1A2B] mt-2">{systems.length}</p>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center text-xs text-stone-500">
            <span>In active inventory</span>
            <Link href="/systems" className="text-[#5C1A2B] font-semibold hover:underline">
              View all &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200">
          <h3 className="font-semibold text-stone-500 text-xs uppercase tracking-wider">
            Total Assessments
          </h3>
          <p className="text-4xl font-bold text-[#5C1A2B] mt-2">{assessments.length}</p>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center text-xs text-stone-500">
            <span>Across all systems</span>
            <Link href="/systems" className="text-[#5C1A2B] font-semibold hover:underline">
              Details &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200">
          <h3 className="font-semibold text-stone-500 text-xs uppercase tracking-wider">
            High & Critical Risk Systems
          </h3>
          <p className="text-4xl font-bold text-rose-700 mt-2">{highRiskCount}</p>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center text-xs text-stone-500">
            <span>Requires stringent audit</span>
            <span className="text-rose-600 font-semibold">EU AI Act Annex III</span>
          </div>
        </div>
      </div>

      {/* Systems Overview */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Active AI Inventory</h2>
            <p className="text-xs text-stone-500">Systems registered for trust, risk, and fairness analysis.</p>
          </div>
          <Link
            href="/systems"
            className="text-xs font-semibold text-[#5C1A2B] hover:underline flex items-center gap-1"
          >
            Explore all systems <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {systems.length === 0 ? (
          <div className="py-12 text-center text-stone-500">
            <p>No systems registered yet.</p>
            <Link
              href="/systems/new"
              className="mt-3 inline-block px-4 py-2 bg-[#5C1A2B] text-white text-xs font-semibold rounded-xl"
            >
              Register First System
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systems.slice(0, 4).map((sys) => (
              <div
                key={sys.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/systems/${sys.id}`}
                      className="font-semibold text-sm text-stone-900 hover:text-[#5C1A2B] transition"
                    >
                      {sys.name}
                    </Link>
                    <RiskTierBadge tier={sys.riskTier} size="sm" />
                  </div>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {sys.description || sys.purpose}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-400">
                  <span className="capitalize">{sys.domainContext.replace('_', ' ')}</span>
                  <Link
                    href={`/systems/${sys.id}`}
                    className="font-semibold text-[#5C1A2B] hover:underline"
                  >
                    View &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
