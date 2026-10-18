import React, { useState, useMemo } from 'react';
import {
  Search,
  FolderPlus,
  Maximize2,
  Minimize2,
  Layers,
  SlidersHorizontal,
  PlusCircle,
  FolderTree,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import { TreeNodeItem } from './TreeNodeItem';
import { FHS_COMPONENT_PALETTE } from '../../logic/fhsData';
import { FHSNode } from '../../types/fhs';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Drawer } from '../ui/Drawer';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { flattenTree } from '../../logic/treeUtils';

export const TreeExplorer: React.FC = () => {
  const {
    rootTree,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    expandAll,
    collapseAll,
    addNode,
    updateNode,
    moveNode,
    quickMoveNodeId,
    setQuickMoveNodeId,
    platformSettings,
  } = useFHS();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetParentNode, setTargetParentNode] = useState<FHSNode | null>(null);
  const [editingNode, setEditingNode] = useState<FHSNode | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'directory' | 'file'>('directory');
  const [formShareability, setFormShareability] = useState<'shareable' | 'unshareable'>('unshareable');
  const [formVolatility, setFormVolatility] = useState<'static' | 'variable'>('static');
  const [formDesc, setFormDesc] = useState('');
  const [formSizeMB, setFormSizeMB] = useState(10);
  const [formPerms, setFormPerms] = useState('0755');
  const [formOwner, setFormOwner] = useState('root:root');

  // For Smartphone Tap-to-Move
  const allDirectories = useMemo(() => {
    return flattenTree(rootTree).filter(n => n.type === 'directory');
  }, [rootTree]);

  const movingNode = useMemo(() => {
    if (!quickMoveNodeId) return null;
    return flattenTree(rootTree).find(n => n.id === quickMoveNodeId) || null;
  }, [quickMoveNodeId, rootTree]);

  const handleOpenAddModal = (parent: FHSNode) => {
    setTargetParentNode(parent);
    setFormName('');
    setFormType('directory');
    setFormShareability(parent.shareability);
    setFormVolatility(parent.volatility);
    setFormDesc('');
    setFormSizeMB(10);
    setFormPerms('0755');
    setFormOwner('root:root');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (node: FHSNode) => {
    setEditingNode(node);
    setFormName(node.name);
    setFormType(node.type === 'directory' ? 'directory' : 'file');
    setFormShareability(node.shareability);
    setFormVolatility(node.volatility);
    setFormDesc(node.description || '');
    setFormSizeMB(node.sizeMB || 1);
    setFormPerms(node.permissions || '0755');
    setFormOwner(node.owner || 'root:root');
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = () => {
    if (!targetParentNode || !formName.trim()) return;
    addNode(targetParentNode.id, {
      name: formName.trim().replace(/^\/+/, ''),
      type: formType,
      shareability: formShareability,
      volatility: formVolatility,
      description: formDesc || 'Custom filesystem node',
      sizeMB: Number(formSizeMB) || 1,
      permissions: formPerms || (formType === 'file' ? '0644' : '0755'),
      owner: formOwner || 'root:root',
    });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingNode || !formName.trim()) return;
    updateNode(editingNode.id, {
      name: formName.trim().replace(/^\/+/, ''),
      type: formType,
      shareability: formShareability,
      volatility: formVolatility,
      description: formDesc,
      sizeMB: Number(formSizeMB) || 1,
      permissions: formPerms,
      owner: formOwner,
    });
    setIsEditModalOpen(false);
  };

  const handleInsertPaletteItem = (paletteItem: typeof FHS_COMPONENT_PALETTE[0]) => {
    // Find suggested parent
    const all = flattenTree(rootTree);
    const parent = all.find(n => n.path === paletteItem.suggestedParentPath) || rootTree;
    addNode(parent.id, paletteItem.node);
  };

  const isSmartphone = platformSettings.mode === 'smartphone';

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Top Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-100">Filesystem Hierarchy</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              title="Expand All"
              aria-label="Expand all directories"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expand</span>
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              title="Collapse All"
              aria-label="Collapse all directories"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Collapse</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files or directories (e.g. syslog, bin)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              aria-label="Filter by FHS classification"
            >
              <option value="all">All Classifications</option>
              <option value="shareable-static">Shareable & Static (/usr, /opt)</option>
              <option value="shareable-variable">Shareable & Variable (/var/mail)</option>
              <option value="unshareable-static">Unshareable & Static (/etc, /boot)</option>
              <option value="unshareable-variable">Unshareable & Variable (/var/log, /run)</option>
            </select>
          </div>
        </div>

        {/* Component Palette Quick Presets Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <PlusCircle className="w-3 h-3 text-emerald-400" />
            Quick Add:
          </span>
          {FHS_COMPONENT_PALETTE.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleInsertPaletteItem(item)}
              title={item.description}
              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-md text-[11px] font-mono text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>+</span>
              <span>{item.node.name}</span>
              <span className="text-slate-500 text-[10px]">({item.suggestedParentPath})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tree Content Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-0.5">
        <TreeNodeItem
          node={rootTree}
          depth={0}
          onAddChild={handleOpenAddModal}
          onEdit={handleOpenEditModal}
        />
      </div>

      {/* Add Node Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-orange-400" />
            <span>Add Node under '{targetParentNode?.path}'</span>
          </div>
        }
        description="Configure directory or file details in accordance with FHS guidelines."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAdd}>
              Create Node
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Node Name"
              placeholder="e.g. nginx, config.yml, cache"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              required
            />
            <Select
              label="Type"
              value={formType}
              onChange={e => setFormType(e.target.value as any)}
              options={[
                { value: 'directory', label: 'Directory (Folder)' },
                { value: 'file', label: 'File' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Shareability (FHS Dimension 1)"
              value={formShareability}
              onChange={e => setFormShareability(e.target.value as any)}
              helperText="Shareable files can be shared via NFS across hosts (e.g. /usr/lib, /usr/share)."
              options={[
                { value: 'shareable', label: 'Shareable (Can be shared across hosts)' },
                { value: 'unshareable', label: 'Unshareable (Host-specific e.g. /etc, /home)' },
              ]}
            />
            <Select
              label="Volatility (FHS Dimension 2)"
              value={formVolatility}
              onChange={e => setFormVolatility(e.target.value as any)}
              helperText="Static files do not change without admin intervention; variable files change during operation."
              options={[
                { value: 'static', label: 'Static (Read-only safe, e.g. /usr/bin)' },
                { value: 'variable', label: 'Variable (Modified at runtime, e.g. /var/log)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Size (MB)"
              type="number"
              value={formSizeMB}
              onChange={e => setFormSizeMB(Number(e.target.value))}
            />
            <Input
              label="Permissions (chmod)"
              value={formPerms}
              placeholder="0755"
              onChange={e => setFormPerms(e.target.value)}
            />
            <Input
              label="Owner:Group"
              value={formOwner}
              placeholder="root:root"
              onChange={e => setFormOwner(e.target.value)}
            />
          </div>

          <Input
            label="Purpose / Description"
            placeholder="Document what software or subsystem this node is for"
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
          />
        </div>
      </Modal>

      {/* Edit Node Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={<span>Edit Node: {editingNode?.path}</span>}
        description="Update node classification, volatile status, size, and permissions."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Node Name"
              value={formName}
              disabled={editingNode?.id === 'node-root'}
              onChange={e => setFormName(e.target.value)}
            />
            <Select
              label="Type"
              value={formType}
              onChange={e => setFormType(e.target.value as any)}
              options={[
                { value: 'directory', label: 'Directory' },
                { value: 'file', label: 'File' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Shareability"
              value={formShareability}
              onChange={e => setFormShareability(e.target.value as any)}
              options={[
                { value: 'shareable', label: 'Shareable' },
                { value: 'unshareable', label: 'Unshareable' },
              ]}
            />
            <Select
              label="Volatility"
              value={formVolatility}
              onChange={e => setFormVolatility(e.target.value as any)}
              options={[
                { value: 'static', label: 'Static (Read-only safe)' },
                { value: 'variable', label: 'Variable (Modified at runtime)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Size (MB)"
              type="number"
              value={formSizeMB}
              onChange={e => setFormSizeMB(Number(e.target.value))}
            />
            <Input
              label="Permissions"
              value={formPerms}
              onChange={e => setFormPerms(e.target.value)}
            />
            <Input
              label="Owner"
              value={formOwner}
              onChange={e => setFormOwner(e.target.value)}
            />
          </div>

          <Input
            label="Description"
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
          />
        </div>
      </Modal>

      {/* Smartphone Tap-To-Move Bottom Sheet Drawer */}
      <Drawer
        isOpen={Boolean(quickMoveNodeId)}
        onClose={() => setQuickMoveNodeId(null)}
        title={<span>Move '{movingNode?.name}'</span>}
        subtitle="Select destination parent directory"
      >
        <div className="space-y-2 py-1">
          <p className="text-xs text-slate-400">
            Tap a target directory below to relocate <code className="text-orange-400">{movingNode?.path}</code> into it:
          </p>
          <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
            {allDirectories
              .filter(dir => dir.id !== movingNode?.id && !dir.path.startsWith(movingNode?.path || '///'))
              .map(dir => (
                <button
                  key={dir.id}
                  onClick={() => {
                    if (movingNode) {
                      moveNode(movingNode.id, dir.id);
                      setQuickMoveNodeId(null);
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-orange-600/30 border border-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-mono font-semibold text-slate-100">
                        {dir.path}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[260px]">
                        {dir.description}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-orange-400 font-semibold shrink-0">Move Here →</span>
                </button>
              ))}
          </div>
        </div>
      </Drawer>
    </div>
  );
};
