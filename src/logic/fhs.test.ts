import test from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_FHS_TREE, INITIAL_PARTITIONS } from './fhsData.ts';
import { findNodeById, findNodeByPath, calculateTreeSize, insertChildNode, removeNodeById, moveNode } from './treeUtils.ts';
import { validateFHSTree } from './validator.ts';
import { generateBashScript, generateFstab, generateAsciiTree } from './export.ts';
import { FHSNode } from '../types/fhs.ts';

test('FHS tree contains standard required root directories', () => {
  const root = STANDARD_FHS_TREE;
  assert.equal(root.name, '/');
  assert.ok(root.children && root.children.length > 10);

  const bin = findNodeByPath(root, '/bin');
  assert.ok(bin, '/bin must exist');
  assert.equal(bin?.shareability, 'shareable');
  assert.equal(bin?.volatility, 'static');

  const etc = findNodeByPath(root, '/etc');
  assert.ok(etc, '/etc must exist');
  assert.equal(etc?.shareability, 'unshareable');
  assert.equal(etc?.volatility, 'static');

  const usr = findNodeByPath(root, '/usr');
  assert.ok(usr, '/usr must exist');
  assert.equal(usr?.shareability, 'shareable');
  assert.equal(usr?.volatility, 'static');

  const varDir = findNodeByPath(root, '/var');
  assert.ok(varDir, '/var must exist');
  assert.equal(varDir?.shareability, 'unshareable');
  assert.equal(varDir?.volatility, 'variable');
});

test('validator passes on standard FHS tree without critical errors', () => {
  const issues = validateFHSTree(STANDARD_FHS_TREE);
  const errors = issues.filter(i => i.severity === 'error');
  assert.equal(errors.length, 0, 'Standard FHS tree should have 0 critical errors');
});

test('validator detects application directory directly in root filesystem', () => {
  const customNode: FHSNode = {
    id: 'test-app',
    name: 'myapp',
    path: '/myapp',
    type: 'directory',
    shareability: 'shareable',
    volatility: 'static',
    description: 'Custom app directly in /',
    isStandardFHS: false,
    isRequired: false,
    standardHierarchy: 'custom',
    sizeMB: 100,
    permissions: '0755',
    owner: 'root:root',
  };

  const modifiedTree = insertChildNode(STANDARD_FHS_TREE, 'node-root', customNode);
  const issues = validateFHSTree(modifiedTree);
  const rootViolations = issues.filter(i => i.ruleId === 'FHS-ROOT-MINIMAL');
  assert.ok(rootViolations.length >= 1, 'Should flag application dir in root');
  assert.equal(rootViolations[0].path, '/myapp');
});

test('validator detects variable data placed inside /usr', () => {
  const variableUnderUsr: FHSNode = {
    id: 'test-var-usr',
    name: 'logs',
    path: '/usr/logs',
    type: 'directory',
    shareability: 'unshareable',
    volatility: 'variable',
    description: 'Variable logs placed in /usr',
    isStandardFHS: false,
    isRequired: false,
    standardHierarchy: 'custom',
    sizeMB: 50,
    permissions: '0755',
    owner: 'root:root',
  };

  const modifiedTree = insertChildNode(STANDARD_FHS_TREE, 'node-usr', variableUnderUsr);
  const issues = validateFHSTree(modifiedTree);
  const usrVarViolations = issues.filter(i => i.ruleId === 'FHS-USR-READONLY');
  assert.ok(usrVarViolations.length >= 1, 'Should flag variable data in /usr');
});

test('treeUtils can move nodes and recalculate paths correctly', () => {
  const sample = JSON.parse(JSON.stringify(STANDARD_FHS_TREE));
  // Add a test file inside /opt
  const testFile: FHSNode = {
    id: 'custom-file-1',
    name: 'test.cfg',
    path: '/opt/test.cfg',
    type: 'file',
    shareability: 'unshareable',
    volatility: 'static',
    description: 'Config',
    isStandardFHS: false,
    isRequired: false,
    standardHierarchy: 'custom',
    sizeMB: 1,
    permissions: '0644',
    owner: 'root:root',
  };

  const withFile = insertChildNode(sample, 'node-opt', testFile);
  const foundFile = findNodeById(withFile, 'custom-file-1');
  assert.ok(foundFile);
  assert.equal(foundFile?.path, '/opt/test.cfg');

  // Move to /etc
  const moved = moveNode(withFile, 'custom-file-1', 'node-etc');
  const foundMoved = findNodeById(moved, 'custom-file-1');
  assert.ok(foundMoved);
  assert.equal(foundMoved?.path, '/etc/test.cfg');
});

test('export generates valid bash script, fstab, and ASCII tree', () => {
  const bash = generateBashScript(STANDARD_FHS_TREE);
  assert.ok(bash.includes('mkdir -p "/bin"'));
  assert.ok(bash.includes('chmod 0755'));

  const fstab = generateFstab(INITIAL_PARTITIONS);
  assert.ok(fstab.includes('/dev/sda2'));
  assert.ok(fstab.includes('/usr'));
  assert.ok(fstab.includes('ro,nodev'));

  const ascii = generateAsciiTree(STANDARD_FHS_TREE);
  assert.ok(ascii.includes('bin/'));
  assert.ok(ascii.includes('usr/'));
  assert.ok(ascii.includes('var/'));
});
