import { FHSNode, ValidationIssue } from '../types/fhs';
import { flattenTree, findNodeByPath } from './treeUtils';

const STANDARD_ROOT_DIRS = new Set([
  'bin', 'boot', 'dev', 'etc', 'lib', 'media', 'mnt', 'opt', 'run', 'sbin', 'srv', 'tmp', 'usr', 'var',
  'home', 'root', 'lib64', 'lib32', 'proc', 'sys'
]);

const REQUIRED_ROOT_DIRS = [
  { name: 'bin', path: '/bin', purpose: 'essential user command binaries (cp, ls, sh, mount)' },
  { name: 'boot', path: '/boot', purpose: 'static files for the bootloader, including the kernel' },
  { name: 'dev', path: '/dev', purpose: 'device files representing system hardware' },
  { name: 'etc', path: '/etc', purpose: 'host-specific system configuration files (no binaries)' },
  { name: 'lib', path: '/lib', purpose: 'shared libraries & kernel modules for /bin and /sbin' },
  { name: 'media', path: '/media', purpose: 'mount points for removable media (USB, CD)' },
  { name: 'mnt', path: '/mnt', purpose: 'temporary mount point for manual sysadmin use' },
  { name: 'opt', path: '/opt', purpose: 'add-on application packages, each in own subdirectory' },
  { name: 'run', path: '/run', purpose: 'runtime variable data cleared on boot (PIDs, sockets)' },
  { name: 'sbin', path: '/sbin', purpose: 'essential system binaries for booting and recovery' },
  { name: 'srv', path: '/srv', purpose: 'site-specific data served by the system (web, FTP)' },
  { name: 'tmp', path: '/tmp', purpose: 'temporary files, not preserved across reboots' },
  { name: 'usr', path: '/usr', purpose: 'secondary hierarchy for read-only user utilities' },
  { name: 'var', path: '/var', purpose: 'variable data like logs, mail, and spool files' },
];

const REQUIRED_USR_DIRS = [
  { name: 'bin', path: '/usr/bin', purpose: 'primary directory for user-executable programs' },
  { name: 'lib', path: '/usr/lib', purpose: 'object files, libraries, and internal binaries' },
  { name: 'local', path: '/usr/local', purpose: 'reserved for sysadmin use when installing local software' },
  { name: 'sbin', path: '/usr/sbin', purpose: 'non-essential system binaries for administration' },
  { name: 'share', path: '/usr/share', purpose: 'read-only architecture-independent data' },
];

const REQUIRED_VAR_DIRS = [
  { name: 'cache', path: '/var/cache', purpose: 'application-generated disposable cache data' },
  { name: 'lib', path: '/var/lib', purpose: 'variable state information specific to applications' },
  { name: 'local', path: '/var/local', purpose: 'variable data for software in /usr/local' },
  { name: 'lock', path: '/var/lock', purpose: 'lock files to coordinate access to resources' },
  { name: 'log', path: '/var/log', purpose: 'system log files and directories' },
  { name: 'opt', path: '/var/opt', purpose: 'variable data for add-on packages in /opt' },
  { name: 'run', path: '/var/run', purpose: 'transient runtime data such as PID files' },
  { name: 'spool', path: '/var/spool', purpose: 'spool directories for tasks like mail and printing' },
  { name: 'tmp', path: '/var/tmp', purpose: 'temporary files preserved between reboots' },
];

export function validateFHSTree(root: FHSNode, strictness: 'strict' | 'relaxed' = 'strict'): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allNodes = flattenTree(root);

  // 1. Check required root directories
  for (const req of REQUIRED_ROOT_DIRS) {
    const found = findNodeByPath(root, req.path);
    if (!found) {
      issues.push({
        id: `missing-root-${req.name}`,
        nodeId: root.id,
        path: req.path,
        severity: 'error',
        ruleId: 'FHS-ROOT-REQ',
        title: `Missing Required Root Directory: ${req.path}`,
        message: `FHS standard mandates ${req.path} for ${req.purpose}. Without it, system recovery or standard tools may fail.`,
        recommendation: `Restore standard required directory '${req.path}'.`,
        fhsReference: 'FHS 3.0 §3.4: Root filesystem required directories',
      });
    }
  }

  // 2. Check required /usr directories if /usr exists
  const usrNode = findNodeByPath(root, '/usr');
  if (usrNode) {
    for (const req of REQUIRED_USR_DIRS) {
      const found = findNodeByPath(root, req.path);
      if (!found) {
        issues.push({
          id: `missing-usr-${req.name}`,
          nodeId: usrNode.id,
          path: req.path,
          severity: 'error',
          ruleId: 'FHS-USR-REQ',
          title: `Missing Required /usr Directory: ${req.path}`,
          message: `FHS standard mandates ${req.path} for ${req.purpose}.`,
          recommendation: `Create required directory '${req.path}'.`,
          fhsReference: 'FHS 3.0 §4.2: /usr hierarchy required subdirectories',
        });
      }
    }
  }

  // 3. Check required /var directories if /var exists
  const varNode = findNodeByPath(root, '/var');
  if (varNode) {
    for (const req of REQUIRED_VAR_DIRS) {
      const found = findNodeByPath(root, req.path);
      if (!found) {
        issues.push({
          id: `missing-var-${req.name}`,
          nodeId: varNode.id,
          path: req.path,
          severity: 'error',
          ruleId: 'FHS-VAR-REQ',
          title: `Missing Required /var Directory: ${req.path}`,
          message: `FHS standard mandates ${req.path} for ${req.purpose}.`,
          recommendation: `Create required directory '${req.path}'.`,
          fhsReference: 'FHS 3.0 §5.2: /var hierarchy required subdirectories',
        });
      }
    }
  }

  // 4. Check for application-specific directories placed directly in Root (/)
  if (root.children) {
    for (const child of root.children) {
      if (!STANDARD_ROOT_DIRS.has(child.name)) {
        issues.push({
          id: `root-app-dir-${child.id}`,
          nodeId: child.id,
          path: child.path,
          severity: 'error',
          ruleId: 'FHS-ROOT-MINIMAL',
          title: `Application Directory in Root: ${child.path}`,
          message: `The root filesystem (/) must remain minimal and must NOT contain application-specific directories like '${child.name}'.`,
          recommendation: `Move '${child.name}' into '/opt/${child.name}' (for self-contained third-party packages) or '/usr/local'.`,
          fhsReference: 'FHS 3.0 §3.1: Root filesystem purpose & minimal footprint',
        });
      }
    }
  }

  // 5. Inspect individual nodes for FHS rules
  for (const node of allNodes) {
    // A. Variable data placed inside /usr
    if (node.path.startsWith('/usr/') && node.volatility === 'variable') {
      issues.push({
        id: `usr-variable-${node.id}`,
        nodeId: node.id,
        path: node.path,
        severity: 'error',
        ruleId: 'FHS-USR-READONLY',
        title: `Variable Data in /usr Hierarchy: ${node.path}`,
        message: `/usr hierarchy contains shareable, read-only data and must NOT contain variable files or directories. Doing so prevents mounting /usr as read-only.`,
        recommendation: `Relocate variable state/logs to '/var' (e.g. '/var/lib' or '/var/log') or temporary runtime data to '/run'.`,
        fhsReference: 'FHS 3.0 §4.1: /usr hierarchy shareable read-only requirements',
      });
    }

    // B. Large packages directly under /usr (e.g. /usr/myapp)
    if (node.path.startsWith('/usr/')) {
      const parts = node.path.split('/').filter(Boolean);
      if (parts.length === 2 && parts[0] === 'usr') {
        const standardUsrSubdirs = new Set(['bin', 'lib', 'local', 'sbin', 'share', 'include', 'src', 'libexec']);
        if (!standardUsrSubdirs.has(parts[1])) {
          issues.push({
            id: `usr-direct-package-${node.id}`,
            nodeId: node.id,
            path: node.path,
            severity: 'error',
            ruleId: 'FHS-USR-SUBDIR',
            title: `Direct Subdirectory in /usr: ${node.path}`,
            message: `Large software packages must NOT use a direct subdirectory under /usr.`,
            recommendation: `Package files should reside in structured paths like '/usr/share', '/usr/lib', or '/opt/${parts[1]}'.`,
            fhsReference: 'FHS 3.0 §4.1: Prohibition of direct package subdirectories in /usr',
          });
        }
      }
    }

    // C. Non-standard top-level directories in /var
    if (node.path.startsWith('/var/')) {
      const parts = node.path.split('/').filter(Boolean);
      if (parts.length === 2 && parts[0] === 'var') {
        const standardVarSubdirs = new Set(['cache', 'lib', 'local', 'lock', 'log', 'opt', 'run', 'spool', 'tmp', 'backups', 'mail', 'games']);
        if (!standardVarSubdirs.has(parts[1])) {
          issues.push({
            id: `var-custom-top-${node.id}`,
            nodeId: node.id,
            path: node.path,
            severity: strictness === 'strict' ? 'warning' : 'info',
            ruleId: 'FHS-VAR-TOPLEVEL',
            title: `Non-Standard Top-Level Directory in /var: ${node.path}`,
            message: `Applications must not add top-level directories in /var without system-wide implication.`,
            recommendation: `Place application data in '/var/lib/${parts[1]}' or cache in '/var/cache/${parts[1]}'.`,
            fhsReference: 'FHS 3.0 §5.1: /var hierarchy isolation guidelines',
          });
        }
      }
    }

    // D. Executable binaries placed inside /etc
    if (node.path.startsWith('/etc/') && node.type === 'file') {
      const isExecutable = node.permissions.includes('7') || node.permissions.includes('5') || node.name.endsWith('.bin') || node.name.endsWith('.sh');
      if (isExecutable) {
        issues.push({
          id: `etc-binary-${node.id}`,
          nodeId: node.id,
          path: node.path,
          severity: 'warning',
          ruleId: 'FHS-ETC-NO-BINARIES',
          title: `Executable File in /etc: ${node.path}`,
          message: `/etc is reserved strictly for host-specific configuration files and must NOT contain binary executables or active command binaries.`,
          recommendation: `Move executable binaries to '/usr/bin', '/usr/sbin', or '/usr/local/bin', and keep only config files in '/etc'.`,
          fhsReference: 'FHS 3.0 §3.7: /etc host-specific configuration files',
        });
      }
    }

    // E. Shareability inconsistency check: /etc or /boot marked as shareable
    if ((node.path === '/etc' || node.path.startsWith('/etc/') || node.path === '/boot' || node.path.startsWith('/boot/')) && node.shareability === 'shareable') {
      issues.push({
        id: `unshareable-marked-shareable-${node.id}`,
        nodeId: node.id,
        path: node.path,
        severity: 'warning',
        ruleId: 'FHS-CLASSIFICATION-UNSHAREABLE',
        title: `Incorrect Classification: ${node.path} Marked as Shareable`,
        message: `${node.path} is host-specific or hardware-bound and is unshareable across systems by FHS definition.`,
        recommendation: `Change shareability to 'unshareable'.`,
        fhsReference: 'FHS 3.0 §1.2: Shareable vs. unshareable files',
      });
    }

    // F. /tmp directory permissions security check
    if (node.path === '/tmp' && node.permissions !== '1777') {
      issues.push({
        id: `tmp-permissions-${node.id}`,
        nodeId: node.id,
        path: node.path,
        severity: 'info',
        ruleId: 'FHS-TMP-STICKY',
        title: `Recommended Sticky Bit on /tmp (Current: ${node.permissions})`,
        message: `/tmp should standardly have mode 1777 (drwxrwxrwt) with sticky bit enabled to prevent users from deleting each other's temporary files.`,
        recommendation: `Set permissions to '1777'.`,
        fhsReference: 'FHS 3.0 §3.17: /tmp temporary files',
      });
    }
  }

  return issues;
}
