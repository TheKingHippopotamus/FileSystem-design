import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  BookOpen,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { useFHS } from '../../context/FHSContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const FHSAuditPanel: React.FC = () => {
  const {
    validationIssues,
    setSelectedNodeId,
    setActiveTab,
    moveNode,
    addNode,
    rootTree,
    updateNode,
    showToast,
  } = useFHS();

  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const errors = validationIssues.filter(i => i.severity === 'error');
  const warnings = validationIssues.filter(i => i.severity === 'warning');
  const infos = validationIssues.filter(i => i.severity === 'info');

  const filteredIssues = validationIssues.filter(i => {
    if (severityFilter === 'all') return true;
    return i.severity === severityFilter;
  });

  const complianceScore = Math.max(
    0,
    Math.round(100 - errors.length * 20 - warnings.length * 8)
  );

  const handleFixIssue = (issue: typeof validationIssues[0]) => {
    // 1. If application in root -> move to /opt
    if (issue.ruleId === 'FHS-ROOT-MINIMAL') {
      const optNode = rootTree.children?.find(c => c.name === 'opt');
      if (optNode) {
        moveNode(issue.nodeId, optNode.id);
        showToast(`Relocated ${issue.path} to /opt/${issue.path.replace('/', '')}`);
      }
    } else if (issue.ruleId === 'FHS-USR-READONLY') {
      // 2. If variable data in /usr -> switch volatility to static or suggest /var
      updateNode(issue.nodeId, { volatility: 'static' });
      showToast(`Classified ${issue.path} as static to allow read-only /usr mounting`);
    } else if (issue.ruleId === 'FHS-TMP-STICKY') {
      // 3. Set sticky bit 1777 on /tmp
      updateNode(issue.nodeId, { permissions: '1777' });
      showToast('Set mode 1777 (sticky bit) on /tmp');
    } else if (issue.ruleId === 'FHS-CLASSIFICATION-UNSHAREABLE') {
      // 4. Set shareability to unshareable
      updateNode(issue.nodeId, { shareability: 'unshareable' });
      showToast(`Marked ${issue.path} as unshareable`);
    } else {
      setSelectedNodeId(issue.nodeId);
      setActiveTab('tree');
      showToast(`Selected ${issue.path} for manual inspection`);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto p-1 sm:p-2">
      {/* Top Health Card */}
      <Card
        variant="default"
        padding="md"
        className={`border ${
          errors.length > 0
            ? 'border-rose-500/30 bg-gradient-to-r from-slate-900 to-rose-950/20'
            : warnings.length > 0
            ? 'border-amber-500/30 bg-gradient-to-r from-slate-900 to-amber-950/20'
            : 'border-emerald-500/30 bg-gradient-to-r from-slate-900 to-emerald-950/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                errors.length > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : warnings.length > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {errors.length > 0 ? (
                <ShieldAlert className="w-8 h-8" />
              ) : (
                <ShieldCheck className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Filesystem Hierarchy Standard (FHS 3.0) Compliance Audit
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluates root minimalism, read-only /usr isolation, /var runtime isolation, and classification consistency.
              </p>
            </div>
          </div>

          {/* Compliance Score Gauge */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                FHS Health Score
              </span>
              <span
                className={`text-2xl font-mono font-black ${
                  complianceScore === 100
                    ? 'text-emerald-400'
                    : complianceScore >= 70
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {complianceScore}%
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-xs font-mono space-y-0.5">
              <div className="text-rose-400 font-bold">{errors.length} Errors</div>
              <div className="text-amber-400">{warnings.length} Warnings</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400">Filter Issues:</span>
          {(['all', 'error', 'warning', 'info'] as const).map(sev => {
            const count =
              sev === 'all'
                ? validationIssues.length
                : sev === 'error'
                ? errors.length
                : sev === 'warning'
                ? warnings.length
                : infos.length;

            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  severityFilter === sev
                    ? 'bg-slate-700 text-white font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev.charAt(0).toUpperCase() + sev.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      {/* Issues List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {filteredIssues.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100">
              Filesystem Hierarchy is 100% FHS Compliant!
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              All required root, /usr, and /var directories exist. Static and variable files are properly isolated, and /usr can be mounted safely as read-only.
            </p>
          </Card>
        ) : (
          filteredIssues.map(issue => {
            const isErr = issue.severity === 'error';
            const isWarn = issue.severity === 'warning';

            return (
              <Card
                key={issue.id}
                variant="default"
                padding="md"
                className={`border ${
                  isErr
                    ? 'border-rose-500/40 bg-slate-900/90'
                    : isWarn
                    ? 'border-amber-500/40 bg-slate-900/90'
                    : 'border-blue-500/40 bg-slate-900/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isErr ? (
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-400 shrink-0" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={issue.severity} size="xs">
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-slate-100">
                          {issue.path}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          - {issue.title}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {issue.message}
                      </p>

                      <div className="mt-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2 text-xs text-emerald-300">
                        <span className="font-bold shrink-0">Recommendation:</span>
                        <span>{issue.recommendation}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>{issue.fhsReference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <Button
                      variant="primary"
                      size="xs"
                      icon={<Wrench className="w-3.5 h-3.5" />}
                      onClick={() => handleFixIssue(issue)}
                    >
                      Quick Fix
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setSelectedNodeId(issue.nodeId);
                        setActiveTab('tree');
                      }}
                    >
                      Locate in Tree
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
