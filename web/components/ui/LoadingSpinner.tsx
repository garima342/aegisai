import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  label = 'Loading...',
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center p-8 text-stone-500 gap-3 ${className}`}
    >
      <Loader2
        className={`${sizeMap[size]} animate-spin text-[#5C1A2B]`}
        aria-hidden="true"
      />
      {label && <span className="text-sm font-medium">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-stone-200 rounded w-1/3" />
          <div className="h-4 bg-stone-100 rounded w-2/3" />
        </div>
        <div className="h-6 w-20 bg-stone-200 rounded-full" />
      </div>
      <div className="h-12 bg-stone-100 rounded-lg" />
      <div className="flex justify-between pt-2 border-t border-stone-100">
        <div className="h-4 w-24 bg-stone-200 rounded" />
        <div className="h-4 w-16 bg-stone-200 rounded" />
      </div>
    </div>
  );
}
