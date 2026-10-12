import { AlertTriangle, Calendar, Layers, ShieldCheck } from 'lucide-react';

const metrics = [
  { label: 'Open findings', value: '12', icon: AlertTriangle },
  { label: 'Controls reviewed', value: '8', icon: ShieldCheck },
  { label: 'Modules active', value: '4', icon: Layers },
  { label: 'Next review', value: 'Nov 12', icon: Calendar },
];

export default function ReportsPage() {
  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C1A2B]">Reports</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Audit overview</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-[#5C1A2B]" />
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
