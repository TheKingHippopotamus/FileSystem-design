import React from 'react';
import {
  FileText,
  Folder,
  HardDrive,
  Shield,
  Layers,
  Trash2,
  Edit,
  Plus,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import { calculateTreeSize, countTreeNodes } from '../../logic/treeUtils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge, FHSClassificationBadge } from '../ui/Badge';
import { Select } from '../ui/Select';

interface NodeInspectorProps {
  onAddChild?: () => void;
  onEdit?: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  onAddChild,
  onEdit,
}) => {
  const {
    selectedNode,
    updateNode,
    deleteNode,
    validationIssues,
    platformSettings,
  } = useFHS();

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-900/60 border border-slate-800 rounded-xl">
        <Layers className="w-10 h-10 text-slate-600 mb-2" />
        <p className="text-sm font-medium">Select a file or directory from the tree to inspect its FHS architecture properties.</p>
      </div>
    );
  }

  const subtreeSize = calculateTreeSize(selectedNode);
  const { dirs, files } = countTreeNodes(selectedNode);

  const nodeIssues = validationIssues.filter(i => i.nodeId === selectedNode.id || i.path === selectedNode.path);
  const isSmartphone = platformSettings.mode === 'smartphone';

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 truncate">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
            {selectedNode.type === 'directory' ? (
              <Folder className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
          </div>
          <div className="truncate">
            <h3 className="text-base font-mono font-bold text-slate-100 truncate">
              {selectedNode.path}
            </h3>
            <span className="text-xs text-slate-400 capitalize">
              {selectedNode.type} &bull; {selectedNode.isStandardFHS ? 'FHS 3.0 Standard' : 'Custom'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button variant="secondary" size="xs" onClick={onEdit} icon={<Edit className="w-3.5 h-3.5" />}>
              Edit
            </Button>
          )}
          {selectedNode.id !== 'node-root' && (
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Delete node"
              aria-label="Delete selected node"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Validation Issues for Selected Node */}
        {nodeIssues.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>FHS Architectural Violation:</span>
            </div>
            {nodeIssues.map(iss => (
              <p key={iss.id} className="text-xs leading-relaxed text-slate-200">
                {iss.message}
              </p>
            ))}
          </div>
        )}

        {/* Description / Purpose */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block">
            FHS Role & Purpose
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {selectedNode.description || 'No description provided.'}
          </p>
        </div>

        {/* Two FHS Dimensions Interactive Classification */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 text-xs">FHS Classification Dimensions</span>
            <FHSClassificationBadge
              shareability={selectedNode.shareability}
              volatility={selectedNode.volatility}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Shareability:</label>
              <select
                value={selectedNode.shareability}
                onChange={e => updateNode(selectedNode.id, { shareability: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 cursor-pointer focus:border-orange-500"
              >
                <option value="shareable">Shareable (NFS / Multi-host)</option>
                <option value="unshareable">Unshareable (Host-specific)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Volatility:</label>
              <select
                value={selectedNode.volatility}
                onChange={e => updateNode(selectedNode.id, { volatility: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 cursor-pointer focus:border-orange-500"
              >
                <option value="static">Static (Read-only safe)</option>
                <option value="variable">Variable (Modified at runtime)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subtree Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Size</span>
            <span className="text-sm font-mono font-bold text-orange-400">{subtreeSize} MB</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Directories</span>
            <span className="text-sm font-mono font-bold text-amber-400">{dirs}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Files</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{files}</span>
          </div>
        </div>

        {/* Linux System Metadata: Permissions, Owner, Mount */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850">
            <span className="text-slate-400">Mode / Permissions:</span>
            <span className="text-emerald-400 font-bold">{selectedNode.permissions}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850">
            <span className="text-slate-400">Ownership:</span>
            <span className="text-slate-200">{selectedNode.owner}</span>
          </div>
          {selectedNode.mountPoint && (
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850">
              <span className="text-slate-400">Mount Point:</span>
              <span className="text-cyan-400">{selectedNode.mountPoint}</span>
            </div>
          )}
          {selectedNode.mountOptions && (
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400">Mount Flags:</span>
              <span className="text-purple-400">{selectedNode.mountOptions.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Quick Add Child Button */}
        {selectedNode.type === 'directory' && onAddChild && (
          <Button
            variant="secondary"
            fullWidth
            icon={<Plus className="w-4 h-4 text-emerald-400" />}
            onClick={onAddChild}
          >
            Add Subdirectory or File Here
          </Button>
        )}
      </div>
    </div>
  );
};
