'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('garima@university.edu');
  const [password, setPassword] = useState('password1234');
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Seamless simulated sign-in matching Figma prototype
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F7F2EB]">
      {/* Left Column: Dark Maroon AI Visuals matching media_1791734417024 */}
      <div className="w-full md:w-1/2 bg-[#380914] text-white p-8 md:p-14 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-white/30 flex items-center justify-center bg-white/5 shadow-xs">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-white">
            AegisAI
          </span>
        </div>

        {/* Hero Title & Neural Net Diagram */}
        <div className="relative z-10 my-10 space-y-8">
          <div className="space-y-3 max-w-lg">
            <h1 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
              Know the risk before your AI ships.
            </h1>
            <p className="text-[#E5CBD2] text-sm lg:text-base leading-relaxed">
              Sign in to run audits, track risk scores over time and download reports for your
              reviewers.
            </p>
          </div>

          {/* Interactive Neural Net Flowchart */}
          <div className="relative p-6 rounded-2xl bg-black/25 border border-white/10 max-w-lg">
            {/* Vertical bright divider bar */}
            <div className="absolute top-0 bottom-0 left-[55%] w-0.5 bg-gradient-to-b from-transparent via-white/80 to-transparent shadow-[0_0_12px_rgba(255,255,255,0.8)] z-10" />

            <svg className="w-full h-44 overflow-visible" viewBox="0 0 340 140" fill="none">
              {/* Background faint synapses */}
              <line x1="30" y1="40" x2="110" y2="25" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="30" y1="70" x2="110" y2="70" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="30" y1="100" x2="110" y2="115" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="110" y1="25" x2="190" y2="35" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="110" y1="70" x2="190" y2="70" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="110" y1="115" x2="190" y2="105" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="190" y1="35" x2="280" y2="70" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="190" y1="70" x2="280" y2="70" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
              <line x1="190" y1="105" x2="280" y2="70" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />

              {/* Glowing decision pathway */}
              <path
                d="M 30 70 L 110 70 L 190 70 L 280 70"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              />

              {/* Layer 1 Nodes (Inputs) */}
              <circle cx="30" cy="40" r="4.5" stroke="#E5CBD2" strokeWidth="1.5" fill="#380914" />
              <circle cx="30" cy="70" r="5" fill="#FFFFFF" />
              <circle cx="30" cy="70" r="9" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
              <circle cx="30" cy="100" r="4.5" stroke="#E5CBD2" strokeWidth="1.5" fill="#380914" />

              {/* Layer 2 Nodes (Features) */}
              <circle cx="110" cy="25" r="4" stroke="#E5CBD2" strokeWidth="1.5" fill="#380914" />
              <circle cx="110" cy="70" r="5" fill="#FFFFFF" />
              <circle cx="110" cy="115" r="4" stroke="#E5CBD2" strokeWidth="1.5" fill="#380914" />

              {/* Layer 3 Nodes (Model) */}
              <circle cx="190" cy="35" r="4" stroke="#E5CBD2" strokeWidth="1.5" fill="#380914" />
              <circle cx="190" cy="70" r="5" fill="#FFFFFF" />
              <circle cx="190" cy="70" r="9" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
              <circle cx="190" cy="105" r="4" stroke="#E5CBD2" strokeWidth="1.5" fill="#380914" />

              {/* Layer 4 Node (Decision) */}
              <circle cx="280" cy="70" r="4.5" stroke="#E5CBD2" strokeWidth="1.5" fill="#380914" />
            </svg>

            {/* Column labels */}
            <div className="flex justify-between text-[11px] font-mono text-[#D8BCC3] px-2 pt-2 border-t border-white/10">
              <span>inputs</span>
              <span>features</span>
              <span>model</span>
              <span>decision</span>
            </div>
          </div>
        </div>

        {/* Bottom 3 Stats */}
        <div className="relative z-10 pt-6 border-t border-white/15 grid grid-cols-3 gap-4">
          <div>
            <p className="font-serif text-3xl font-bold text-white">5</p>
            <p className="text-xs text-[#D8BCC3] mt-0.5">risk areas</p>
          </div>
          <div className="border-l border-white/15 pl-4">
            <p className="font-serif text-3xl font-bold text-white">0 to 100</p>
            <p className="text-xs text-[#D8BCC3] mt-0.5">risk score</p>
          </div>
          <div className="border-l border-white/15 pl-4">
            <p className="font-serif text-3xl font-bold text-white">PDF</p>
            <p className="text-xs text-[#D8BCC3] mt-0.5">audit report</p>
          </div>
        </div>
      </div>

      {/* Right Column: Sign In Form matching media_1791734417024 */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-14 lg:p-20 bg-[#F7F2EB]">
        <div className="max-w-md w-full space-y-6">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#2A0913]">
              Welcome back
            </h2>
            <p className="text-xs lg:text-sm text-[#7A6660] mt-1.5">
              Sign in to your AegisAI workspace.
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#D5C7B8] bg-white text-xs font-semibold text-[#2A0913] hover:bg-[#FDFBF7] transition shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#D5C7B8] bg-white text-xs font-semibold text-[#2A0913] hover:bg-[#FDFBF7] transition shadow-2xs"
            >
              <svg className="w-4 h-4 fill-current text-[#2A0913]" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#E8DFD5]" />
            <span className="absolute bg-[#F7F2EB] px-3 text-xs text-[#9B898E]">
              or use your email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A0913] mb-1.5">
                Work email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B80]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5C7B8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A101D]/20 focus:border-[#4A101D] text-[#2A0913] shadow-2xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A0913] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B80]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5C7B8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A101D]/20 focus:border-[#4A101D] text-[#2A0913] shadow-2xs tracking-widest font-mono transition"
                />
              </div>
            </div>

            {/* Checkbox & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#2A0913]">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4A101D] focus:ring-[#4A101D] border-[#D5C7B8] accent-[#4A101D]"
                />
                <span>Keep me signed in</span>
              </label>
              <a href="#" className="font-semibold text-[#2A0913] hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#4A101D] hover:bg-[#5F1525] text-white rounded-xl text-sm font-semibold transition shadow-xs mt-2"
            >
              Sign in
            </button>
          </form>

          {/* Create account link */}
          <div className="text-center text-xs text-[#7A6660] pt-2">
            New to AegisAI?{' '}
            <Link href="/" className="font-bold text-[#2A0913] hover:underline">
              Create an account
            </Link>
          </div>

          {/* Encryption assurance */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8C7B80] pt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6B5A5F]" />
            <span>Uploaded models and data are encrypted at rest</span>
          </div>
        </div>
      </div>
    </div>
  );
}
