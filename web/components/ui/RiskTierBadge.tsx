import React from 'react';
import { RiskTier } from '@/lib/types/system';
import { ShieldCheck, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface RiskTierBadgeProps {
  tier: RiskTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const tierConfig: Record<
  RiskTier,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  minimal: {
    label: 'Minimal Risk',
    bg: 'bg-emerald-50 text-emerald-800',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: ShieldCheck,
    description: 'General utility AI with low or negligible impact.',
  },
  limited: {
    label: 'Limited Risk',
    bg: 'bg-amber-50 text-amber-800',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: AlertCircle,
    description: 'Requires transparency and disclosure under EU AI Act Art. 50.',
  },
  high: {
    label: 'High Risk',
    bg: 'bg-rose-50 text-rose-800',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: AlertTriangle,
    description: 'Strict compliance, bias audits & human oversight required (Annex III).',
  },
  unacceptable: {
    label: 'Unacceptable Risk',
    bg: 'bg-red-100 text-red-900',
    text: 'text-red-900',
    border: 'border-red-300',
    icon: ShieldAlert,
    description: 'Prohibited under EU AI Act Article 5 (e.g. social scoring, dark patterns).',
  },
};

export function RiskTierBadge({
  tier,
  size = 'md',
  showIcon = true,
  className = '',
}: RiskTierBadgeProps) {
  const config = tierConfig[tier] || tierConfig.minimal;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-colors ${config.bg} ${config.border} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`Risk tier: ${config.label}`}
      title={config.description}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
}
