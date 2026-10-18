import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'terminal';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isTouchOptimized?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isTouchOptimized = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-lg';

  const sizeStyles = {
    xs: isTouchOptimized ? 'min-h-[36px] px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-1 text-xs gap-1',
    sm: isTouchOptimized ? 'min-h-[42px] px-3 py-1.5 text-xs font-semibold gap-1.5' : 'px-2.5 py-1.5 text-xs gap-1.5',
    md: isTouchOptimized ? 'min-h-[46px] px-4 py-2.5 text-sm gap-2' : 'px-3.5 py-2 text-sm gap-2',
    lg: isTouchOptimized ? 'min-h-[52px] px-5 py-3 text-base gap-2.5' : 'px-4.5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm shadow-orange-950/50 focus:ring-orange-500 active:scale-[0.98]',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 focus:ring-slate-500 active:scale-[0.98]',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-950/50 focus:ring-rose-500 active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white focus:ring-slate-500',
    outline: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:ring-slate-500',
    terminal: 'bg-slate-900 font-mono text-emerald-400 border border-emerald-500/30 hover:bg-slate-800 hover:border-emerald-500/60 focus:ring-emerald-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
