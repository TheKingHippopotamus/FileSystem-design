import React, { useMemo, useState } from 'react';
import {
  Grid,
  CheckCircle2,
  HelpCircle,
  Folder,
  File,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import { flattenTree } from '../../logic/treeUtils';
import { FHSNode, Shareability, Volatility } from '../../types/fhs';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const FHSMatrixView: React.FC = () => {
  const { rootTree, selectedNodeId, setSelectedNodeId, updateNode } = useFHS();
  const [activeInfoTab, setActiveInfoTab] = useState<'matrix' | 'rationale'>('matrix');

  const allNodes = useMemo(() => {
    return flattenTree(rootTree).filter(n => n.path !== '/');
  }, [rootTree]);

  // Quadrant 1: Shareable & Static
  const shareableStatic = useMemo(() => {
    return allNodes.filter(n => n.shareability === 'shareable' && n.volatility === 'static');
  }, [allNodes]);

  // Quadrant 2: Shareable & Variable
  const shareableVariable = useMemo(() => {
    return allNodes.filter(n => n.shareability === 'shareable' && n.volatility === 'variable');
  }, [allNodes]);

  // Quadrant 3: Unshareable & Static
  const unshareableStatic = useMemo(() => {
    return allNodes.filter(n => n.shareability === 'unshareable' && n.volatility === 'static');
  }, [allNodes]);

  // Quadrant 4: Unshareable & Variable
  const unshareableVariable = useMemo(() => {
    return allNodes.filter(n => n.shareability === 'unshareable' && n.volatility === 'variable');
  }, [allNodes]);

  const renderQuadrantCard = (
    title: string,
    shareability: Shareability,
    volatility: Volatility,
    nodes: FHSNode[],
    examples: string[],
    bgAccent: string,
    borderAccent: string,
    badgeVariant: 'shareable' | 'unshareable' | 'static' | 'variable',
    purposeDescription: string
  ) => {
    const totalSize = Math.round(nodes.reduce((acc, n) => acc + (n.sizeMB || 0), 0));

    return (
      <div className={`flex flex-col rounded-2xl border p-4 sm:p-5 ${bgAccent} ${borderAccent} transition-all`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-100">{title}</h3>
              <Badge variant={badgeVariant} size="xs" dot>
                {shareability}
              </Badge>
              <Badge variant={volatility === 'static' ? 'static' : 'variable'} size="xs" dot>
                {volatility}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{purposeDescription}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono font-bold text-slate-200">{nodes.length} items</span>
            <span className="block text-[11px] font-mono text-slate-400">{totalSize} MB</span>
          </div>
        </div>

        {/* FHS Standard Real Examples Pill Bar */}
        <div className="py-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">FHS Examples:</span>
          {examples.map(ex => (
            <span key={ex} className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-750 text-[10px] font-mono text-slate-300">
              {ex}
            </span>
          ))}
        </div>

        {/* Active Nodes List in this Quadrant */}
        <div className="flex-1 overflow-y-auto max-h-56 space-y-1.5 pr-1 mt-1">
          {nodes.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              No files currently assigned to this quadrant.
            </div>
          ) : (
            nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-orange-500/20 border-orange-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {node.type === 'directory' ? (
                      <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="font-mono font-medium truncate">{node.path}</span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                    {node.sizeMB} MB
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto p-1 sm:p-2">
      {/* Top Banner explaining FHS 2x2 Separation */}
      <Card variant="default" padding="md" className="border-orange-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                FHS 2×2 Classification Matrix
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-normal">
                  Standard Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                The Filesystem Hierarchy Standard dictates directory placement based on two intersecting dimensions:
                <strong className="text-cyan-300"> Shareable vs. Unshareable</strong> and
                <strong className="text-emerald-300"> Static vs. Variable</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveInfoTab(prev => prev === 'matrix' ? 'rationale' : 'matrix')}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
              <span>{activeInfoTab === 'matrix' ? 'Why /var Separation?' : 'View Matrix'}</span>
            </button>
          </div>
        </div>

        {/* Educational Rationale Box */}
        {activeInfoTab === 'rationale' && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 animate-in fade-in">
            <h4 className="font-semibold text-orange-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              FHS Separation Principles & Read-Only Mounting
            </h4>
            <p>
              Static files (like binaries in <code className="text-emerald-300">/usr/bin</code>, libraries in <code className="text-emerald-300">/usr/lib</code>, and configs in <code className="text-purple-300">/etc</code>) do not change during normal operation. They can reside on read-only media and do not require continuous backups.
            </p>
            <p>
              In contrast, variable files (like logs in <code className="text-amber-300">/var/log</code>, spool mail in <code className="text-cyan-300">/var/mail</code>, and sockets in <code className="text-amber-300">/run</code>) change continuously.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
              <span className="text-amber-400 font-bold">Key Architectural Rule:</span>
              <span>
                The <code className="text-amber-300">/var</code> hierarchy was explicitly introduced to isolate variable files from static directories like <code className="text-emerald-300">/usr</code>, making <code className="text-emerald-300">/usr</code> safely mountable as <strong>read-only (ro)</strong> across multiple systems!
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* 2x2 Interactive Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Q1: Shareable & Static */}
        {renderQuadrantCard(
          'Shareable & Static',
          'shareable',
          'static',
          shareableStatic,
          ['/usr/bin', '/usr/lib', '/usr/share/doc', '/opt'],
          'bg-slate-900/90',
          'border-cyan-500/30',
          'shareable',
          'Can be hosted on a network server (NFS) and mounted read-only by multiple client systems. Does not change without sysadmin.'
        )}

        {/* Q2: Shareable & Variable */}
        {renderQuadrantCard(
          'Shareable & Variable',
          'shareable',
          'variable',
          shareableVariable,
          ['/var/mail', '/var/spool/news', '/srv'],
          'bg-slate-900/90',
          'border-amber-500/30',
          'shareable',
          'Can be shared with other hosts or users across network, but continuously modified during runtime (e.g. email inboxes).'
        )}

        {/* Q3: Unshareable & Static */}
        {renderQuadrantCard(
          'Unshareable & Static',
          'unshareable',
          'static',
          unshareableStatic,
          ['/etc', '/boot', '/lib/modules'],
          'bg-slate-900/90',
          'border-purple-500/30',
          'unshareable',
          'Host-specific system configuration and bootloader files. Cannot be shared with other machines, but remain static during operation.'
        )}

        {/* Q4: Unshareable & Variable */}
        {renderQuadrantCard(
          'Unshareable & Variable',
          'unshareable',
          'variable',
          unshareableVariable,
          ['/var/run', '/var/log', '/var/lock', '/tmp', '/home'],
          'bg-slate-900/90',
          'border-rose-500/30',
          'unshareable',
          'Machine-specific runtime volatile data (PIDs, lockfiles, operational log files, session tmp). Never shared, constantly updated.'
        )}
      </div>
    </div>
  );
};
