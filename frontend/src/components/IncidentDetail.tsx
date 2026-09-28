import React, { useState } from 'react';
import {
  Brain,
  Clock,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Trash2
} from 'lucide-react';
import type { IncidentDetailsBundle, IncidentStatus } from '../types';
import { AnalysisTab } from './tabs/AnalysisTab';
import { TimelineTab } from './tabs/TimelineTab';
import { EvidenceTab } from './tabs/EvidenceTab';
import { RemediationTab } from './tabs/RemediationTab';
import { PostmortemTab } from './tabs/PostmortemTab';

interface IncidentDetailProps {
  bundle: IncidentDetailsBundle;
  onUpdateStatus: (status: IncidentStatus) => void;
  onDelete: () => void;
  onAddEvent: () => void;
  onAddEvidence: () => void;
  onRecordRemediation: () => void;
  onOpenPostmortem: () => void;
  onRefresh: () => void;
}

type TabType = 'analysis' | 'timeline' | 'evidence' | 'remediations' | 'postmortem';

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  bundle,
  onUpdateStatus,
  onDelete,
  onAddEvent,
  onAddEvidence,
  onRecordRemediation,
  onOpenPostmortem,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('analysis');
  const { incident, timeline, evidence, remediations, postmortem, analysisRuns, relatedMemories } = bundle;

  const statuses: IncidentStatus[] = ['OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED'];

  return (
    <div className="bg-white border border-purple-100/90 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-14rem)] overflow-hidden">
      {/* War Room Header */}
      <div className="p-4 border-b border-purple-100 bg-purple-50/25">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-lg border border-purple-200">
                {incident.incident_key}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-lg font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {incident.severity}
              </span>
              <span className="text-xs font-mono text-purple-800 px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-100">
                {incident.service}
              </span>
              <span className="text-xs font-mono text-slate-600 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                {incident.environment}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {incident.title}
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              {incident.summary}
            </p>
          </div>

          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete incident"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Status Pipeline Controller */}
        <div className="mt-3.5 pt-3 border-t border-purple-100 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 mr-2 font-semibold">Status Stepper:</span>
            {statuses.map((s, idx) => {
              const isCurrent = incident.status === s;
              const isPast = statuses.indexOf(incident.status) > idx;
              return (
                <React.Fragment key={s}>
                  <button
                    onClick={() => {
                      if (s === 'RESOLVED' && !postmortem) {
                        onOpenPostmortem();
                      } else {
                        onUpdateStatus(s);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition flex items-center space-x-1 ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                        : isPast
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-purple-50/60 text-slate-600 border border-purple-100 hover:bg-purple-100 hover:text-purple-900'
                    }`}
                  >
                    {isPast && <CheckCircle2 className="h-3 w-3" />}
                    <span>{s}</span>
                  </button>
                  {idx < statuses.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-purple-300" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onAddEvent}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center space-x-1 transition"
            >
              <Plus className="h-3 w-3" />
              <span>Event</span>
            </button>
            <button
              onClick={onAddEvidence}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center space-x-1 transition"
            >
              <Plus className="h-3 w-3" />
              <span>Evidence</span>
            </button>
            <button
              onClick={onRecordRemediation}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 flex items-center space-x-1 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Remediation</span>
            </button>
          </div>
        </div>
      </div>

      {/* War Room Tabs */}
      <div className="border-b border-purple-100 px-4 bg-white flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'analysis'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-purple-700'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>AI Memory Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'timeline'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-purple-700'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timeline ({timeline.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'evidence'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-purple-700'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Evidence ({evidence.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('remediations')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'remediations'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-purple-700'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Remediation Feedback ({remediations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('postmortem')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'postmortem'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-purple-700'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Postmortem {postmortem ? '✓' : ''}</span>
          </button>
        </div>
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#faf8fd]/50">
        {activeTab === 'analysis' && (
          <AnalysisTab
            incidentId={incident.incident_key}
            initialRuns={analysisRuns}
            relatedMemories={relatedMemories}
            onOpenRemediationModal={onRecordRemediation}
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab
            timeline={timeline}
            onAddEvent={onAddEvent}
          />
        )}
        {activeTab === 'evidence' && (
          <EvidenceTab
            evidence={evidence}
            onAddEvidence={onAddEvidence}
          />
        )}
        {activeTab === 'remediations' && (
          <RemediationTab
            remediations={remediations}
            onRecordRemediation={onRecordRemediation}
          />
        )}
        {activeTab === 'postmortem' && (
          <PostmortemTab
            postmortem={postmortem}
            onOpenModal={onOpenPostmortem}
            isResolved={incident.status === 'RESOLVED'}
          />
        )}
      </div>
    </div>
  );
};
