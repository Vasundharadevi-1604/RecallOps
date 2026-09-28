import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface PostmortemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rootCause: string;
    contributingFactors: string[];
    customerImpact: string;
    resolution: string;
    preventionActions: string[];
    lessonsLearned: string;
    timelineSummary: string;
  }) => Promise<void>;
}

export const PostmortemModal: React.FC<PostmortemModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [rootCause, setRootCause] = useState('New database client configuration in v2.5.0 caused connection pool exhaustion.');
  const [factors, setFactors] = useState('Missing connection pool max_lifetime config, Insufficient load test');
  const [customerImpact, setCustomerImpact] = useState('120 checkout requests failed with 503 Service Unavailable over 40 minutes.');
  const [resolution, setResolution] = useState('Rolled back checkout-api deployment and restored previous database pool settings.');
  const [prevention, setPrevention] = useState('Add connection pool canary alerts, mandate staging load soak test');
  const [lessonsLearned, setLessonsLearned] = useState('Restarting pods during connection pool exhaustion does not address client pool exhaustion.');
  const [timelineSummary, setTimelineSummary] = useState('Deployment at 14:00, 503 spike detected at 14:15, investigated, rollback at 14:40, service fully recovered at 14:45.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCause.trim() || !resolution.trim()) {
      setError('Root cause and resolution are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        rootCause,
        contributingFactors: factors.split(',').map(f => f.trim()).filter(Boolean),
        customerImpact,
        resolution,
        preventionActions: prevention.split(',').map(p => p.trim()).filter(Boolean),
        lessonsLearned,
        timelineSummary
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save postmortem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-purple-100 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b border-purple-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Complete Postmortem & Resolve Incident</span>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmed Root Cause *</label>
            <textarea
              required
              rows={2}
              value={rootCause}
              onChange={e => setRootCause(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Final Resolution *</label>
            <textarea
              required
              rows={2}
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contributing Factors (comma-separated)</label>
            <input
              type="text"
              value={factors}
              onChange={e => setFactors(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Impact</label>
            <input
              type="text"
              value={customerImpact}
              onChange={e => setCustomerImpact(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Prevention Actions (comma-separated)</label>
            <input
              type="text"
              value={prevention}
              onChange={e => setPrevention(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lessons Learned</label>
            <textarea
              rows={2}
              value={lessonsLearned}
              onChange={e => setLessonsLearned(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Timeline Summary</label>
            <input
              type="text"
              value={timelineSummary}
              onChange={e => setTimelineSummary(e.target.value)}
              className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition"
            />
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
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Resolving...' : 'Publish Postmortem & Resolve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
