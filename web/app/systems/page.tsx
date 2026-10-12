import Link from 'next/link';

const systems = [
  {
    id: 'sys-001',
    name: 'HR Recruitment Copilot',
    riskTier: 'high',
    owner: 'People Ops',
    modelType: 'tabular_classifier',
  },
  {
    id: 'sys-002',
    name: 'Customer Support Agent',
    riskTier: 'limited',
    owner: 'CX Team',
    modelType: 'llm_app',
  },
];

export default function SystemsPage() {
  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C1A2B]">AI systems</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">System inventory</h1>
        </div>
        <Link
          href="/systems/new"
          className="rounded-lg bg-[#5C1A2B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#742338]"
        >
          New system
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {systems.map((system) => (
          <Link
            key={system.id}
            href={`/systems/${system.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{system.name}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                {system.riskTier}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Owner: {system.owner}</p>
            <p className="mt-2 text-sm text-slate-600">Model: {system.modelType}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
