import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { FHSNode, PartitionPlan, PlatformSettings, PresetArchitecture, ValidationIssue } from '../types/fhs';
import { STANDARD_FHS_TREE, INITIAL_PARTITIONS, PRESET_ARCHITECTURES } from '../logic/fhsData';
import {
  findNodeById,
  insertChildNode,
  removeNodeById,
  moveNode as moveNodeTree,
  cloneTree,
  recalculatePaths,
} from '../logic/treeUtils';
import { validateFHSTree } from '../logic/validator';

interface FHSContextType {
  rootTree: FHSNode;
  selectedNode: FHSNode | null;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  partitions: PartitionPlan[];
  platformSettings: PlatformSettings;
  updatePlatformSettings: (partial: Partial<PlatformSettings>) => void;
  activePlatformView: 'web' | 'smartphone';
  setActivePlatformView: (view: 'web' | 'smartphone') => void;
  activeTab: 'tree' | 'matrix' | 'partitions' | 'audit' | 'terminal' | 'export';
  setActiveTab: (tab: 'tree' | 'matrix' | 'partitions' | 'audit' | 'terminal' | 'export') => void;
  validationIssues: ValidationIssue[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  addNode: (parentId: string, node: Partial<FHSNode>) => void;
  updateNode: (id: string, updates: Partial<FHSNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (sourceId: string, targetParentId: string, targetIndex?: number) => void;
  loadPreset: (presetId: string) => void;
  addPartition: (part: Omit<PartitionPlan, 'id'>) => void;
  updatePartition: (id: string, partial: Partial<PartitionPlan>) => void;
  deletePartition: (id: string) => void;
  draggedNodeId: string | null;
  setDraggedNodeId: (id: string | null) => void;
  quickMoveNodeId: string | null;
  setQuickMoveNodeId: (id: string | null) => void;
  expandedNodeIds: Set<string>;
  toggleNodeExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  mode: 'web',
  displayDensity: 'comfortable',
  dragAndDropMode: 'pointer',
  touchTargetSize: 'standard',
  showTerminal: true,
  validationStrictness: 'strict',
  autoExpandDepth: 2,
  theme: 'ubuntu-dark',
  lowSpecAnimation: false,
  defaultFsType: 'ext4',
};

const FHSContext = createContext<FHSContextType | null>(null);

export const FHSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rootTree, setRootTree] = useState<FHSNode>(STANDARD_FHS_TREE);
  const [history, setHistory] = useState<FHSNode[]>([]);
  const [future, setFuture] = useState<FHSNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-root');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [partitions, setPartitions] = useState<PartitionPlan[]>(INITIAL_PARTITIONS);
  const [activeTab, setActiveTab] = useState<'tree' | 'matrix' | 'partitions' | 'audit' | 'terminal' | 'export'>('tree');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [quickMoveNodeId, setQuickMoveNodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Platform settings with smartphone & web differentiation
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
    return {
      ...DEFAULT_SETTINGS,
      mode: isMobileDevice ? 'smartphone' : 'web',
      dragAndDropMode: isMobileDevice ? 'touch-handles' : 'pointer',
      touchTargetSize: isMobileDevice ? 'large' : 'standard',
      displayDensity: isMobileDevice ? 'compact' : 'comfortable',
    };
  });

  const [activePlatformView, setActivePlatformView] = useState<'web' | 'smartphone'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'smartphone' : 'web';
  });

  // Track expanded nodes
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => {
    return new Set(['node-root', 'node-bin', 'node-usr', 'node-var', 'node-etc', 'node-home']);
  });

  const toggleNodeExpanded = useCallback((id: string) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const ids = new Set<string>();
    const collect = (n: FHSNode) => {
      if (n.type === 'directory') ids.add(n.id);
      if (n.children) n.children.forEach(collect);
    };
    collect(rootTree);
    setExpandedNodeIds(ids);
  }, [rootTree]);

  const collapseAll = useCallback(() => {
    setExpandedNodeIds(new Set(['node-root']));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Record history snapshot before state modification
  const recordHistory = useCallback((current: FHSNode) => {
    setHistory(prev => [...prev.slice(-25), cloneTree(current)]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setFuture(prev => [cloneTree(rootTree), ...prev]);
    setRootTree(previous);
    showToast('Undo performed');
  }, [history, rootTree, showToast]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, cloneTree(rootTree)]);
    setRootTree(next);
    showToast('Redo performed');
  }, [future, rootTree, showToast]);

  const addNode = useCallback((parentId: string, nodeData: Partial<FHSNode>) => {
    recordHistory(rootTree);
    const newId = `node-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullNode: FHSNode = {
      id: newId,
      name: nodeData.name || 'new-node',
      path: '',
      type: nodeData.type || 'directory',
      shareability: nodeData.shareability || 'unshareable',
      volatility: nodeData.volatility || 'static',
      description: nodeData.description || 'Custom filesystem node',
      isStandardFHS: false,
      isRequired: false,
      standardHierarchy: 'custom',
      sizeMB: nodeData.sizeMB ?? (nodeData.type === 'file' ? 1 : 10),
      permissions: nodeData.permissions || (nodeData.type === 'file' ? '0644' : '0755'),
      owner: nodeData.owner || 'root:root',
      children: nodeData.type === 'directory' ? [] : undefined,
    };

    setRootTree(prev => {
      const updated = insertChildNode(prev, parentId, fullNode);
      return updated;
    });
    setExpandedNodeIds(prev => new Set([...prev, parentId]));
    setSelectedNodeId(newId);
    showToast(`Added ${fullNode.type} '${fullNode.name}'`);
  }, [recordHistory, rootTree, showToast]);

  const updateNode = useCallback((id: string, updates: Partial<FHSNode>) => {
    if (id === 'node-root' && updates.name && updates.name !== '/') return;
    recordHistory(rootTree);

    const updateRecursive = (node: FHSNode): FHSNode => {
      if (node.id === id) {
        return {
          ...node,
          ...updates,
          children: updates.children !== undefined ? updates.children : node.children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateRecursive),
        };
      }
      return node;
    };

    setRootTree(prev => recalculatePaths(updateRecursive(cloneTree(prev))));
    showToast(`Updated '${updates.name || 'node'}' properties`);
  }, [recordHistory, rootTree, showToast]);

  const deleteNode = useCallback((id: string) => {
    if (id === 'node-root') {
      showToast('Cannot delete root filesystem /');
      return;
    }
    const node = findNodeById(rootTree, id);
    if (node?.isRequired) {
      showToast(`Warning: '${node.path}' is an essential FHS standard directory.`);
    }
    recordHistory(rootTree);
    setRootTree(prev => removeNodeById(prev, id));
    if (selectedNodeId === id) {
      setSelectedNodeId('node-root');
    }
    showToast(`Deleted '${node?.name || 'node'}'`);
  }, [recordHistory, rootTree, selectedNodeId, showToast]);

  const moveNode = useCallback((sourceId: string, targetParentId: string, targetIndex?: number) => {
    if (sourceId === targetParentId || sourceId === 'node-root') return;
    recordHistory(rootTree);
    setRootTree(prev => moveNodeTree(prev, sourceId, targetParentId, targetIndex));
    setExpandedNodeIds(prev => new Set([...prev, targetParentId]));
    showToast('Hierarchy updated');
  }, [recordHistory, rootTree, showToast]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = PRESET_ARCHITECTURES.find(p => p.id === presetId);
    if (!preset) return;
    recordHistory(rootTree);
    setRootTree(cloneTree(preset.rootTree));
    setPartitions(JSON.parse(JSON.stringify(preset.partitions)));
    setSelectedNodeId('node-root');
    expandAll();
    showToast(`Loaded template: ${preset.name}`);
  }, [expandAll, recordHistory, rootTree, showToast]);

  const addPartition = useCallback((part: Omit<PartitionPlan, 'id'>) => {
    const newPart: PartitionPlan = {
      ...part,
      id: `part-${Date.now()}`,
    };
    setPartitions(prev => [...prev, newPart]);
    showToast(`Mounted ${newPart.mountPoint} on ${newPart.device}`);
  }, [showToast]);

  const updatePartition = useCallback((id: string, partial: Partial<PartitionPlan>) => {
    setPartitions(prev => prev.map(p => p.id === id ? { ...p, ...partial } : p));
  }, []);

  const deletePartition = useCallback((id: string) => {
    setPartitions(prev => prev.filter(p => p.id !== id));
    showToast('Partition removed from fstab plan');
  }, [showToast]);

  const updatePlatformSettings = useCallback((partial: Partial<PlatformSettings>) => {
    setPlatformSettings(prev => ({ ...prev, ...partial }));
    if (partial.mode) {
      setActivePlatformView(partial.mode);
    }
  }, []);

  // Calculate current selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return findNodeById(rootTree, selectedNodeId);
  }, [rootTree, selectedNodeId]);

  // Validation issues
  const validationIssues = useMemo(() => {
    return validateFHSTree(rootTree, platformSettings.validationStrictness);
  }, [rootTree, platformSettings.validationStrictness]);

  // Sync activePlatformView changes with display settings
  useEffect(() => {
    if (activePlatformView === 'smartphone') {
      setPlatformSettings(prev => ({
        ...prev,
        mode: 'smartphone',
        touchTargetSize: 'large',
        dragAndDropMode: 'touch-handles',
        displayDensity: 'compact',
      }));
    } else {
      setPlatformSettings(prev => ({
        ...prev,
        mode: 'web',
        touchTargetSize: 'standard',
        dragAndDropMode: 'pointer',
        displayDensity: 'comfortable',
      }));
    }
  }, [activePlatformView]);

  return (
    <FHSContext.Provider
      value={{
        rootTree,
        selectedNode,
        selectedNodeId,
        setSelectedNodeId,
        searchQuery,
        setSearchQuery,
        categoryFilter,
        setCategoryFilter,
        partitions,
        platformSettings,
        updatePlatformSettings,
        activePlatformView,
        setActivePlatformView,
        activeTab,
        setActiveTab,
        validationIssues,
        canUndo: history.length > 0,
        canRedo: future.length > 0,
        undo,
        redo,
        addNode,
        updateNode,
        deleteNode,
        moveNode,
        loadPreset,
        addPartition,
        updatePartition,
        deletePartition,
        draggedNodeId,
        setDraggedNodeId,
        quickMoveNodeId,
        setQuickMoveNodeId,
        expandedNodeIds,
        toggleNodeExpanded,
        expandAll,
        collapseAll,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </FHSContext.Provider>
  );
};

export function useFHS() {
  const context = useContext(FHSContext);
  if (!context) {
    throw new Error('useFHS must be used within an FHSProvider');
  }
  return context;
}
