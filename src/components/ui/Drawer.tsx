import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'bottom' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'bottom',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-xs flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <div
        className={`relative z-10 w-full bg-slate-900 border-slate-700 shadow-2xl flex flex-col ${
          position === 'bottom'
            ? 'mt-auto max-h-[88vh] rounded-t-3xl border-t'
            : 'h-full max-w-md border-l'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile handle indicator */}
        {position === 'bottom' && (
          <div className="pt-3 pb-1 flex justify-center">
            <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 pb-6 sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
