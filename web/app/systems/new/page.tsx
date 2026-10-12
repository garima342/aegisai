'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { getSuggestedRiskTier } from '../../../lib/risk-tier';

type FormState = {
  name: string;
  purpose: string;
  intendedUse: string;
  domainContext: string;
  modelType: string;
  owner: string;
  riskTier: string;
};

const initialForm: FormState = {
  name: '',
  purpose: '',
  intendedUse: '',
  domainContext: 'Hiring and recruitment',
  modelType: 'tabular_classifier',
  owner: '',
  riskTier: 'high',
};

export default function NewSystemPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);

  const suggestedTier = useMemo(
    () => getSuggestedRiskTier({
      domainContext: form.domainContext,
      modelType: form.modelType,
    }),
    [form.domainContext, form.modelType],
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const nextStep = () => setStep((current) => Math.min(current + 1, 3));
  const prevStep = () => setStep((current) => Math.max(current - 1, 1));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetch('/api/systems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        description: form.purpose,
        sensitiveAttributes: [],
        riskTier: form.riskTier || suggestedTier,
      }),
    });
    setStep(3);
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C1A2B]">Register system</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">New AI system</h1>
        </div>
        <Link href="/systems" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Back to systems
        </Link>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-3 text-sm">
          {['System details', 'Risk context', 'Review'].map((label, index) => (
            <div
              key={label}
              className={`rounded-xl px-4 py-3 text-center font-medium ${
                step === index + 1 ? 'bg-[#5C1A2B] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">System name</label>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#5C1A2B]"
                placeholder="HR Recruitment AI"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Owner</label>
              <input
                value={form.owner}
                onChange={(event) => updateField('owner', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#5C1A2B]"
                placeholder="People Operations"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Purpose</label>
              <textarea
                value={form.purpose}
                onChange={(event) => updateField('purpose', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#5C1A2B]"
                rows={4}
                placeholder="Describe what the system is meant to do."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Domain context</label>
              <input
                value={form.domainContext}
                onChange={(event) => updateField('domainContext', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#5C1A2B]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Model type</label>
              <select
                value={form.modelType}
                onChange={(event) => updateField('modelType', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#5C1A2B]"
              >
                <option value="tabular_classifier">Tabular classifier</option>
                <option value="tabular_regressor">Tabular regressor</option>
                <option value="llm_app">LLM app</option>
                <option value="rag_system">RAG system</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Suggested risk tier</p>
              <p className="mt-2 text-xl font-semibold text-[#5C1A2B]">{suggestedTier}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Override risk tier</label>
              <select
                value={form.riskTier}
                onChange={(event) => updateField('riskTier', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#5C1A2B]"
              >
                <option value="minimal">Minimal</option>
                <option value="limited">Limited</option>
                <option value="high">High</option>
                <option value="unacceptable">Unacceptable</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Name</p>
              <p className="mt-1 font-medium text-slate-900">{form.name}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Purpose</p>
              <p className="mt-1 font-medium text-slate-900">{form.purpose}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Selected risk tier</p>
              <p className="mt-1 font-medium text-slate-900">{form.riskTier || suggestedTier}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-lg bg-[#5C1A2B] px-4 py-2 text-sm font-medium text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-lg bg-[#5C1A2B] px-4 py-2 text-sm font-medium text-white"
            >
              Create system
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
