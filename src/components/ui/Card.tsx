import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'sunken' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
}) => {
  const base = 'rounded-xl transition-all duration-150';

  const variants = {
    default: 'bg-slate-900/90 border border-slate-800/80 shadow-md shadow-black/20',
    elevated: 'bg-slate-850 border border-slate-700/80 shadow-xl shadow-black/40',
    sunken: 'bg-slate-950/80 border border-slate-850',
    bordered: 'bg-transparent border border-slate-800 hover:border-slate-700',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 md:p-5',
    lg: 'p-5 md:p-6',
  };

  return (
    <div
      onClick={onClick}
      className={`${base} ${variants[variant]} ${paddings[padding]} ${onClick ? 'cursor-pointer hover:border-slate-700 active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
