import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FileCode,
  HardDrive,
  AlertTriangle,
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  MoveRight,
  Info,
} from 'lucide-react';
import { FHSNode } from '../../types/fhs';
import { useFHS } from '../../context/FHSContext';
import { FHSClassificationBadge } from '../ui/Badge';

interface TreeNodeItemProps {
  node: FHSNode;
  depth?: number;
  onAddChild: (node: FHSNode) => void;
  onEdit: (node: FHSNode) => void;
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  depth = 0,
  onAddChild,
  onEdit,
}) => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    expandedNodeIds,
    toggleNodeExpanded,
    deleteNode,
    moveNode,
    draggedNodeId,
    setDraggedNodeId,
    setQuickMoveNodeId,
    validationIssues,
    platformSettings,
  } = useFHS();

  const [isDragOver, setIsDragOver] = useState(false);

  const isExpanded = expandedNodeIds.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isDirectory = node.type === 'directory';

  // Find issues affecting this specific node
  const nodeIssues = validationIssues.filter(i => i.nodeId === node.id || i.path === node.path);
  const hasError = nodeIssues.some(i => i.severity === 'error');
  const hasWarning = nodeIssues.some(i => i.severity === 'warning');

  // Drag and drop handlers (HTML5 native)
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    if (node.id === 'node-root') return;
    setDraggedNodeId(node.id);
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNodeId || draggedNodeId === node.id) return;
    if (isDirectory) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!draggedNodeId || draggedNodeId === node.id) return;
    if (isDirectory) {
      moveNode(draggedNodeId, node.id);
      setDraggedNodeId(null);
    }
  };

  const getNodeIcon = () => {
    if (node.mountPoint) {
      return <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (isDirectory) {
      if (isExpanded) {
        return <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />;
      }
      return <Folder className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (node.name.endsWith('.conf') || node.name.endsWith('.cfg') || node.name === 'fstab') {
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const isSmartphone = platformSettings.mode === 'smartphone';

  return (
    <div className="flex flex-col select-none">
      <div
        draggable={!isSmartphone && node.id !== 'node-root'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => setSelectedNodeId(node.id)}
        style={{ paddingLeft: `${Math.min(depth * (isSmartphone ? 14 : 18) + 6, 180)}px` }}
        className={`group relative flex items-center justify-between pr-2 py-1.5 sm:py-1 rounded-lg transition-all cursor-pointer border ${
          isSmartphone ? 'min-h-[44px]' : 'min-h-[34px]'
        } ${
          isSelected
            ? 'bg-orange-500/15 border-orange-500/50 text-white'
            : isDragOver
            ? 'bg-blue-500/20 border-blue-400 border-dashed text-blue-200'
            : 'border-transparent hover:bg-slate-850/80 text-slate-200'
        }`}
      >
        {/* Left section: expand toggle, icon, name, flags */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          {/* DnD handle for touch/desktop */}
          {node.id !== 'node-root' && (
            <div
              className={`text-slate-500 hover:text-slate-300 cursor-grab ${
                isSmartphone ? 'p-1' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Drag to re-order or move"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Folder expansion chevron */}
          {isDirectory ? (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                toggleNodeExpanded(node.id);
              }}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 cursor-pointer"
              aria-label={isExpanded ? 'Collapse directory' : 'Expand directory'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Node Icon */}
          {getNodeIcon()}

          {/* Node Name */}
          <span className={`font-mono text-xs sm:text-sm font-semibold truncate ${
            isDirectory ? 'text-slate-100' : 'text-slate-300'
          }`}>
            {node.name}
            {isDirectory && node.name !== '/' ? '/' : ''}
          </span>

          {/* Mount point indicator */}
          {node.mountPoint && (
            <span
              title={`Mounted on ${node.mountPoint}`}
              className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hidden sm:inline-block"
            >
              [mount: {node.mountPoint}]
            </span>
          )}

          {/* Classification badge */}
          <FHSClassificationBadge
            shareability={node.shareability}
            volatility={node.volatility}
            compact={isSmartphone}
          />

          {/* Violation warning marker */}
          {hasError && (
            <span title={nodeIssues[0]?.title} className="text-rose-400 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            </span>
          )}
          {!hasError && hasWarning && (
            <span title={nodeIssues[0]?.title} className="text-amber-400 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </span>
          )}
        </div>

        {/* Right section: metadata & quick action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-500 hidden md:inline-block">
            {node.sizeMB} MB
          </span>

          {/* Quick actions for hover / mobile */}
          <div className={`flex items-center gap-0.5 ${
            isSmartphone ? 'flex' : 'opacity-0 group-hover:opacity-100 transition-opacity'
          }`}>
            {isDirectory && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onAddChild(node);
                }}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-white hover:bg-slate-750 rounded-md cursor-pointer"
                title="Add directory or file inside"
                aria-label={`Add item inside ${node.name}`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            )}

            {isSmartphone && node.id !== 'node-root' && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setQuickMoveNodeId(node.id);
                }}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-750 rounded-md cursor-pointer"
                title="Move to another directory"
                aria-label={`Move ${node.name}`}
              >
                <MoveRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            )}

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onEdit(node);
              }}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-white hover:bg-slate-750 rounded-md cursor-pointer"
              title="Edit node properties"
              aria-label={`Edit ${node.name}`}
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-300" />
            </button>

            {node.id !== 'node-root' && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-750 rounded-md cursor-pointer"
                title={node.isRequired ? 'Warning: Required FHS directory' : 'Delete node'}
                aria-label={`Delete ${node.name}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400/80 hover:text-rose-300" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render children recursively if expanded */}
      {isDirectory && isExpanded && hasChildren && (
        <div className="flex flex-col border-l border-slate-800/80 ml-2.5 sm:ml-4">
          {node.children!.map(child => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};
