import { FHSNode, PartitionPlan } from '../types/fhs';
import { findNodeByPath, flattenTree } from './treeUtils';
import { generateAsciiTree, generateFstab } from './export';
import { validateFHSTree } from './validator';

export interface CommandResult {
  output: string;
  isError?: boolean;
  newCwd?: string;
}

export function executeFHSCommand(
  cmdLine: string,
  root: FHSNode,
  cwd: string,
  partitions: PartitionPlan[]
): CommandResult {
  const trimmed = cmdLine.trim();
  if (!trimmed) return { output: '' };

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  const resolvePath = (target: string): string => {
    if (!target || target === '.') return cwd;
    if (target === '..') {
      if (cwd === '/') return '/';
      const segments = cwd.split('/').filter(Boolean);
      segments.pop();
      return segments.length === 0 ? '/' : `/${segments.join('/')}`;
    }
    if (target.startsWith('/')) return target;
    return cwd === '/' ? `/${target}` : `${cwd}/${target}`;
  };

  switch (command) {
    case 'help':
      return {
        output: [
          'FHS Interactive Terminal Simulator - Available Commands:',
          '  ls [-la] [path]    List directory contents with FHS flags & permissions',
          '  tree [path]        Render ASCII directory hierarchy tree',
          '  df -h              Display simulated disk filesystem allocation & mounts',
          '  stat <path>        Show detailed FHS classification, volatility & metadata',
          '  cat /etc/fstab     View generated static filesystem mount table',
          '  fhs-audit          Run real-time FHS compliance and consistency audit',
          '  cd <path>          Change working directory',
          '  pwd                Print working directory',
          '  clear              Clear terminal screen',
        ].join('\n'),
      };

    case 'pwd':
      return { output: cwd };

    case 'cd': {
      const target = resolvePath(args[0] || '/');
      const targetNode = findNodeByPath(root, target);
      if (!targetNode) {
        return { output: `cd: no such file or directory: ${args[0]}`, isError: true };
      }
      if (targetNode.type !== 'directory') {
        return { output: `cd: not a directory: ${args[0]}`, isError: true };
      }
      return { output: '', newCwd: targetNode.path };
    }

    case 'ls': {
      const showDetails = args.includes('-l') || args.includes('-la') || args.includes('-al');
      const pathArg = args.find(a => !a.startsWith('-')) || cwd;
      const targetPath = resolvePath(pathArg);
      const targetNode = findNodeByPath(root, targetPath);

      if (!targetNode) {
        return { output: `ls: cannot access '${pathArg}': No such file or directory`, isError: true };
      }

      if (targetNode.type !== 'directory') {
        return {
          output: `${targetNode.permissions} 1 ${targetNode.owner} ${targetNode.sizeMB}M ${targetNode.name}`,
        };
      }

      const children = targetNode.children || [];
      if (children.length === 0) {
        return { output: '(empty directory)' };
      }

      if (!showDetails) {
        return {
          output: children
            .map(c => (c.type === 'directory' ? `${c.name}/` : c.name))
            .join('  '),
        };
      }

      const lines: string[] = [`total ${children.length}`];
      for (const child of children) {
        const typeChar = child.type === 'directory' ? 'd' : '-';
        const fhsFlag = `[${child.shareability[0].toUpperCase()}/${child.volatility[0].toUpperCase()}]`;
        const sizeStr = `${child.sizeMB}M`.padStart(7, ' ');
        lines.push(
          `${typeChar}${child.permissions.replace(/^0/, '')}  1 ${child.owner.padEnd(12, ' ')} ${sizeStr} ${fhsFlag} ${child.name}${child.type === 'directory' ? '/' : ''}`
        );
      }
      return { output: lines.join('\n') };
    }

    case 'tree': {
      const pathArg = args[0] || cwd;
      const targetPath = resolvePath(pathArg);
      const targetNode = findNodeByPath(root, targetPath);
      if (!targetNode) {
        return { output: `tree: '${pathArg}': No such file or directory`, isError: true };
      }
      return { output: generateAsciiTree(targetNode) };
    }

    case 'df': {
      const lines = [
        'Filesystem     Type      Size  Used Avail Use% Mounted on',
      ];
      for (const p of partitions) {
        const devPad = p.device.padEnd(14, ' ');
        const typePad = p.fsType.padEnd(9, ' ');
        const sizePad = `${p.sizeGB}G`.padStart(5, ' ');
        const used = Math.round(p.sizeGB * 0.35 * 10) / 10;
        const avail = Math.round((p.sizeGB - used) * 10) / 10;
        const usedPad = `${used}G`.padStart(5, ' ');
        const availPad = `${avail}G`.padStart(5, ' ');
        const usePct = `35%`.padStart(4, ' ');
        const roFlag = p.readOnly ? ' (ro)' : '';
        lines.push(`${devPad} ${typePad} ${sizePad} ${usedPad} ${availPad} ${usePct} ${p.mountPoint}${roFlag}`);
      }
      return { output: lines.join('\n') };
    }

    case 'stat': {
      if (!args[0]) {
        return { output: 'stat: missing operand', isError: true };
      }
      const targetPath = resolvePath(args[0]);
      const node = findNodeByPath(root, targetPath);
      if (!node) {
        return { output: `stat: cannot stat '${args[0]}': No such file or directory`, isError: true };
      }

      return {
        output: [
          `  File: ${node.path}`,
          `  Type: ${node.type.toUpperCase()}`,
          `  Size: ${node.sizeMB} MB`,
          `  Access: (${node.permissions})  Uid: (${node.owner.split(':')[0]})  Gid: (${node.owner.split(':')[1] || 'root'})`,
          `  FHS Classification:`,
          `    - Shareability: ${node.shareability.toUpperCase()} (${node.shareability === 'shareable' ? 'Can be shared across hosts via NFS/network' : 'Host/hardware-specific, cannot be shared'})`,
          `    - Volatility:   ${node.volatility.toUpperCase()} (${node.volatility === 'static' ? 'Static files, safe for read-only mounts' : 'Variable data, changes during system operation'})`,
          `  FHS Hierarchy:    ${node.standardHierarchy.toUpperCase()}`,
          `  Standard Status:  ${node.isStandardFHS ? 'Official FHS 3.0 Standard' : 'Custom User Architecture Node'}`,
          `  Description:      ${node.description}`,
        ].join('\n'),
      };
    }

    case 'cat': {
      if (args[0] === '/etc/fstab' || args[0] === 'etc/fstab' || (cwd === '/etc' && args[0] === 'fstab')) {
        return { output: generateFstab(partitions) };
      }
      const targetPath = resolvePath(args[0] || '');
      const node = findNodeByPath(root, targetPath);
      if (!node) {
        return { output: `cat: ${args[0]}: No such file or directory`, isError: true };
      }
      if (node.type === 'directory') {
        return { output: `cat: ${args[0]}: Is a directory`, isError: true };
      }
      return { output: `# Contents of ${node.path}\n# ${node.description}\n` };
    }

    case 'fhs-audit': {
      const issues = validateFHSTree(root);
      if (issues.length === 0) {
        return { output: '[✓] 100% FHS 3.0 Compliant: No violations or warnings found.' };
      }
      const lines = [`[!] Found ${issues.length} FHS architecture issue(s):`];
      issues.forEach((iss, idx) => {
        lines.push(`  ${idx + 1}. [${iss.severity.toUpperCase()}] ${iss.path} - ${iss.title}`);
        lines.push(`     -> ${iss.message}`);
        lines.push(`     -> Fix: ${iss.recommendation}`);
      });
      return { output: lines.join('\n') };
    }

    default:
      return {
        output: `${command}: command not found. Type 'help' for available commands.`,
        isError: true,
      };
  }
}
