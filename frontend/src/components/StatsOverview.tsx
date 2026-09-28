import React from 'react';
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
      <div className="bg-white border border-purple-100/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Incidents</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{stats.activeIncidents}</span>
            <span className="text-xs text-slate-500">of {stats.totalIncidents} total</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
      </div>

      {/* Critical P0/SEV1 */}
      <div className="bg-white border border-purple-100/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Critical (SEV1)</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-rose-600">{stats.severityBreakdown.SEV1}</span>
            <span className="text-xs text-rose-600/80 font-medium">P0 urgency</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
        </div>
      </div>

      {/* MTTR */}
      <div className="bg-white border border-purple-100/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mean Time to Resolve</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">
              {stats.mttrMinutes !== null ? `${stats.mttrMinutes}m` : 'N/A'}
            </span>
            <span className="text-xs text-slate-500">avg MTTR</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <Clock className="h-5 w-5 text-emerald-600" />
        </div>
      </div>

      {/* Memory Bank Retention */}
      <div className="bg-white border border-purple-100/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Historical Memory</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-purple-700">{stats.resolvedIncidents}</span>
            <span className="text-xs text-purple-900/60 font-medium">retained postmortems</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
          <BrainCircuit className="h-5 w-5 text-purple-600" />
        </div>
      </div>
    </div>
  );
};
