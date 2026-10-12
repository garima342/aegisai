import { Bell, Lock, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const items = [
  { label: 'Notifications', value: 'Enabled', icon: Bell },
  { label: 'Security', value: 'MFA required', icon: Lock },
  { label: 'Data sync', value: 'Last refreshed 2h ago', icon: RefreshCw },
];

export default function SettingsPage() {
  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C1A2B]">Settings</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Workspace preferences</h1>
        </div>
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Go home
        </Link>
      </header>

      <div className="space-y-4">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-[#5C1A2B]">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{label}</p>
                <p className="text-sm text-slate-500">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
