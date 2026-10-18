import React, { useState } from 'react';
import {
  FolderTree,
  Grid,
  HardDrive,
  ShieldCheck,
  Terminal as TerminalIcon,
  FileCode,
  Smartphone,
  Monitor,
  Menu,
  Sliders,
  Layers,
} from 'lucide-react';
import { FHSProvider, useFHS } from './context/FHSContext';
import { Header } from './components/layout/Header';
import { Tabs, TabItem } from './components/ui/Tabs';
import { TreeExplorer } from './components/tree/TreeExplorer';
import { NodeInspector } from './components/inspector/NodeInspector';
import { FHSMatrixView } from './components/matrix/FHSMatrixView';
import { PartitionPlanner } from './components/partitions/PartitionPlanner';
import { FHSAuditPanel } from './components/audit/FHSAuditPanel';
import { TerminalDock } from './components/terminal/TerminalDock';
import { ExportCenter } from './components/export/ExportCenter';
import { Drawer } from './components/ui/Drawer';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { FHSNode } from './types/fhs';

function MainAppShell() {
  const {
    activePlatformView,
    activeTab,
    setActiveTab,
    selectedNode,
    validationIssues,
    updateNode,
    addNode,
  } = useFHS();

  // For Smartphone Inspector Drawer
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  // Add/Edit Modals from Inspector
  const [isInspectorEditOpen, setIsInspectorEditOpen] = useState(false);
  const [isInspectorAddOpen, setIsInspectorAddOpen] = useState(false);

  // Inspector Edit form state
  const [editName, setEditName] = useState('');
  const [editShareability, setEditShareability] = useState<'shareable' | 'unshareable'>('unshareable');
  const [editVolatility, setEditVolatility] = useState<'static' | 'variable'>('static');
  const [editDesc, setEditDesc] = useState('');
  const [editSize, setEditSize] = useState(10);
  const [editPerms, setEditPerms] = useState('0755');
  const [editOwner, setEditOwner] = useState('root:root');

  // Inspector Add Sub-item state
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<'directory' | 'file'>('directory');

  const errors = validationIssues.filter(i => i.severity === 'error');

  const navTabs: TabItem[] = [
    {
      id: 'tree',
      label: 'Tree Explorer',
      icon: <FolderTree className="w-4 h-4" />,
    },
    {
      id: 'matrix',
      label: '2×2 FHS Matrix',
      icon: <Grid className="w-4 h-4" />,
    },
    {
      id: 'partitions',
      label: 'Partitions & Mounts',
      icon: <HardDrive className="w-4 h-4" />,
    },
    {
      id: 'audit',
      label: 'FHS Audit',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: errors.length > 0 ? errors.length : undefined,
      badgeVariant: 'error',
    },
    {
      id: 'terminal',
      label: 'Terminal Shell',
      icon: <TerminalIcon className="w-4 h-4" />,
    },
    {
      id: 'export',
      label: 'Export Scripts',
      icon: <FileCode className="w-4 h-4" />,
    },
  ];

  const handleOpenEditFromInspector = () => {
    if (!selectedNode) return;
    setEditName(selectedNode.name);
    setEditShareability(selectedNode.shareability);
    setEditVolatility(selectedNode.volatility);
    setEditDesc(selectedNode.description || '');
    setEditSize(selectedNode.sizeMB || 1);
    setEditPerms(selectedNode.permissions || '0755');
    setEditOwner(selectedNode.owner || 'root:root');
    setIsInspectorEditOpen(true);
  };

  const handleSaveInspectorEdit = () => {
    if (!selectedNode || !editName.trim()) return;
    updateNode(selectedNode.id, {
      name: editName.trim(),
      shareability: editShareability,
      volatility: editVolatility,
      description: editDesc,
      sizeMB: Number(editSize) || 1,
      permissions: editPerms,
      owner: editOwner,
    });
    setIsInspectorEditOpen(false);
  };

  const handleOpenAddFromInspector = () => {
    setAddName('');
    setAddType('directory');
    setIsInspectorAddOpen(true);
  };

  const handleSaveInspectorAdd = () => {
    if (!selectedNode || !addName.trim()) return;
    addNode(selectedNode.id, {
      name: addName.trim(),
      type: addType,
      shareability: selectedNode.shareability,
      volatility: selectedNode.volatility,
    });
    setIsInspectorAddOpen(false);
  };

  const isSmartphone = activePlatformView === 'smartphone';

  return (
    <div className={`h-full flex flex-col bg-slate-950 text-slate-100 ${isSmartphone ? 'w-full max-w-xl mx-auto md:border-x md:border-slate-800 md:shadow-2xl relative' : ''}`}>
      {/* Top Header */}
      <Header />

      {/* Desktop Navigation Tabs */}
      {!isSmartphone && (
        <div className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6">
          <Tabs
            tabs={navTabs}
            activeId={activeTab}
            onChange={id => setActiveTab(id as any)}
            variant="underline"
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden p-2 sm:p-4 ${isSmartphone ? 'pb-20' : ''}`}>
        {/* VIEW 1: Tree Hierarchy Explorer */}
        {activeTab === 'tree' && (
          <div className="h-full flex flex-col md:flex-row gap-3 overflow-hidden">
            {/* Left: Tree Directory Explorer */}
            <div className={`h-full overflow-hidden ${isSmartphone ? 'w-full' : 'w-full md:w-7/12 lg:w-3/5'}`}>
              <TreeExplorer />
            </div>

            {/* Right: Architecture Node Inspector (Desktop workbench) */}
            {!isSmartphone && (
              <div className="hidden md:flex md:w-5/12 lg:w-2/5 h-full flex-col gap-3 overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <NodeInspector
                    onEdit={handleOpenEditFromInspector}
                    onAddChild={handleOpenAddFromInspector}
                  />
                </div>
              </div>
            )}

            {/* Mobile Inspector Trigger Chip */}
            {isSmartphone && selectedNode && (
              <div className="fixed bottom-18 left-4 right-4 z-30">
                <button
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="w-full bg-slate-900/95 hover:bg-slate-850 active:bg-slate-800 text-slate-100 border border-orange-500/50 shadow-xl rounded-xl p-3 flex items-center justify-between text-xs cursor-pointer backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="font-mono font-bold truncate">{selectedNode.path}</span>
                    <span className="text-slate-400">({selectedNode.shareability}/{selectedNode.volatility})</span>
                  </div>
                  <span className="text-orange-400 font-semibold shrink-0 ml-2">Inspect Details ↑</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: 2x2 FHS Classification Matrix */}
        {activeTab === 'matrix' && <FHSMatrixView />}

        {/* VIEW 3: Partition & Mount Planner */}
        {activeTab === 'partitions' && <PartitionPlanner />}

        {/* VIEW 4: FHS Compliance Audit */}
        {activeTab === 'audit' && <FHSAuditPanel />}

        {/* VIEW 5: Interactive Terminal Simulator */}
        {activeTab === 'terminal' && (
          <div className="h-full overflow-hidden">
            <TerminalDock />
          </div>
        )}

        {/* VIEW 6: Export & Script Generator */}
        {activeTab === 'export' && <ExportCenter />}
      </main>

      {/* Smartphone Bottom Navigation Bar */}
      {isSmartphone && (
        <Tabs
          tabs={navTabs}
          activeId={activeTab}
          onChange={id => setActiveTab(id as any)}
          variant="mobile-bar"
        />
      )}

      {/* Smartphone Mobile Inspector Drawer */}
      {isSmartphone && (
        <Drawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          title={selectedNode?.path || 'Node Details'}
          subtitle="FHS Architecture Inspector"
        >
          <NodeInspector
            onEdit={handleOpenEditFromInspector}
            onAddChild={handleOpenAddFromInspector}
          />
        </Drawer>
      )}

      {/* Inspector Edit Modal */}
      <Modal
        isOpen={isInspectorEditOpen}
        onClose={() => setIsInspectorEditOpen(false)}
        title={`Edit Properties: ${selectedNode?.path}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsInspectorEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveInspectorEdit}>
              Update Properties
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editName}
            disabled={selectedNode?.id === 'node-root'}
            onChange={e => setEditName(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Shareability"
              value={editShareability}
              onChange={e => setEditShareability(e.target.value as any)}
              options={[
                { value: 'shareable', label: 'Shareable (NFS / Multi-host)' },
                { value: 'unshareable', label: 'Unshareable (Host-specific)' },
              ]}
            />
            <Select
              label="Volatility"
              value={editVolatility}
              onChange={e => setEditVolatility(e.target.value as any)}
              options={[
                { value: 'static', label: 'Static (Read-only safe)' },
                { value: 'variable', label: 'Variable (Modified at runtime)' },
              ]}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Size (MB)"
              type="number"
              value={editSize}
              onChange={e => setEditSize(Number(e.target.value))}
            />
            <Input
              label="Mode"
              value={editPerms}
              onChange={e => setEditPerms(e.target.value)}
            />
            <Input
              label="Owner"
              value={editOwner}
              onChange={e => setEditOwner(e.target.value)}
            />
          </div>
          <Input
            label="Description"
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
          />
        </div>
      </Modal>

      {/* Inspector Add Child Modal */}
      <Modal
        isOpen={isInspectorAddOpen}
        onClose={() => setIsInspectorAddOpen(false)}
        title={`Add Child under '${selectedNode?.path}'`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsInspectorAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveInspectorAdd}>
              Create Child
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. logs, configs, service"
            value={addName}
            onChange={e => setAddName(e.target.value)}
            required
          />
          <Select
            label="Type"
            value={addType}
            onChange={e => setAddType(e.target.value as any)}
            options={[
              { value: 'directory', label: 'Directory' },
              { value: 'file', label: 'File' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <FHSProvider>
      <MainAppShell />
    </FHSProvider>
  );
}
