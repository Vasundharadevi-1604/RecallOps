import React from 'react';
import { FileText, Plus, Terminal, AlertTriangle, UploadCloud, Cpu } from 'lucide-react';
import type { Evidence } from '../../types';

interface EvidenceTabProps {
  evidence: Evidence[];
  onAddEvidence: () => void;
}

const kindBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  log: { label: 'Log Snippet', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Terminal className="h-3.5 w-3.5" /> },
  alert: { label: 'Alert Trigger', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  deployment: { label: 'Deployment', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <UploadCloud className="h-3.5 w-3.5" /> },
  infra_change: { label: 'Infra Change', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Cpu className="h-3.5 w-3.5" /> }
};

export const EvidenceTab: React.FC<EvidenceTabProps> = ({ evidence, onAddEvidence }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div>
          <h3 className="text-xs font-bold text-slate-900">Telemetry & Evidence Locker</h3>
          <p className="text-[11px] text-slate-500">All evidence is automatically retained as operational memory in Hindsight.</p>
        </div>

        <button
          onClick={onAddEvidence}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Attach Evidence</span>
        </button>
      </div>

      {evidence.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-purple-200">
          No evidence records attached yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {evidence.map((item, idx) => {
            const badge = kindBadges[item.kind] || {
              label: item.kind,
              color: 'bg-purple-50 text-purple-700 border-purple-200',
              icon: <FileText className="h-3.5 w-3.5" />
            };

            return (
              <div key={item.id || idx} className="p-3.5 rounded-2xl bg-white border border-purple-100/90 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 font-semibold ${badge.color}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/30 font-mono text-xs text-slate-800 whitespace-pre-wrap overflow-x-auto border border-purple-100/80">
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
