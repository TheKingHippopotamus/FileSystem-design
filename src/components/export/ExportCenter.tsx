import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Terminal,
  FileText,
  Boxes,
  Code,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import {
  generateBashScript,
  generateFstab,
  generateAsciiTree,
  generateDockerfile,
} from '../../logic/export';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const ExportCenter: React.FC = () => {
  const { rootTree, partitions, showToast } = useFHS();
  const [activeTab, setActiveTab] = useState<'bash' | 'fstab' | 'tree' | 'docker' | 'json'>('bash');
  const [copied, setCopied] = useState(false);

  const getExportContent = () => {
    switch (activeTab) {
      case 'bash':
        return {
          content: generateBashScript(rootTree),
          filename: 'setup-fhs.sh',
          language: 'bash',
        };
      case 'fstab':
        return {
          content: generateFstab(partitions),
          filename: 'fstab',
          language: 'config',
        };
      case 'tree':
        return {
          content: generateAsciiTree(rootTree),
          filename: 'tree.txt',
          language: 'text',
        };
      case 'docker':
        return {
          content: generateDockerfile(rootTree),
          filename: 'Dockerfile',
          language: 'dockerfile',
        };
      case 'json':
        return {
          content: JSON.stringify(
            {
              fhsVersion: '3.0',
              architecturePlan: rootTree,
              partitions,
              exportedAt: new Date().toISOString(),
            },
            null,
            2
          ),
          filename: 'fhs-architecture.json',
          language: 'json',
        };
    }
  };

  const { content, filename, language } = getExportContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    showToast(`Copied ${filename} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto p-1 sm:p-2">
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Planning & Code Generation Center</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Export real bash scripts, production /etc/fstab mount tables, Dockerfile layers, and JSON blueprints.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </div>
        </div>

        {/* Export Target Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 text-xs">
          {[
            { id: 'bash', label: 'setup-fhs.sh (Bash)', icon: <Terminal className="w-3.5 h-3.5" /> },
            { id: 'fstab', label: '/etc/fstab (Mounts)', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'tree', label: 'tree.txt (ASCII Tree)', icon: <Boxes className="w-3.5 h-3.5" /> },
            { id: 'docker', label: 'Dockerfile (OCI Layer)', icon: <Code className="w-3.5 h-3.5" /> },
            { id: 'json', label: 'Blueprint (JSON)', icon: <FileCode className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-orange-400 border-orange-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Code Viewer */}
      <Card variant="default" padding="none" className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-400">
          <span>{filename}</span>
          <span className="uppercase text-[10px] text-slate-500">{language}</span>
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
          <pre className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed overflow-x-auto whitespace-pre">
            {content}
          </pre>
        </div>
      </Card>
    </div>
  );
};
