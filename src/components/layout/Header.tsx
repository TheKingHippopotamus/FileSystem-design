import React, { useState } from 'react';
import {
  FolderTree,
  Undo2,
  Redo2,
  Sliders,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Monitor,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import { Button } from '../ui/Button';
import { PlatformSettingsModal } from '../settings/PlatformSettingsModal';
import { PresetModal } from '../presets/PresetModal';

export const Header: React.FC = () => {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    validationIssues,
    activePlatformView,
    setActivePlatformView,
    setActiveTab,
    toastMessage,
    showToast,
  } = useFHS();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  const errors = validationIssues.filter(i => i.severity === 'error');
  const warnings = validationIssues.filter(i => i.severity === 'warning');

  const togglePlatform = () => {
    const next = activePlatformView === 'web' ? 'smartphone' : 'web';
    setActivePlatformView(next);
    showToast(`Switched view to ${next === 'smartphone' ? 'Smartphone Mobile Profile' : 'Web Workstation Profile'}`);
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 select-none">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-950/60 font-bold shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>FHS</span>
                <span className="text-orange-400">Architect</span>
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/30">
                FHS 3.0 Standard
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium">
              Ubuntu Linux Filesystem Designer & Architecture Planner
            </p>
          </div>
        </div>

        {/* Center: Undo/Redo & Compliance Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          {activePlatformView !== 'smartphone' && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
                title="Undo (Ctrl+Z)"
                aria-label="Undo filesystem modification"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
                title="Redo (Ctrl+Y)"
                aria-label="Redo filesystem modification"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Compliance Status Badge */}
          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              errors.length > 0
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                : warnings.length > 0
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
            }`}
          >
            {errors.length > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="font-mono text-[11px] sm:text-xs">
              {errors.length > 0
                ? `${errors.length} Issues`
                : warnings.length > 0
                ? `${warnings.length} Warn`
                : '100% FHS'}
            </span>
          </button>
        </div>

        {/* Right Tools: Presets, Platform Switcher & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Preset Architectures */}
          {activePlatformView !== 'smartphone' && (
            <Button
              variant="secondary"
              size="xs"
              icon={<Layers className="w-3.5 h-3.5 text-orange-400" />}
              onClick={() => setIsPresetsOpen(true)}
            >
              Templates
            </Button>
          )}

          {/* Quick Platform Switcher (Web <-> Smartphone) */}
          <button
            onClick={togglePlatform}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
              activePlatformView === 'smartphone'
                ? 'bg-orange-500/15 border-orange-500/50 text-orange-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle between Web Desktop and Smartphone Mobile ergonomics"
            aria-label={`Switch to ${activePlatformView === 'web' ? 'Smartphone' : 'Web'} layout`}
          >
            {activePlatformView === 'smartphone' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden md:inline">Mobile Mode</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Desktop Mode</span>
              </>
            )}
          </button>

          {/* Platform Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Platform Settings"
            aria-label="Open platform settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <PlatformSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <PresetModal isOpen={isPresetsOpen} onClose={() => setIsPresetsOpen(false)} />
    </>
  );
};
