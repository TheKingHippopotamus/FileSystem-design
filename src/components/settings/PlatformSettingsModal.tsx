import React from 'react';
import {
  Smartphone,
  Monitor,
  Sliders,
  ShieldCheck,
  Palette,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface PlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformSettingsModal: React.FC<PlatformSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    platformSettings,
    updatePlatformSettings,
    activePlatformView,
    setActivePlatformView,
    showToast,
  } = useFHS();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-orange-400" />
          <span>Platform Settings & Ergonomics</span>
        </div>
      }
      description="Configure independent visual, touch, and validation behaviors for Web and Smartphones."
      maxWidth="xl"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Platform Viewport Switcher */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Active Platform Experience:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActivePlatformView('web');
                showToast('Switched to Web Workstation layout');
              }}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                activePlatformView === 'web'
                  ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-5 h-5 text-orange-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold">Web / Desktop</div>
                <div className="text-[11px] text-slate-400">Multi-column, terminal dock, split inspector</div>
              </div>
            </button>

            <button
              onClick={() => {
                setActivePlatformView('smartphone');
                showToast('Switched to Smartphone Mobile layout');
              }}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                activePlatformView === 'smartphone'
                  ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-5 h-5 text-orange-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold">Smartphone / Mobile</div>
                <div className="text-[11px] text-slate-400">Touch drawer, bottom bar, 44px tap targets</div>
              </div>
            </button>
          </div>
        </div>

        {/* Smartphone-Specific Settings */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Smartphone Platform Settings
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Touch Target Ergonomics"
              value={platformSettings.touchTargetSize}
              onChange={e => updatePlatformSettings({ touchTargetSize: e.target.value as any })}
              options={[
                { value: 'large', label: 'Large (Min 44px - Thumb Friendly)' },
                { value: 'standard', label: 'Standard (Compact rows)' },
              ]}
              helperText="Enlarges click zones and handles for smartphones."
            />

            <Select
              label="Hierarchy Move Mode"
              value={platformSettings.dragAndDropMode}
              onChange={e => updatePlatformSettings({ dragAndDropMode: e.target.value as any })}
              options={[
                { value: 'touch-handles', label: 'Touch Drag Handles & Tap Sheet' },
                { value: 'tap-to-move', label: 'Tap-to-Move Sheet Only' },
                { value: 'pointer', label: 'Native Pointer Drag' },
              ]}
              helperText="Determines how items are moved and reparented on touchscreens."
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Battery Saver / Low-Spec Animation</span>
              <span className="text-[11px] text-slate-400">Reduces GPU transitions on mobile devices</span>
            </div>
            <input
              type="checkbox"
              checked={platformSettings.lowSpecAnimation}
              onChange={e => updatePlatformSettings({ lowSpecAnimation: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Web-Specific Settings */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-emerald-400" />
            Web Workstation Settings
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Display Density"
              value={platformSettings.displayDensity}
              onChange={e => updatePlatformSettings({ displayDensity: e.target.value as any })}
              options={[
                { value: 'comfortable', label: 'Comfortable (Standard workbench)' },
                { value: 'compact', label: 'Compact (High information density)' },
              ]}
            />

            <Select
              label="Default Partition Filesystem"
              value={platformSettings.defaultFsType}
              onChange={e => updatePlatformSettings({ defaultFsType: e.target.value as any })}
              options={[
                { value: 'ext4', label: 'ext4 (Default Ubuntu)' },
                { value: 'btrfs', label: 'btrfs' },
                { value: 'xfs', label: 'xfs' },
              ]}
            />
          </div>
        </div>

        {/* FHS Validator Strictness */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            FHS 3.0 Architecture Standards Engine
          </h4>

          <Select
            label="Validation Strictness"
            value={platformSettings.validationStrictness}
            onChange={e => updatePlatformSettings({ validationStrictness: e.target.value as any })}
            options={[
              { value: 'strict', label: 'Strict FHS 3.0 Standard (Enforce all root & /usr rules)' },
              { value: 'relaxed', label: 'Relaxed Developer Mode (Allow custom root dirs with warning)' },
            ]}
            helperText="Strict mode enforces Ubuntu Filesystem Hierarchy Standard rules."
          />
        </div>
      </div>
    </Modal>
  );
};
