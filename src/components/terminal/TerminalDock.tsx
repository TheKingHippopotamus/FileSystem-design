import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import { executeFHSCommand } from '../../logic/simulator';
import { Card } from '../ui/Card';

interface HistoryEntry {
  command: string;
  output: string;
  isError?: boolean;
}

export const TerminalDock: React.FC = () => {
  const { rootTree, partitions } = useFHS();
  const [cwd, setCwd] = useState('/');
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      command: 'fhs-audit',
      output: '[*] FHS Interactive Shell Initialized.\nType "help" or click one of the quick command buttons below.',
    },
  ]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickCommands = [
    'ls -la',
    'tree',
    'df -h',
    'stat /etc',
    'stat /var/mail',
    'cat /etc/fstab',
    'fhs-audit',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const runCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    if (trimmed === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }

    const res = executeFHSCommand(trimmed, rootTree, cwd, partitions);
    setHistory(prev => [
      ...prev,
      {
        command: trimmed,
        output: res.output,
        isError: res.isError,
      },
    ]);

    if (res.newCwd) {
      setCwd(res.newCwd);
    }

    setInputVal('');
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx].command);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx].command);
        } else {
          setHistoryIdx(-1);
          setInputVal('');
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono shadow-xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs text-slate-400 font-semibold ml-2 flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-orange-400" />
            fhs-shell: {cwd} (bash)
          </span>
        </div>

        <button
          onClick={() => setHistory([])}
          className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 cursor-pointer text-xs"
          title="Clear screen"
          aria-label="Clear terminal history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Command Chips */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">Quick Run:</span>
        {quickCommands.map(cmd => (
          <button
            key={cmd}
            onClick={() => runCommand(cmd)}
            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] text-emerald-400 border border-slate-700/80 hover:border-emerald-500/40 whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Output Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs leading-relaxed">
        {history.map((entry, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-orange-400 font-bold">root@ubuntu-fhs:{cwd}#</span>
              <span className="text-slate-100 font-bold">{entry.command}</span>
            </div>
            {entry.output && (
              <pre className={`p-2.5 rounded-lg whitespace-pre-wrap font-mono text-[11px] sm:text-xs overflow-x-auto ${
                entry.isError
                  ? 'bg-rose-950/20 text-rose-300 border border-rose-900/40'
                  : 'bg-slate-900/50 text-emerald-300/90 border border-slate-800/50'
              }`}>
                {entry.output}
              </pre>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Interactive Command Input Line */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <span className="text-orange-400 font-bold text-xs shrink-0">
          root@ubuntu-fhs:{cwd}#
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (ls, stat, tree, df, help)..."
          className="flex-1 bg-transparent text-slate-100 text-xs sm:text-sm focus:outline-none placeholder-slate-600 font-mono"
        />
        <button
          onClick={() => runCommand(inputVal)}
          disabled={!inputVal.trim()}
          className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white cursor-pointer"
          aria-label="Execute command"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
