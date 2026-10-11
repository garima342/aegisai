'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Plus,
  Shield,
  FileText,
  BarChart2,
  Sliders,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutGrid,
      isActive: pathname === '/',
    },
    {
      label: 'New audit',
      href: '/systems/new',
      icon: Plus,
      prefix: '+ ',
      isActive: pathname.startsWith('/systems/new'),
    },
    {
      label: 'Results',
      href: '/systems/sys-hr-recruitment-01',
      icon: Shield,
      isActive: pathname.includes('/results') || (pathname.startsWith('/systems/sys-hr') && !pathname.includes('/new')),
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: FileText,
      isActive: pathname.startsWith('/reports'),
    },
    {
      label: 'History',
      href: '/systems',
      icon: BarChart2,
      isActive: pathname === '/systems' || pathname === '/history',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Sliders,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <aside className="w-64 bg-[#380914] text-white flex flex-col h-screen shrink-0 border-r border-[#4A101D] shadow-xl select-none">
      {/* Brand Logo Header */}
      <div className="p-6 flex items-center gap-3">
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

      {/* Navigation List */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                active
                  ? 'bg-[#F7F2EB] text-[#380914] font-semibold shadow-xs'
                  : 'text-[#E5CBD2] hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? 'text-[#380914] stroke-[2.2]' : 'text-[#E5CBD2]'
                }`}
              />
              <span>{item.prefix ? item.prefix + item.label : item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Workspace Profile Footer */}
      <Link
        href="/login"
        title="Switch user or view Sign-in page"
        className="p-4 mx-3 mb-4 rounded-xl bg-black/15 border border-white/10 flex items-center gap-3 hover:bg-black/25 transition group cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-[#F7F2EB] text-[#380914] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
          G
        </div>
        <div className="truncate">
          <p className="text-sm font-semibold text-white truncate">Garima Sethi</p>
          <p className="text-[11px] text-[#D8BCC3] truncate">Workspace owner</p>
        </div>
      </Link>
    </aside>
  );
}
