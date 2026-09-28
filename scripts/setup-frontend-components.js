import fs from 'node:fs';
import path from 'node:path';

function write(relPath, content) {
  const full = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('Created:', relPath);
}

// 1. Header.tsx
write('frontend/src/components/Header.tsx', `import React from 'react';
import { Shield, Sparkles, Database, Brain, Activity, Plus, RefreshCw } from 'lucide-react';
import type { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  onSeedDemo: () => void;
  onNewIncident: () => void;
  isSeeding: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onSeedDemo,
  onNewIncident,
  isSeeding
}) => {
  return (
    <header className="border-b border-recall-border bg-recall-surface/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">RecallOps</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Memory-Powered SRE
              </span>
            </div>
            <p className="text-xs text-slate-400">Incident Response with Hindsight Operational Memory</p>
          </div>
        </div>

        {/* Integration Status Badges */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300">API:</span>
            <span className="text-emerald-400 font-medium">Online</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-slate-300">SQLite:</span>
            <span className="text-blue-400 font-medium">Connected</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Brain className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-slate-300">Hindsight:</span>
            <span className={health?.integrations?.hindsight ? "text-purple-400 font-medium" : "text-amber-400 font-medium"}>
              {health?.integrations?.hindsight ? "Connected" : "Local Store Active"}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            <span className="text-slate-300">AI:</span>
            <span className={health?.integrations?.groq ? "text-pink-400 font-medium" : "text-slate-400 font-medium"}>
              {health?.integrations?.groq ? "Groq (Live)" : "Deterministic (Safe)"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-50"
            title="Reset or seed demo incidents and memories"
          >
            <RefreshCw className={\`h-3.5 w-3.5 \${isSeeding ? 'animate-spin text-indigo-400' : 'text-slate-400'}\`} />
            <span>{isSeeding ? 'Seeding...' : 'Seed Demo'}</span>
          </button>

          <button
            onClick={onNewIncident}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Incident</span>
          </button>
        </div>
      </div>
    </header>
  );
};
`);

// 2. StatsOverview.tsx
write('frontend/src/components/StatsOverview.tsx', `import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, BrainCircuit } from 'lucide-react';
import type { SystemStats } from '../types';

interface StatsOverviewProps {
  stats: SystemStats | null;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Active Incidents */}
      <div className="bg-recall-surface border border-recall-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Incidents</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-white">{stats.activeIncidents}</span>
            <span className="text-xs text-slate-400">of {stats.totalIncidents} total</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
      </div>

      {/* Critical P0/SEV1 */}
      <div className="bg-recall-surface border border-recall-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Critical (SEV1)</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-red-400">{stats.severityBreakdown.SEV1}</span>
            <span className="text-xs text-slate-400">P0 urgency</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
      </div>

      {/* MTTR */}
      <div className="bg-recall-surface border border-recall-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mean Time to Resolve</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">
              {stats.mttrMinutes !== null ? \`\${stats.mttrMinutes}m\` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">avg MTTR</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Clock className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      {/* Memory Bank Retention */}
      <div className="bg-recall-surface border border-recall-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Historical Memory</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-purple-400">{stats.resolvedIncidents}</span>
            <span className="text-xs text-slate-400">retained postmortems</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <BrainCircuit className="h-5 w-5 text-purple-400" />
        </div>
      </div>
    </div>
  );
};
`);

// 3. IncidentList.tsx
write('frontend/src/components/IncidentList.tsx', `import React from 'react';
import { Search, Filter, ShieldAlert, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import type { Incident, Severity, IncidentStatus } from '../types';

interface IncidentListProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (incidentKey: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  severityFilter: string;
  setSeverityFilter: (s: string) => void;
  serviceFilter: string;
  setServiceFilter: (s: string) => void;
  services: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const severityBadgeColors: Record<Severity, string> = {
  SEV1: 'bg-red-500/15 text-red-400 border-red-500/30',
  SEV2: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  SEV3: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  SEV4: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
};

const statusBadgeColors: Record<IncidentStatus, string> = {
  OPEN: 'bg-red-500/10 text-red-400 border-red-500/20',
  INVESTIGATING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MITIGATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedId,
  onSelect,
  statusFilter,
  setStatusFilter,
  severityFilter,
  setSeverityFilter,
  serviceFilter,
  setServiceFilter,
  services,
  searchQuery,
  setSearchQuery
}) => {
  const filtered = incidents.filter(i => {
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && i.severity !== severityFilter) return false;
    if (serviceFilter !== 'ALL' && i.service !== serviceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        i.incident_key.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.service.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="bg-recall-surface border border-recall-border rounded-xl flex flex-col h-[calc(100vh-14rem)]">
      {/* Search & Filters */}
      <div className="p-3 border-b border-recall-border space-y-2">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search key, title, service..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Severity</option>
            <option value="SEV1">SEV1 (Critical)</option>
            <option value="SEV2">SEV2 (Major)</option>
            <option value="SEV3">SEV3 (Moderate)</option>
            <option value="SEV4">SEV4 (Minor)</option>
          </select>

          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Services</option>
            {services.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="overflow-y-auto flex-1 divide-y divide-recall-border/50">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No incidents matching filters.
          </div>
        ) : (
          filtered.map(incident => {
            const isSelected = selectedId === incident.id || selectedId === incident.incident_key;
            return (
              <div
                key={incident.id}
                onClick={() => onSelect(incident.incident_key)}
                className={\`p-3 cursor-pointer transition flex flex-col space-y-1.5 \${
                  isSelected
                    ? 'bg-indigo-950/40 border-l-2 border-indigo-500 pl-[10px]'
                    : 'hover:bg-slate-800/40'
                }\`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {incident.incident_key}
                    </span>
                    <span className={\`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold \${severityBadgeColors[incident.severity]}\`}>
                      {incident.severity}
                    </span>
                  </div>
                  <span className={\`text-[10px] font-medium px-2 py-0.5 rounded-full border \${statusBadgeColors[incident.status]}\`}>
                    {incident.status}
                  </span>
                </div>

                <h4 className="text-xs font-medium text-slate-200 line-clamp-1">
                  {incident.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-indigo-400/90">{incident.service}</span>
                  <span>{new Date(incident.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
`);

// 4. IncidentDetail.tsx
write('frontend/src/components/IncidentDetail.tsx', `import React, { useState } from 'react';
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
    <div className="bg-recall-surface border border-recall-border rounded-xl flex flex-col h-[calc(100vh-14rem)] overflow-hidden">
      {/* War Room Header */}
      <div className="p-4 border-b border-recall-border bg-slate-900/40">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {incident.incident_key}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                {incident.severity}
              </span>
              <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {incident.service}
              </span>
              <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {incident.environment}
              </span>
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              {incident.title}
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {incident.summary}
            </p>
          </div>

          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Delete incident"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Status Pipeline Controller */}
        <div className="mt-4 pt-3 border-t border-recall-border/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 mr-2 font-medium">Status Stepper:</span>
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
                    className={\`text-xs px-2.5 py-1 rounded-md font-medium transition flex items-center space-x-1 \${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : isPast
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }\`}
                  >
                    {isPast && <CheckCircle2 className="h-3 w-3" />}
                    <span>{s}</span>
                  </button>
                  {idx < statuses.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onAddEvent}
              className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center space-x-1"
            >
              <Plus className="h-3 w-3" />
              <span>Event</span>
            </button>
            <button
              onClick={onAddEvidence}
              className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center space-x-1"
            >
              <Plus className="h-3 w-3" />
              <span>Evidence</span>
            </button>
            <button
              onClick={onRecordRemediation}
              className="px-2.5 py-1 text-xs font-medium rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Remediation</span>
            </button>
          </div>
        </div>
      </div>

      {/* War Room Tabs */}
      <div className="border-b border-recall-border px-4 bg-slate-900/30 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('analysis')}
            className={\`px-3 py-2 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition \${
              activeTab === 'analysis'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }\`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>AI Memory Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={\`px-3 py-2 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition \${
              activeTab === 'timeline'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }\`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timeline ({timeline.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={\`px-3 py-2 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition \${
              activeTab === 'evidence'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }\`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Evidence ({evidence.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('remediations')}
            className={\`px-3 py-2 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition \${
              activeTab === 'remediations'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }\`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Remediation Feedback ({remediations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('postmortem')}
            className={\`px-3 py-2 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition \${
              activeTab === 'postmortem'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }\`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Postmortem {postmortem ? '✓' : ''}</span>
          </button>
        </div>
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4">
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
`);

console.log('Main components created successfully!');
