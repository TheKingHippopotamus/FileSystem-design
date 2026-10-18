import React from 'react';
import { Layers, CheckCircle, Server, Cloud, ShieldCheck } from 'lucide-react';
import { PRESET_ARCHITECTURES } from '../../logic/fhsData';
import { useFHS } from '../../context/FHSContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({ isOpen, onClose }) => {
  const { loadPreset } = useFHS();

  const getIcon = (id: string) => {
    if (id.includes('readonly')) return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    if (id.includes('container')) return <Cloud className="w-5 h-5 text-cyan-400" />;
    return <Server className="w-5 h-5 text-orange-400" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-orange-400" />
          <span>Filesystem Architecture Templates</span>
        </div>
      }
      description="Select a pre-configured architecture baseline compliant with standard conventions."
      maxWidth="xl"
    >
      <div className="space-y-3 py-1">
        {PRESET_ARCHITECTURES.map(preset => (
          <div
            key={preset.id}
            onClick={() => {
              loadPreset(preset.id);
              onClose();
            }}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/60 hover:bg-slate-900/80 transition-all cursor-pointer flex items-start justify-between gap-3 group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-orange-500/40 shrink-0">
                {getIcon(preset.id)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-orange-400 transition-colors">
                    {preset.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                    {preset.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {preset.description}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <span>{preset.partitions.length} partitions</span> &bull;{' '}
                  <span>FHS 3.0 / Ubuntu compliant</span>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="xs" className="shrink-0 self-center">
              Load Blueprint
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
};
