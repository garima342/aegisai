'use client';

import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.info('Login requested for', email);
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5C1A2B]">Welcome back</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Sign in to AegisAI</h1>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-[#5C1A2B]"
              placeholder="team@company.com"
            />
          </label>

          <label className="block text-sm text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-[#5C1A2B]"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#5C1A2B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#742338]"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
