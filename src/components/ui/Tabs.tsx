import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  badgeVariant?: 'error' | 'warning' | 'info' | 'neutral';
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills' | 'mobile-bar';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeId,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  if (variant === 'mobile-bar') {
    return (
      <nav
        aria-label="Mobile navigation"
        className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 py-2 safe-area-pb ${className}`}
      >
        {tabs.map(tab => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer select-none relative ${
                isActive ? 'text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge !== 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[58px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 ${className}`}>
        {tabs.map(tab => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-950/60'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750'
              }`}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-orange-800 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant
  return (
    <div className={`border-b border-slate-800 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              isActive
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== 0 && (
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
