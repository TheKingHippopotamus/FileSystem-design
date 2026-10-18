import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg bg-slate-900 border text-slate-100 placeholder-slate-500 text-sm py-2 px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
            icon ? 'pl-9' : ''
          } ${error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700/80 focus:border-orange-500'} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-400">{helperText}</span>}
    </div>
  );
};
