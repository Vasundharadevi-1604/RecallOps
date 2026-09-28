import React, { useState } from 'react';
import { X, FileText, Terminal } from 'lucide-react';

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { kind: string; content: string; deploymentVersion?: string }) => Promise<void>;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [kind, setKind] = useState('log');
  const [content, setContent] = useState('');
  const [deploymentVersion, setDeploymentVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        kind,
        content,
        deploymentVersion: deploymentVersion || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to attach evidence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-purple-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-purple-100 bg-purple-50/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-purple-600" />
            <span>Attach Evidence to Incident</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kind *</label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value)}
                className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white transition"
              >
                <option value="log">Log Output</option>
                <option value="alert">Alert Payload</option>
                <option value="deployment">Deployment Manifest</option>
                <option value="infra_change">Infra Diff</option>
                <option value="diagnosis">Diagnosis Note</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deployment Version</label>
              <input
                type="text"
                placeholder="e.g. checkout-api@2.5.0"
                value={deploymentVersion}
                onChange={e => setDeploymentVersion(e.target.value)}
                className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Content / Raw Logs *</label>
            <textarea
              required
              rows={5}
              placeholder="Paste stack trace, error logs, or alert JSON..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-purple-50/30 font-mono border border-purple-100 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 text-[11px] text-purple-900">
            ℹ️ Attaching evidence immediately writes to SQLite and retains memory into Hindsight bank for future similarity queries.
          </div>

          <div className="pt-3 border-t border-purple-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-purple-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Attaching...' : 'Attach & Retain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
