import fs from 'node:fs';
import path from 'node:path';

function write(relPath, content) {
  const full = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('Created:', relPath);
}

// 1. main.tsx
write('frontend/src/main.tsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

// 2. App.tsx
write('frontend/src/App.tsx', `import React, { useState, useEffect, useCallback } from 'react';
import {
  Incident,
  IncidentDetailsBundle,
  SystemStats,
  HealthStatus,
  IncidentStatus
} from './types';
import { api } from './api/client';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { IncidentList } from './components/IncidentList';
import { IncidentDetail } from './components/IncidentDetail';
import { CreateIncidentModal } from './components/modals/CreateIncidentModal';
import { AddEventModal } from './components/modals/AddEventModal';
import { AddEvidenceModal } from './components/modals/AddEvidenceModal';
import { RecordRemediationModal } from './components/modals/RecordRemediationModal';
import { PostmortemModal } from './components/modals/PostmortemModal';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [bundle, setBundle] = useState<IncidentDetailsBundle | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [services, setServices] = useState<string[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [remediationModalOpen, setRemediationModalOpen] = useState(false);
  const [postmortemModalOpen, setPostmortemModalOpen] = useState(false);

  // States
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoadingBundle, setIsLoadingBundle] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch High-Level State
  const refreshOverview = useCallback(async () => {
    try {
      const [h, s, srvs, incs] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getStats().catch(() => null),
        api.getServices().catch(() => []),
        api.listIncidents().catch(() => [])
      ]);

      if (h) setHealth(h);
      if (s) setStats(s);
      if (srvs) setServices(srvs);
      if (incs) {
        setIncidents(incs);
        // Default to active incident (like INC-2026-004) if none selected
        if (!selectedKey && incs.length > 0) {
          const active = incs.find(i => i.status !== 'RESOLVED') || incs[0];
          setSelectedKey(active.incident_key);
        }
      }
    } catch (err: any) {
      console.error('Failed to load overview:', err);
    }
  }, [selectedKey]);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  // Fetch Detailed Incident Bundle
  const loadIncidentBundle = useCallback(async (key: string) => {
    try {
      setIsLoadingBundle(true);
      const data = await api.getIncident(key);
      setBundle(data);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load incident details');
    } finally {
      setIsLoadingBundle(false);
    }
  }, []);

  useEffect(() => {
    if (selectedKey) {
      loadIncidentBundle(selectedKey);
    }
  }, [selectedKey, loadIncidentBundle]);

  // Auto-refresh interval every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      refreshOverview();
      if (selectedKey) {
        api.getIncident(selectedKey).then(setBundle).catch(() => {});
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [selectedKey, refreshOverview]);

  // Handlers
  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      const res = await api.seedDemo(true);
      showToast('success', res.message);
      await refreshOverview();
      if (res.activeIncidentKey) {
        setSelectedKey(res.activeIncidentKey);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to seed demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    if (!bundle) return;
    try {
      const res = await api.updateIncident(bundle.incident.incident_key, { status: newStatus });
      showToast('success', \`Status updated to \${newStatus}\`);
      await loadIncidentBundle(bundle.incident.incident_key);
      await refreshOverview();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update status');
    }
  };

  const handleDeleteIncident = async () => {
    if (!bundle) return;
    if (!window.confirm(\`Are you sure you want to delete incident \${bundle.incident.incident_key}?\`)) {
      return;
    }

    try {
      await api.deleteIncident(bundle.incident.incident_key);
      showToast('info', \`Deleted incident \${bundle.incident.incident_key}\`);
      setBundle(null);
      setSelectedKey(null);
      await refreshOverview();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete incident');
    }
  };

  const handleCreateIncident = async (data: any) => {
    const res = await api.createIncident(data);
    showToast('success', \`Incident \${res.incident.incident_key} created and memory retained!\`);
    await refreshOverview();
    setSelectedKey(res.incident.incident_key);
  };

  const handleAddEvent = async (data: any) => {
    if (!bundle) return;
    await api.addEvent(bundle.incident.incident_key, data);
    showToast('success', 'Timeline event logged and retained to memory');
    await loadIncidentBundle(bundle.incident.incident_key);
  };

  const handleAddEvidence = async (data: any) => {
    if (!bundle) return;
    await api.addEvidence(bundle.incident.incident_key, data);
    showToast('success', 'Evidence attached and retained to Hindsight');
    await loadIncidentBundle(bundle.incident.incident_key);
  };

  const handleRecordRemediation = async (data: any) => {
    if (!bundle) return;
    await api.addRemediation(bundle.incident.incident_key, data);
    showToast('success', \`Remediation outcome (\${data.result}) recorded to operational memory\`);
    await loadIncidentBundle(bundle.incident.incident_key);
  };

  const handleSavePostmortem = async (data: any) => {
    if (!bundle) return;
    await api.savePostmortem(bundle.incident.incident_key, data);
    showToast('success', 'Postmortem saved and incident marked RESOLVED');
    await loadIncidentBundle(bundle.incident.incident_key);
    await refreshOverview();
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
      <Header
        health={health}
        onSeedDemo={handleSeedDemo}
        onNewIncident={() => setCreateModalOpen(true)}
        isSeeding={isSeeding}
      />

      {/* Toast Banner */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div
            className={\`px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2 text-xs font-medium border \${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
            }\`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full">
        {/* Ops Metrics Cards */}
        <StatsOverview stats={stats} />

        {/* Main 2-Column War Room Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Filterable Incident List */}
          <div className="lg:col-span-4 xl:col-span-4">
            <IncidentList
              incidents={incidents}
              selectedId={selectedKey}
              onSelect={setSelectedKey}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              services={services}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          {/* Right Column: Incident War Room Details */}
          <div className="lg:col-span-8 xl:col-span-8">
            {isLoadingBundle && !bundle ? (
              <div className="p-12 text-center bg-recall-surface border border-recall-border rounded-xl">
                <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading incident war room...</p>
              </div>
            ) : bundle ? (
              <IncidentDetail
                bundle={bundle}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteIncident}
                onAddEvent={() => setEventModalOpen(true)}
                onAddEvidence={() => setEvidenceModalOpen(true)}
                onRecordRemediation={() => setRemediationModalOpen(true)}
                onOpenPostmortem={() => setPostmortemModalOpen(true)}
                onRefresh={() => selectedKey && loadIncidentBundle(selectedKey)}
              />
            ) : (
              <div className="p-12 text-center bg-recall-surface border border-recall-border rounded-xl space-y-3">
                <p className="text-sm font-medium text-slate-300">No incident selected</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select an incident from the left or click "Seed Demo Data" to load realistic checkout and payment outage scenarios.
                </p>
                <button
                  onClick={handleSeedDemo}
                  disabled={isSeeding}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow"
                >
                  {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateIncidentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateIncident}
        services={services}
      />

      <AddEventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSubmit={handleAddEvent}
      />

      <AddEvidenceModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        onSubmit={handleAddEvidence}
      />

      <RecordRemediationModal
        isOpen={remediationModalOpen}
        onClose={() => setRemediationModalOpen(false)}
        onSubmit={handleRecordRemediation}
      />

      <PostmortemModal
        isOpen={postmortemModalOpen}
        onClose={() => setPostmortemModalOpen(false)}
        onSubmit={handleSavePostmortem}
      />
    </div>
  );
}
`);

console.log('App and main created successfully!');
