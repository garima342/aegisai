const results = [
  { module: 'M1 Intake', score: 32 },
  { module: 'M2 Risk', score: 62 },
  { module: 'M3 Security', score: 48 },
  { module: 'M4 Governance', score: 74 },
];

export default function ResultsPage() {
  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C1A2B]">Results</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Assessment summary</h1>
      </header>

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.module} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{result.module}</h2>
              <span className="text-sm font-medium text-slate-600">{result.score}/100</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#5C1A2B]"
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
