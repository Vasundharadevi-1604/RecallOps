import React, { useState } from 'react';
import { X, RotateCcw, ShieldCheck } from 'lucide-react';

interface RecordRemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    action: string;
    actionType: string;
    rationale: string;
    result: string;
    impact?: string;
    performedBy?: string;
    notes?: string;
  }) => Promise<void>;
}

export const RecordRemediationModal: React.FC<RecordRemediationModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [action, setAction] = useState('');
  const [actionType, setActionType] = useState('restart');
  const [rationale, setRationale] = useState('');
  const [result, setResult] = useState('FAILED');
  const [impact, setImpact] = useState('');
  const [performedBy, setPerformedBy] = useState('oncall-engineer');
  const [notes, setNotes] = useState('');
  const [safetyAck, setSafetyAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim() || !rationale.trim()) {
      setError('Action and rationale are required');
      return;
    }
    if (!safetyAck) {
      setError('Please acknowledge human approval verification');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        action,
        actionType,
        rationale,
        result,
        impact: impact || undefined,
        performedBy: performedBy || undefined,
        notes: notes || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record remediation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-purple-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <RotateCcw className="h-4 w-4 text-amber-500" />
            <span>Record Remediation Feedback (Learning Loop)</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Action Attempted *</label>
            <input
              type="text"
              required
              placeholder="e.g. Restarted application pods, or Rolled back to checkout-api@2.4.0"
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Action Type *</label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value)}
                className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
              >
                <option value="restart">restart</option>
                <option value="rollback">rollback</option>
                <option value="scale">scale</option>
                <option value="failover">failover</option>
                <option value="configuration">configuration</option>
                <option value="other">other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome Result *</label>
              <select
                value={result}
                onChange={e => setResult(e.target.value)}
                className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
              >
                <option value="FAILED">FAILED (No relief / waste of time)</option>
                <option value="SUCCESS">SUCCESS (Incident Mitigated / Resolved)</option>
                <option value="PARTIAL_SUCCESS">PARTIAL SUCCESS (Reduced error rate)</option>
                <option value="UNKNOWN">UNKNOWN / INCONCLUSIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rationale *</label>
            <input
              type="text"
              required
              placeholder="Why was this action chosen?"
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome Notes & Observations</label>
            <textarea
              rows={2}
              placeholder="e.g. 503 rate remained at 14% after pod restart; did not address database pool exhaustion."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          {/* Safety Verification Checkbox */}
          <div className="pt-2">
            <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={safetyAck}
                onChange={e => setSafetyAck(e.target.checked)}
                className="mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
              <span>
                I confirm this operational action was approved and executed by authorized personnel.
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-purple-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-xl text-slate-600 hover:bg-purple-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Outcome & Retain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
