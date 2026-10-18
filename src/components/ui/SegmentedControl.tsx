import React from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div className={`inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl ${className}`}>
      {options.map(opt => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all cursor-pointer ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
            } ${
              isSelected
                ? 'bg-slate-800 text-orange-400 font-semibold shadow-xs shadow-black/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
