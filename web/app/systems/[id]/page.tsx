import Link from 'next/link';

export default function SystemDetailPage() {
  const system = {
    id: 'sys-001',
    name: 'HR Recruitment Copilot',
    riskTier: 'high',
    owner: 'People Ops',
    modelType: 'tabular_classifier',
    domainContext: 'Hiring and recruitment',
    updatedAt: '2026-10-13',
  };

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C1A2B]">System</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{system.name}</h1>
        </div>
        <Link href="/systems" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Back to inventory
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Risk tier</p>
          <p className="mt-2 text-2xl font-semibold text-[#5C1A2B]">{system.riskTier}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Model type</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{system.modelType}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Owner</dt>
            <dd className="mt-1 font-medium text-slate-900">{system.owner}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Updated</dt>
            <dd className="mt-1 font-medium text-slate-900">{system.updatedAt}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-slate-500">Domain context</dt>
            <dd className="mt-1 font-medium text-slate-900">{system.domainContext}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
