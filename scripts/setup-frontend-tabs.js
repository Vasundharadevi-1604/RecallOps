import fs from 'node:fs';
import path from 'node:path';

function write(relPath, content) {
  const full = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('Created:', relPath);
}

// 1. AnalysisTab.tsx
write('frontend/src/components/tabs/AnalysisTab.tsx', `import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Split,
  Eye,
  RotateCcw,
  Zap,
  Info,
  Clock,
  Layers
} from 'lucide-react';
import type {
  AnalysisResult,
  AnalysisRun,
  CompareAnalysisResponse,
  NormalizedMemory
} from '../../types';
import { api } from '../../api/client';

interface AnalysisTabProps {
  incidentId: string;
  initialRuns: AnalysisRun[];
  relatedMemories: NormalizedMemory[];
  onOpenRemediationModal: () => void;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  incidentId,
  initialRuns,
  relatedMemories,
  onOpenRemediationModal
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    initialRuns.length > 0 ? initialRuns[0].analysis_json : null
  );
  const [comparison, setComparison] = useState<CompareAnalysisResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'current' | 'compare'>('current');

  const handleRunAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.analyze(incidentId);
      setAnalysis(res);
      setActiveView('current');
    } catch (err: any) {
      setError(err?.message || 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunComparison = async () => {
    try {
      setIsComparing(true);
      setError(null);
      const res = await api.compareAnalysis(incidentId);
      setComparison(res);
      setActiveView('compare');
    } catch (err: any) {
      setError(err?.message || 'Comparison failed');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/20">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Hindsight Operational Memory Reasoning</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
              {analysis?.analysisMode || 'Ready'}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Synthesizes current telemetry with past incident postmortems, runbooks, and failed attempts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-600/30 transition disabled:opacity-50"
          >
            <Sparkles className={\`h-3.5 w-3.5 \${isLoading ? 'animate-spin' : ''}\`} />
            <span>{isLoading ? 'Analyzing...' : 'Run Memory Analysis'}</span>
          </button>

          <button
            onClick={handleRunComparison}
            disabled={isComparing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Split className={\`h-3.5 w-3.5 \${isComparing ? 'animate-spin' : ''}\`} />
            <span>{isComparing ? 'Comparing...' : 'Compare Baseline vs Memory'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* View Switcher if Comparison is Available */}
      {comparison && (
        <div className="flex items-center justify-center space-x-2 border-b border-recall-border pb-3">
          <button
            onClick={() => setActiveView('current')}
            className={\`px-3 py-1 rounded-md text-xs font-medium transition \${
              activeView === 'current'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }\`}
          >
            Detailed Analysis
          </button>
          <button
            onClick={() => setActiveView('compare')}
            className={\`px-3 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 \${
              activeView === 'compare'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }\`}
          >
            <Split className="h-3 w-3" />
            <span>Dual Comparison (Baseline vs RecallOps)</span>
          </button>
        </div>
      )}

      {/* DUAL COMPARISON VIEW */}
      {activeView === 'compare' && comparison && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 flex items-start space-x-2">
            <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Impact of Operational Memory: </span>
              {comparison.improvementSummary}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Column (No Memory) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Baseline (No Memory)</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Generic LLM</span>
              </div>

              <div className="text-xs text-slate-300">
                <p className="font-medium text-slate-400 mb-1">Likely Cause:</p>
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
                  {comparison.baselineAnalysis.likelyCauses[0]?.cause || 'Under investigation'}
                </div>
              </div>

              <div className="text-xs text-slate-300">
                <p className="font-medium text-slate-400 mb-1">Awareness of Past Failures:</p>
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400 italic">
                  None. Lacks historical context and may recommend actions that previously failed.
                </div>
              </div>

              <div className="text-xs text-slate-300">
                <p className="font-medium text-slate-400 mb-1">Recommended Next Action:</p>
                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
                  {comparison.baselineAnalysis.recommendedInvestigationSteps[0]?.action || 'Collect logs'}
                </div>
              </div>
            </div>

            {/* Memory-Powered Column (RecallOps) */}
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 space-y-3 shadow-lg shadow-purple-950/30">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">RecallOps (Hindsight Memory)</h4>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Memory-Enhanced</span>
              </div>

              <div className="text-xs text-slate-200">
                <p className="font-medium text-purple-300 mb-1">Grounded Cause with Prior Evidence:</p>
                <div className="p-2.5 rounded bg-slate-950/90 border border-purple-500/30 text-purple-200">
                  {comparison.memoryPoweredAnalysis.likelyCauses[0]?.cause}
                </div>
              </div>

              <div className="text-xs text-slate-200">
                <p className="font-medium text-amber-400 mb-1 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Deprioritized (Failed in Past Incidents):</span>
                </p>
                {comparison.memoryPoweredAnalysis.deprioritizedActions.length > 0 ? (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    <span className="font-semibold block">{comparison.memoryPoweredAnalysis.deprioritizedActions[0].action}</span>
                    <span className="text-[11px] text-amber-400/80 block mt-0.5">{comparison.memoryPoweredAnalysis.deprioritizedActions[0].reason}</span>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-slate-950 text-slate-400 text-xs">No failed actions recorded</div>
                )}
              </div>

              <div className="text-xs text-slate-200">
                <p className="font-medium text-emerald-400 mb-1 flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Verified Historical Resolution:</span>
                </p>
                {comparison.memoryPoweredAnalysis.recommendedRemediationSteps.length > 0 ? (
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <span className="font-semibold block">{comparison.memoryPoweredAnalysis.recommendedRemediationSteps[0].action}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block mt-1">
                      ⚠️ Human Approval Required
                    </span>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-slate-950 text-slate-400 text-xs">Awaiting investigation results</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED ANALYSIS VIEW */}
      {(!comparison || activeView === 'current') && (
        <>
          {!analysis ? (
            <div className="p-12 text-center border border-dashed border-recall-border rounded-xl space-y-3">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                <Brain className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">No Analysis Generated Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Run Memory Analysis" to consult Hindsight operational memories and synthesize investigation guidance.
              </p>
              <button
                onClick={handleRunAnalysis}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-600/30 transition"
              >
                {isLoading ? 'Analyzing...' : 'Run Analysis Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Safety Shield Banner */}
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="font-medium">{analysis.safetyNotice}</span>
              </div>

              {/* Likely Causes */}
              <div className="bg-recall-surface border border-recall-border rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Zap className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Likely Causes & Telemetry Evidence</span>
                </h4>

                <div className="space-y-2">
                  {analysis.likelyCauses.map((lc, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-100">{lc.cause}</span>
                        <span
                          className={\`text-[10px] font-mono px-2 py-0.5 rounded font-bold \${
                            lc.confidence === 'HIGH'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : lc.confidence === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }\`}
                        >
                          {lc.confidence} CONFIDENCE
                        </span>
                      </div>

                      {lc.evidence.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-slate-400">Supporting Evidence:</p>
                          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                            {lc.evidence.map((ev, i) => (
                              <li key={i}>{ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Deprioritized Actions (Failed in the Past) */}
              {analysis.deprioritizedActions.length > 0 && (
                <div className="bg-amber-950/15 border border-amber-500/30 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Deprioritized Actions (Previously Failed in Historical Incidents)</span>
                  </h4>

                  <div className="space-y-2">
                    {analysis.deprioritizedActions.map((da, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                        <div className="font-semibold text-amber-100 line-clamp-1">⛔ {da.action}</div>
                        <div className="text-[11px] text-amber-300/80 mt-0.5">{da.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Remediations */}
              <div className="bg-recall-surface border border-recall-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Recommended Remediation Steps</span>
                  </h4>
                  <button
                    onClick={onOpenRemediationModal}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <span>Record Execution Outcome</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {analysis.recommendedRemediationSteps.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No disruptive remediations proposed until investigation confirms root cause.</p>
                ) : (
                  <div className="space-y-2">
                    {analysis.recommendedRemediationSteps.map((step, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">#{step.priority} {step.action}</span>
                            {step.humanApprovalRequired && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                                Human Approval Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{step.reason}</p>
                        </div>

                        <button
                          onClick={onOpenRemediationModal}
                          className="shrink-0 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
                        >
                          Execute & Log
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recalled Memory Bank Evidence */}
              {analysis.memoryEvidence.length > 0 && (
                <div className="bg-recall-surface border border-recall-border rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                    <Brain className="h-3.5 w-3.5" />
                    <span>Operational Memories Recalled from Hindsight Bank</span>
                  </h4>

                  <div className="space-y-2">
                    {analysis.memoryEvidence.map((mem, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1 font-mono">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="text-purple-300">Memory: {mem.memoryType}</span>
                          <span className="text-slate-500">Source: {mem.sourceIncidentId}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed">
                          {mem.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
`);

// 2. TimelineTab.tsx
write('frontend/src/components/tabs/TimelineTab.tsx', `import React, { useState } from 'react';
import {
  Clock,
  Plus,
  AlertTriangle,
  UploadCloud,
  Wrench,
  Stethoscope,
  BookOpen,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import type { TimelineEvent } from '../../types';

interface TimelineTabProps {
  timeline: TimelineEvent[];
  onAddEvent: () => void;
}

const eventTypeIcons: Record<string, React.ReactNode> = {
  INCIDENT_CREATED: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
  ALERT: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
  DEPLOYMENT: <UploadCloud className="h-3.5 w-3.5 text-blue-400" />,
  INFRA_CHANGE: <Wrench className="h-3.5 w-3.5 text-indigo-400" />,
  DIAGNOSIS: <Stethoscope className="h-3.5 w-3.5 text-purple-400" />,
  RUNBOOK: <BookOpen className="h-3.5 w-3.5 text-emerald-400" />,
  HUMAN_FEEDBACK: <MessageSquare className="h-3.5 w-3.5 text-slate-300" />,
  STATUS_CHANGED: <Clock className="h-3.5 w-3.5 text-cyan-400" />,
  POSTMORTEM_CREATED: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
};

export const TimelineTab: React.FC<TimelineTabProps> = ({ timeline, onAddEvent }) => {
  const [filterType, setFilterType] = useState('ALL');

  const filtered = timeline.filter(t => {
    if (filterType !== 'ALL' && t.event_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-recall-border">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">Filter Type:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300"
          >
            <option value="ALL">All Events ({timeline.length})</option>
            <option value="ALERT">Alerts</option>
            <option value="DEPLOYMENT">Deployments</option>
            <option value="INFRA_CHANGE">Infra Changes</option>
            <option value="DIAGNOSIS">Diagnosis</option>
            <option value="STATUS_CHANGED">Status Changes</option>
          </select>
        </div>

        <button
          onClick={onAddEvent}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Timeline Event</span>
        </button>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {filtered.map((item, idx) => (
          <div key={item.id || idx} className="relative group">
            {/* Timeline bullet icon */}
            <div className="absolute -left-6 mt-1 h-5 w-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
              {eventTypeIcons[item.event_type] || <Clock className="h-3 w-3 text-slate-400" />}
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 group-hover:border-slate-700 transition space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-indigo-400">{item.event_type}</span>
                <span className="text-slate-500 font-mono">
                  {new Date(item.occurred_at).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">{item.description}</p>

              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  {JSON.stringify(item.metadata)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
`);

// 3. EvidenceTab.tsx
write('frontend/src/components/tabs/EvidenceTab.tsx', `import React from 'react';
import { FileText, Plus, Terminal, AlertTriangle, UploadCloud, Cpu } from 'lucide-react';
import type { Evidence } from '../../types';

interface EvidenceTabProps {
  evidence: Evidence[];
  onAddEvidence: () => void;
}

const kindBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  log: { label: 'Log Snippet', color: 'bg-slate-800 text-slate-200 border-slate-700', icon: <Terminal className="h-3.5 w-3.5" /> },
  alert: { label: 'Alert Trigger', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  deployment: { label: 'Deployment', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <UploadCloud className="h-3.5 w-3.5" /> },
  infra_change: { label: 'Infra Change', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <Cpu className="h-3.5 w-3.5" /> }
};

export const EvidenceTab: React.FC<EvidenceTabProps> = ({ evidence, onAddEvidence }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-recall-border">
        <div>
          <h3 className="text-xs font-semibold text-white">Telemetry & Evidence Locker</h3>
          <p className="text-[11px] text-slate-400">All evidence is automatically retained as operational memory in Hindsight.</p>
        </div>

        <button
          onClick={onAddEvidence}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Attach Evidence</span>
        </button>
      </div>

      {evidence.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">
          No evidence records attached yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {evidence.map((item, idx) => {
            const badge = kindBadges[item.kind] || {
              label: item.kind,
              color: 'bg-slate-800 text-slate-300 border-slate-700',
              icon: <FileText className="h-3.5 w-3.5" />
            };

            return (
              <div key={item.id || idx} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={\`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center space-x-1 \${badge.color}\`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-950 font-mono text-xs text-slate-200 whitespace-pre-wrap overflow-x-auto border border-slate-900">
                  {item.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
`);

// 4. RemediationTab.tsx
write('frontend/src/components/tabs/RemediationTab.tsx', `import React from 'react';
import { RotateCcw, Plus, CheckCircle2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import type { Remediation } from '../../types';

interface RemediationTabProps {
  remediations: Remediation[];
  onRecordRemediation: () => void;
}

const resultBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SUCCESS: { label: 'SUCCESSFUL', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  PARTIAL_SUCCESS: { label: 'PARTIAL SUCCESS', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  FAILED: { label: 'FAILED / NO EFFECT', color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: <XCircle className="h-3.5 w-3.5" /> },
  UNKNOWN: { label: 'PENDING', color: 'bg-slate-700 text-slate-300 border-slate-600', icon: <RotateCcw className="h-3.5 w-3.5" /> }
};

export const RemediationTab: React.FC<RemediationTabProps> = ({ remediations, onRecordRemediation }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-recall-border">
        <div>
          <h3 className="text-xs font-semibold text-white">Remediation Feedback Loop</h3>
          <p className="text-[11px] text-slate-400">
            Recording failed and successful actions teaches Hindsight to stop future teams from repeating doomed fixes.
          </p>
        </div>

        <button
          onClick={onRecordRemediation}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition shadow-md shadow-amber-600/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Record Remediation Outcome</span>
        </button>
      </div>

      {remediations.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">
          No remediation attempts recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {remediations.map((rem, idx) => {
            const badge = resultBadges[rem.result] || resultBadges.UNKNOWN;

            return (
              <div key={rem.id || idx} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={\`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold flex items-center space-x-1 \${badge.color}\`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Type: {rem.action_type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(rem.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white">{rem.action}</div>
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500">Rationale: </span>
                    {rem.rationale}
                  </p>
                  {rem.notes && (
                    <p className="text-xs text-slate-300">
                      <span className="text-slate-500">Outcome Notes: </span>
                      {rem.notes}
                    </p>
                  )}
                  {rem.performed_by && (
                    <p className="text-[11px] text-slate-400">
                      <span className="text-slate-500">Executed by: </span>
                      {rem.performed_by}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
`);

// 5. PostmortemTab.tsx
write('frontend/src/components/tabs/PostmortemTab.tsx', `import React from 'react';
import { CheckCircle2, FileText, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import type { Postmortem } from '../../types';

interface PostmortemTabProps {
  postmortem: Postmortem | null;
  onOpenModal: () => void;
  isResolved: boolean;
}

export const PostmortemTab: React.FC<PostmortemTabProps> = ({
  postmortem,
  onOpenModal,
  isResolved
}) => {
  if (!postmortem) {
    return (
      <div className="p-12 text-center border border-dashed border-recall-border rounded-xl space-y-3">
        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
          <FileText className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">No Postmortem Recorded Yet</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Recording a postmortem establishes ground-truth operational memory for Hindsight and transitions the incident to RESOLVED.
        </p>
        <button
          onClick={onOpenModal}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition"
        >
          Record Postmortem & Resolve Incident
        </button>
      </div>
    );
  }

  const factors = postmortem.contributingFactors || postmortem.contributing_factors || [];
  const preventions = postmortem.preventionActions || postmortem.prevention_actions || [];

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold">Incident Resolved & Sealed in Hindsight Operational Memory</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {new Date(postmortem.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="bg-recall-surface border border-recall-border rounded-xl p-4 space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Root Cause</h4>
          <p className="text-xs text-slate-200 leading-relaxed p-3 rounded bg-slate-900 border border-slate-800">
            {postmortem.rootCause || postmortem.root_cause}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Resolution</h4>
          <p className="text-xs text-slate-200 leading-relaxed p-3 rounded bg-slate-900 border border-slate-800">
            {postmortem.resolution}
          </p>
        </div>

        {factors.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Contributing Factors</h4>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside p-3 rounded bg-slate-900 border border-slate-800">
              {factors.map((f: string, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Customer Impact</h4>
          <p className="text-xs text-slate-300 p-3 rounded bg-slate-900 border border-slate-800">
            {postmortem.customerImpact || postmortem.customer_impact}
          </p>
        </div>

        {preventions.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Prevention & Action Items</h4>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside p-3 rounded bg-slate-900 border border-slate-800">
              {preventions.map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Lessons Learned</h4>
          <p className="text-xs text-slate-300 p-3 rounded bg-slate-900 border border-slate-800">
            {postmortem.lessonsLearned || postmortem.lessons_learned}
          </p>
        </div>
      </div>
    </div>
  );
};
`);

console.log('Tabs generated successfully!');
