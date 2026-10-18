import { FHSNode } from '../types/fhs';

export function findNodeById(root: FHSNode, id: string): FHSNode | null {
  if (root.id === id) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export function findNodeByPath(root: FHSNode, path: string): FHSNode | null {
  const cleanPath = path === '/' ? '/' : path.replace(/\/+$/, '');
  if (root.path === cleanPath) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeByPath(child, cleanPath);
    if (found) return found;
  }
  return null;
}

export function findParentNode(root: FHSNode, childId: string): FHSNode | null {
  if (!root.children) return null;
  for (const child of root.children) {
    if (child.id === childId) return root;
    const parent = findParentNode(child, childId);
    if (parent) return parent;
  }
  return null;
}

export function calculateTreeSize(node: FHSNode): number {
  let total = node.sizeMB || 0;
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      total += calculateTreeSize(child);
    }
  }
  return Math.round(total * 100) / 100;
}

export function countTreeNodes(node: FHSNode): { dirs: number; files: number } {
  let dirs = node.type === 'directory' ? 1 : 0;
  let files = node.type !== 'directory' ? 1 : 0;
  if (node.children) {
    for (const child of node.children) {
      const res = countTreeNodes(child);
      dirs += res.dirs;
      files += res.files;
    }
  }
  return { dirs, files };
}

export function recalculatePaths(node: FHSNode, parentPath: string = ''): FHSNode {
  const currentPath = parentPath === ''
    ? (node.name === '/' ? '/' : `/${node.name}`)
    : (parentPath === '/' ? `/${node.name}` : `${parentPath}/${node.name}`);

  const updatedNode: FHSNode = {
    ...node,
    path: currentPath,
  };

  if (node.children && node.children.length > 0) {
    updatedNode.children = node.children.map((child) => recalculatePaths(child, currentPath));
  }

  return updatedNode;
}

export function cloneTree(node: FHSNode): FHSNode {
  return JSON.parse(JSON.stringify(node));
}

export function insertChildNode(root: FHSNode, parentId: string, newNode: FHSNode, targetIndex?: number): FHSNode {
  const rootClone = cloneTree(root);
  const parent = findNodeById(rootClone, parentId);
  if (!parent) return rootClone;

  if (!parent.children) {
    parent.children = [];
  }

  if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= parent.children.length) {
    parent.children.splice(targetIndex, 0, newNode);
  } else {
    parent.children.push(newNode);
  }

  return recalculatePaths(rootClone);
}

export function removeNodeById(root: FHSNode, nodeId: string): FHSNode {
  if (root.id === nodeId) return root; // Cannot delete root
  const rootClone = cloneTree(root);
  
  function removeRecursive(current: FHSNode): boolean {
    if (!current.children) return false;
    const idx = current.children.findIndex((c) => c.id === nodeId);
    if (idx !== -1) {
      current.children.splice(idx, 1);
      return true;
    }
    for (const child of current.children) {
      if (removeRecursive(child)) return true;
    }
    return false;
  }

  removeRecursive(rootClone);
  return recalculatePaths(rootClone);
}

export function moveNode(root: FHSNode, sourceId: string, targetParentId: string, targetIndex?: number): FHSNode {
  if (sourceId === targetParentId || sourceId === 'node-root') return root;
  const rootClone = cloneTree(root);
  const sourceNode = findNodeById(rootClone, sourceId);
  if (!sourceNode) return root;

  // Prevent moving parent into its own child
  const checkDescendant = findNodeById(sourceNode, targetParentId);
  if (checkDescendant) return root;

  // Remove from old parent
  const cleaned = removeNodeById(rootClone, sourceId);
  // Insert into new parent
  return insertChildNode(cleaned, targetParentId, sourceNode, targetIndex);
}

export function flattenTree(node: FHSNode): FHSNode[] {
  const list: FHSNode[] = [node];
  if (node.children) {
    for (const child of node.children) {
      list.push(...flattenTree(child));
    }
  }
  return list;
}
