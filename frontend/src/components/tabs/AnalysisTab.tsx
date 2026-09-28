import React, { useState } from 'react';
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
    <div className="space-y-4">
      {/* Action Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-50/40 border border-purple-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Hindsight Operational Memory Reasoning</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-semibold">
              {analysis?.analysisMode || 'Ready'}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Synthesizes current telemetry with past incident postmortems, runbooks, and failed attempts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Run Memory Analysis'}</span>
          </button>

          <button
            onClick={handleRunComparison}
            disabled={isComparing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Split className={`h-3.5 w-3.5 ${isComparing ? 'animate-spin' : ''}`} />
            <span>{isComparing ? 'Comparing...' : 'Compare Baseline vs Memory'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* View Switcher if Comparison is Available */}
      {comparison && (
        <div className="flex items-center justify-center space-x-2 border-b border-purple-100 pb-3">
          <button
            onClick={() => setActiveView('current')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeView === 'current'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-slate-600 hover:text-purple-700'
            }`}
          >
            Detailed Analysis
          </button>
          <button
            onClick={() => setActiveView('compare')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeView === 'compare'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-slate-600 hover:text-purple-700'
            }`}
          >
            <Split className="h-3 w-3" />
            <span>Dual Comparison (Baseline vs RecallOps)</span>
          </button>
        </div>
      )}

      {/* DUAL COMPARISON VIEW */}
      {activeView === 'compare' && comparison && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 flex items-start space-x-2.5 shadow-sm">
            <Info className="h-4 w-4 shrink-0 text-purple-600 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Impact of Operational Memory: </span>
              {comparison.improvementSummary}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Column (No Memory) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Baseline (No Memory)</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">Generic LLM</span>
              </div>

              <div className="text-xs">
                <p className="font-semibold text-slate-600 mb-1">Likely Cause:</p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800">
                  {comparison.baselineAnalysis.likelyCauses[0]?.cause || 'Under investigation'}
                </div>
              </div>

              <div className="text-xs">
                <p className="font-semibold text-slate-600 mb-1">Awareness of Past Failures:</p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 italic">
                  None. Lacks historical context and may recommend actions that previously failed.
                </div>
              </div>

              <div className="text-xs">
                <p className="font-semibold text-slate-600 mb-1">Recommended Next Action:</p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800">
                  {comparison.baselineAnalysis.recommendedInvestigationSteps[0]?.action || 'Collect logs'}
                </div>
              </div>
            </div>

            {/* Memory-Powered Column (RecallOps) */}
            <div className="bg-purple-50/50 border border-purple-200/90 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">RecallOps (Hindsight Memory)</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold border border-purple-200">Memory-Enhanced</span>
              </div>

              <div className="text-xs">
                <p className="font-semibold text-purple-900 mb-1">Grounded Cause with Prior Evidence:</p>
                <div className="p-2.5 rounded-xl bg-white border border-purple-200 text-purple-950 font-medium">
                  {comparison.memoryPoweredAnalysis.likelyCauses[0]?.cause}
                </div>
              </div>

              <div className="text-xs">
                <p className="font-semibold text-amber-700 mb-1 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  <span>Deprioritized (Failed in Past Incidents):</span>
                </p>
                {comparison.memoryPoweredAnalysis.deprioritizedActions.length > 0 ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="font-bold block">{comparison.memoryPoweredAnalysis.deprioritizedActions[0].action}</span>
                    <span className="text-[11px] text-amber-800/80 block mt-0.5">{comparison.memoryPoweredAnalysis.deprioritizedActions[0].reason}</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">No failed actions recorded</div>
                )}
              </div>

              <div className="text-xs">
                <p className="font-semibold text-emerald-700 mb-1 flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>Verified Historical Resolution:</span>
                </p>
                {comparison.memoryPoweredAnalysis.recommendedRemediationSteps.length > 0 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <span className="font-bold block">{comparison.memoryPoweredAnalysis.recommendedRemediationSteps[0].action}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider block mt-1">
                      ⚠️ Human Approval Required
                    </span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">Awaiting investigation results</div>
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
            <div className="p-12 text-center border-2 border-dashed border-purple-200 rounded-2xl bg-white space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                <Brain className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Analysis Generated Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Run Memory Analysis" to consult Hindsight operational memories and synthesize investigation guidance.
              </p>
              <button
                onClick={handleRunAnalysis}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition"
              >
                {isLoading ? 'Analyzing...' : 'Run Analysis Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Safety Shield Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800 shadow-sm">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{analysis.safetyNotice}</span>
              </div>

              {/* Likely Causes */}
              <div className="bg-white border border-purple-100/90 rounded-2xl p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Zap className="h-3.5 w-3.5 text-purple-600" />
                  <span>Likely Causes & Telemetry Evidence</span>
                </h4>

                <div className="space-y-2">
                  {analysis.likelyCauses.map((lc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-purple-50/30 border border-purple-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{lc.cause}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            lc.confidence === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : lc.confidence === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-100 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {lc.confidence} CONFIDENCE
                        </span>
                      </div>

                      {lc.evidence.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-slate-600">Supporting Evidence:</p>
                          <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
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
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Deprioritized Actions (Previously Failed in Historical Incidents)</span>
                  </h4>

                  <div className="space-y-2">
                    {analysis.deprioritizedActions.map((da, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-amber-200/80 text-xs text-amber-900">
                        <div className="font-bold text-amber-950 line-clamp-1">⛔ {da.action}</div>
                        <div className="text-[11px] text-amber-800/90 mt-0.5">{da.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Remediations */}
              <div className="bg-white border border-purple-100/90 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Recommended Remediation Steps</span>
                  </h4>
                  <button
                    onClick={onOpenRemediationModal}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center space-x-1"
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
                      <div key={idx} className="p-3.5 rounded-xl bg-purple-50/20 border border-purple-100 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">#{step.priority} {step.action}</span>
                            {step.humanApprovalRequired && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                                Human Approval Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">{step.reason}</p>
                        </div>

                        <button
                          onClick={onOpenRemediationModal}
                          className="shrink-0 px-3 py-1.5 text-xs rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold transition"
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
                <div className="bg-white border border-purple-100/90 rounded-2xl p-4 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center space-x-1.5">
                    <Brain className="h-3.5 w-3.5" />
                    <span>Operational Memories Recalled from Hindsight Bank</span>
                  </h4>

                  <div className="space-y-2">
                    {analysis.memoryEvidence.map((mem, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-purple-50/40 border border-purple-100 text-xs space-y-1 font-mono">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="text-purple-700 font-bold">Memory: {mem.memoryType}</span>
                          <span className="text-slate-600">Source: {mem.sourceIncidentId}</span>
                        </div>
                        <p className="text-slate-700 text-[11px] whitespace-pre-wrap leading-relaxed">
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
