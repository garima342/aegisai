'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalonePage = pathname === '/login' || pathname === '/landing';

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F2EB] w-full">
      {/* Sidebar matching Figma design */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#F7F2EB]">
        <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen overflow-hidden bg-[#F7F2EB] w-full">
          <main className="flex-1 overflow-auto bg-[#F7F2EB]">
            <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10">
              {children}
            </div>
          </main>
        </div>
      }
    >
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
