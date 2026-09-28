import React from 'react';
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
  SEV1: 'bg-rose-50 text-rose-700 border-rose-200',
  SEV2: 'bg-amber-50 text-amber-700 border-amber-200',
  SEV3: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  SEV4: 'bg-blue-50 text-blue-700 border-blue-200'
};

const statusBadgeColors: Record<IncidentStatus, string> = {
  OPEN: 'bg-rose-50 text-rose-700 border-rose-200',
  INVESTIGATING: 'bg-amber-50 text-amber-700 border-amber-200',
  MITIGATED: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
  const counts = {
    total: incidents.length,
    open: incidents.filter(i => (i.status || '').toUpperCase() === 'OPEN').length,
    investigating: incidents.filter(i => (i.status || '').toUpperCase() === 'INVESTIGATING').length,
    mitigated: incidents.filter(i => (i.status || '').toUpperCase() === 'MITIGATED').length,
    resolved: incidents.filter(i => (i.status || '').toUpperCase() === 'RESOLVED').length,
  };

  const filtered = incidents.filter(i => {
    if (statusFilter !== 'ALL' && (i.status || '').toUpperCase() !== statusFilter.toUpperCase()) return false;
    if (severityFilter !== 'ALL' && (i.severity || '').toUpperCase() !== severityFilter.toUpperCase()) return false;
    if (serviceFilter !== 'ALL' && (i.service || '').toLowerCase() !== serviceFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const match =
        (i.incident_key || '').toLowerCase().includes(q) ||
        (i.title || '').toLowerCase().includes(q) ||
        (i.service || '').toLowerCase().includes(q) ||
        (i.summary || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="bg-white border border-purple-100/90 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-14rem)] overflow-hidden">
      {/* Search & Filters */}
      <div className="p-3.5 border-b border-purple-100 space-y-2.5 bg-purple-50/20">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-purple-400" />
          <input
            type="text"
            placeholder="Search key, title, service..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-7 py-1.5 text-xs bg-purple-50/50 border border-purple-100 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-purple-50/50 border border-purple-100 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-purple-500 truncate"
          >
            <option value="ALL">All Status ({counts.total})</option>
            <option value="OPEN">Open ({counts.open})</option>
            <option value="INVESTIGATING">Investigating ({counts.investigating})</option>
            <option value="MITIGATED">Mitigated ({counts.mitigated})</option>
            <option value="RESOLVED">Resolved ({counts.resolved})</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-purple-50/50 border border-purple-100 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-purple-500 truncate"
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
            className="bg-purple-50/50 border border-purple-100 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-purple-500 truncate"
          >
            <option value="ALL">All Services</option>
            {services.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="overflow-y-auto flex-1 divide-y divide-purple-50">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <p className="text-slate-500">No incidents matching filters.</p>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSeverityFilter('ALL');
                setServiceFilter('ALL');
                setSearchQuery('');
              }}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition text-xs font-semibold"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filtered.map(incident => {
            const isSelected = selectedId === incident.id || selectedId === incident.incident_key;
            return (
              <div
                key={incident.id}
                onClick={() => onSelect(incident.incident_key)}
                className={`p-3.5 cursor-pointer transition flex flex-col space-y-1.5 ${
                  isSelected
                    ? 'bg-purple-50/80 border-l-4 border-purple-600 pl-[10px]'
                    : 'hover:bg-purple-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {incident.incident_key}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${severityBadgeColors[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeColors[incident.status]}`}>
                    {incident.status}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {incident.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono text-purple-700 font-medium">{incident.service}</span>
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
