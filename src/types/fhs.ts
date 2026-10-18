export type Shareability = 'shareable' | 'unshareable';
export type Volatility = 'static' | 'variable';

export type NodeType = 'directory' | 'file' | 'symlink' | 'mountpoint';

export interface FHSNode {
  id: string;
  name: string;
  path: string;
  type: NodeType;
  shareability: Shareability;
  volatility: Volatility;
  description: string;
  isStandardFHS: boolean;
  isRequired: boolean;
  standardHierarchy: 'root' | 'usr' | 'var' | 'custom';
  sizeMB: number;
  permissions: string; // e.g. "0755", "0644"
  owner: string; // e.g. "root:root"
  mountPoint?: string; // e.g. "/", "/usr", "/var"
  mountOptions?: string[]; // e.g. ["ro", "nodev", "nosuid"]
  fsType?: 'ext4' | 'btrfs' | 'xfs' | 'zfs' | 'tmpfs' | 'overlay';
  children?: FHSNode[];
  parentId?: string | null;
  target?: string; // for symlinks
}

export interface PartitionPlan {
  id: string;
  mountPoint: string;
  device: string;
  fsType: 'ext4' | 'btrfs' | 'xfs' | 'zfs' | 'tmpfs' | 'vfat' | 'overlay';
  sizeGB: number;
  options: string;
  dump: number;
  pass: number;
  readOnly: boolean;
  description: string;
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  nodeId: string;
  path: string;
  severity: ValidationSeverity;
  ruleId: string;
  title: string;
  message: string;
  recommendation: string;
  fhsReference: string;
}

export interface PlatformSettings {
  mode: 'web' | 'smartphone';
  displayDensity: 'comfortable' | 'compact' | 'ultra-compact';
  dragAndDropMode: 'pointer' | 'touch-handles' | 'tap-to-move';
  touchTargetSize: 'standard' | 'large';
  showTerminal: boolean;
  validationStrictness: 'strict' | 'relaxed';
  autoExpandDepth: number;
  theme: 'ubuntu-dark' | 'slate-dark' | 'terminal-green' | 'light';
  lowSpecAnimation: boolean;
  defaultFsType: 'ext4' | 'btrfs' | 'xfs';
}

export interface PresetArchitecture {
  id: string;
  name: string;
  description: string;
  tag: string;
  rootTree: FHSNode;
  partitions: PartitionPlan[];
}
