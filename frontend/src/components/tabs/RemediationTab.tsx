import React from 'react';
import { RotateCcw, Plus, CheckCircle2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import type { Remediation } from '../../types';

interface RemediationTabProps {
  remediations: Remediation[];
  onRecordRemediation: () => void;
}

const resultBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SUCCESS: { label: 'SUCCESSFUL', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  PARTIAL_SUCCESS: { label: 'PARTIAL SUCCESS', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  FAILED: { label: 'FAILED / NO EFFECT', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: <XCircle className="h-3.5 w-3.5" /> },
  UNKNOWN: { label: 'PENDING', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <RotateCcw className="h-3.5 w-3.5" /> }
};

export const RemediationTab: React.FC<RemediationTabProps> = ({ remediations, onRecordRemediation }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div>
          <h3 className="text-xs font-bold text-slate-900">Remediation Feedback Loop</h3>
          <p className="text-[11px] text-slate-500">
            Recording failed and successful actions teaches Hindsight to stop future teams from repeating doomed fixes.
          </p>
        </div>

        <button
          onClick={onRecordRemediation}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Record Remediation Outcome</span>
        </button>
      </div>

      {remediations.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-purple-200">
          No remediation attempts recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {remediations.map((rem, idx) => {
            const badge = resultBadges[rem.result] || resultBadges.UNKNOWN;

            return (
              <div key={rem.id || idx} className="p-4 rounded-2xl bg-white border border-purple-100/90 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold flex items-center space-x-1 ${badge.color}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 font-semibold">
                      Type: {rem.action_type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(rem.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">{rem.action}</div>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Rationale: </span>
                    {rem.rationale}
                  </p>
                  {rem.notes && (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Outcome Notes: </span>
                      {rem.notes}
                    </p>
                  )}
                  {rem.performed_by && (
                    <p className="text-[11px] text-purple-700">
                      <span className="text-slate-500">Executed by: </span>
                      <span className="font-semibold">{rem.performed_by}</span>
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
