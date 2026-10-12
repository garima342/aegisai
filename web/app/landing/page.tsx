import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#5C1A2B]">
          AI trust & compliance
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
          Audit AI systems before they reach production.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          AegisAI helps teams review model risk, security posture, governance gaps, and
          explainability decisions in one workflow.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-[#5C1A2B] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#742338]"
          >
            Sign in
          </Link>
          <Link
            href="/systems/new"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Start a system review
          </Link>
        </div>
      </section>
    </main>
  );
}
