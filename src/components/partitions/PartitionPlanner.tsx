import React, { useState } from 'react';
import {
  HardDrive,
  Plus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import { PartitionPlan } from '../../types/fhs';
import { generateFstab } from '../../logic/export';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export const PartitionPlanner: React.FC = () => {
  const { partitions, addPartition, updatePartition, deletePartition, showToast } = useFHS();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedFstab, setCopiedFstab] = useState(false);

  // New partition form state
  const [mountPoint, setMountPoint] = useState('/opt');
  const [device, setDevice] = useState('/dev/sda5');
  const [fsType, setFsType] = useState<'ext4' | 'btrfs' | 'xfs' | 'zfs' | 'tmpfs'>('ext4');
  const [sizeGB, setSizeGB] = useState(25);
  const [options, setOptions] = useState('defaults');
  const [readOnly, setReadOnly] = useState(false);
  const [description, setDescription] = useState('Add-on packages partition');

  const totalDiskSizeGB = partitions.reduce((sum, p) => sum + p.sizeGB, 0);

  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
  ];

  const handleCreatePartition = () => {
    addPartition({
      mountPoint,
      device,
      fsType,
      sizeGB: Number(sizeGB) || 10,
      options: readOnly ? (options.includes('ro') ? options : `ro,${options}`) : options,
      dump: 0,
      pass: mountPoint === '/' ? 1 : 2,
      readOnly,
      description,
    });
    setIsAddModalOpen(false);
  };

  const handleCopyFstab = () => {
    const content = generateFstab(partitions);
    navigator.clipboard.writeText(content);
    setCopiedFstab(true);
    showToast('Copied /etc/fstab to clipboard');
    setTimeout(() => setCopiedFstab(false), 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto p-1 sm:p-2">
      {/* Overview Card & Visual Partition Bar */}
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Filesystem Partition & Mount Planner</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Design disk partitions, assign FHS mount points, enforce read-only /usr, and generate production <code className="text-orange-400">/etc/fstab</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Partition
            </Button>
          </div>
        </div>

        {/* Visual Disk Allocation Bar */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
            <span>Disk Layout Allocation:</span>
            <span className="font-bold text-orange-400">{totalDiskSizeGB} GB Planned Total</span>
          </div>

          <div className="w-full h-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex shadow-inner">
            {partitions.map((part, idx) => {
              const widthPct = Math.max((part.sizeGB / totalDiskSizeGB) * 100, 4);
              const colorClass = colors[idx % colors.length];
              return (
                <div
                  key={part.id}
                  style={{ width: `${widthPct}%` }}
                  title={`${part.mountPoint} (${part.sizeGB}GB, ${part.fsType}${part.readOnly ? ', ro' : ''})`}
                  className={`${colorClass} hover:brightness-110 border-r border-slate-900 transition-all flex items-center justify-center text-[11px] font-mono font-bold text-white px-1 overflow-hidden truncate cursor-pointer`}
                >
                  {part.mountPoint}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-1 text-[11px] font-mono text-slate-400">
            {partitions.map((part, idx) => (
              <div key={part.id} className="flex items-center gap-1.5 shrink-0">
                <span className={`w-2.5 h-2.5 rounded-sm ${colors[idx % colors.length]}`} />
                <span>{part.mountPoint}</span>
                <span className="text-slate-500">({part.sizeGB}G)</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Partition Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100">Mount Points & Filesystem Specifications</h3>
          <span className="text-xs text-slate-400 font-mono">{partitions.length} partitions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono">
                <th className="py-2.5 px-4 font-semibold">Mount Point</th>
                <th className="py-2.5 px-4 font-semibold">Device</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Size</th>
                <th className="py-2.5 px-4 font-semibold">Mount Flags</th>
                <th className="py-2.5 px-4 font-semibold">Read-Only</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {partitions.map(part => {
                const isUsrRoCompliant = part.mountPoint === '/usr' ? part.readOnly : true;

                return (
                  <tr key={part.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{part.mountPoint}</span>
                      {part.mountPoint === '/usr' && part.readOnly && (
                        <span title="FHS Compliant: /usr mounted read-only" className="text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{part.device}</td>
                    <td className="py-3 px-4 text-cyan-300 font-semibold">{part.fsType}</td>
                    <td className="py-3 px-4 text-slate-200">{part.sizeGB} GB</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[140px]">{part.options}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => updatePartition(part.id, { readOnly: !part.readOnly })}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                          part.readOnly
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {part.readOnly ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {part.readOnly ? 'ro' : 'rw'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {part.mountPoint !== '/' && (
                        <button
                          onClick={() => deletePartition(part.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                          aria-label={`Delete partition ${part.mountPoint}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generated /etc/fstab Preview Card */}
      <Card variant="default" padding="md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200">Generated /etc/fstab Configuration</h3>
          </div>
          <Button
            variant="secondary"
            size="xs"
            icon={copiedFstab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyFstab}
          >
            {copiedFstab ? 'Copied!' : 'Copy fstab'}
          </Button>
        </div>
        <pre className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] sm:text-xs text-emerald-400/90 overflow-x-auto leading-relaxed">
          {generateFstab(partitions)}
        </pre>
      </Card>

      {/* Add Partition Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Filesystem Partition"
        description="Allocate storage device and mount options"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePartition}>
              Mount Partition
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Mount Point"
              value={mountPoint}
              placeholder="/data or /srv"
              onChange={e => setMountPoint(e.target.value)}
              required
            />
            <Input
              label="Device Name / UUID"
              value={device}
              placeholder="/dev/sdb1 or tmpfs"
              onChange={e => setDevice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Filesystem Type"
              value={fsType}
              onChange={e => setFsType(e.target.value as any)}
              options={[
                { value: 'ext4', label: 'ext4 (Standard Linux)' },
                { value: 'btrfs', label: 'btrfs (CoW & Snapshots)' },
                { value: 'xfs', label: 'xfs (High-Performance)' },
                { value: 'zfs', label: 'zfs (Enterprise Storage)' },
                { value: 'tmpfs', label: 'tmpfs (RAM Ephemeral)' },
              ]}
            />
            <Input
              label="Size (GB)"
              type="number"
              value={sizeGB}
              onChange={e => setSizeGB(Number(e.target.value))}
            />
            <Select
              label="Access Mode"
              value={readOnly ? 'ro' : 'rw'}
              onChange={e => setReadOnly(e.target.value === 'ro')}
              options={[
                { value: 'rw', label: 'Read-Write (rw)' },
                { value: 'ro', label: 'Read-Only (ro)' },
              ]}
            />
          </div>

          <Input
            label="Mount Options"
            value={options}
            placeholder="defaults,noatime,nodev"
            onChange={e => setOptions(e.target.value)}
          />

          <Input
            label="Purpose Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
