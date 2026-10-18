import React from 'react';
import { Shareability, Volatility } from '../../types/fhs';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'shareable' | 'unshareable' | 'static' | 'variable' | 'error' | 'warning' | 'info' | 'success' | 'neutral' | 'fhs';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  dot = false,
}) => {
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded font-medium',
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md font-semibold',
  };

  const variantStyles = {
    shareable: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
    unshareable: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
    static: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    variable: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    error: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    info: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    fhs: 'bg-orange-500/10 text-orange-400 border border-orange-500/30 font-mono',
  };

  const dotColors = {
    shareable: 'bg-cyan-400',
    unshareable: 'bg-purple-400',
    static: 'bg-emerald-400',
    variable: 'bg-amber-400',
    error: 'bg-rose-400',
    warning: 'bg-amber-400',
    info: 'bg-blue-400',
    success: 'bg-emerald-400',
    neutral: 'bg-slate-400',
    fhs: 'bg-orange-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const FHSClassificationBadge: React.FC<{
  shareability: Shareability;
  volatility: Volatility;
  compact?: boolean;
}> = ({ shareability, volatility, compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 font-mono text-[10px]">
        <span
          title={`Shareability: ${shareability}`}
          className={`px-1 py-0.2 rounded border ${
            shareability === 'shareable'
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
          }`}
        >
          {shareability === 'shareable' ? 'SH' : 'UN'}
        </span>
        <span
          title={`Volatility: ${volatility}`}
          className={`px-1 py-0.2 rounded border ${
            volatility === 'static'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          }`}
        >
          {volatility === 'static' ? 'STAT' : 'VAR'}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <Badge variant={shareability === 'shareable' ? 'shareable' : 'unshareable'} size="xs" dot>
        {shareability}
      </Badge>
      <Badge variant={volatility === 'static' ? 'static' : 'variable'} size="xs" dot>
        {volatility}
      </Badge>
    </div>
  );
};
