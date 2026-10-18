import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-lg bg-slate-900 border border-slate-700/80 text-slate-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 cursor-pointer ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 py-1">
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && <span className="text-xs text-slate-400">{helperText}</span>}
    </div>
  );
};
