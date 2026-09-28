import React, { useState } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    service: string;
    severity: string;
    environment: string;
    summary: string;
    detectedBy?: string;
    affectedUsersCount?: number;
    tags?: string[];
  }) => Promise<void>;
  services: string[];
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  services
}) => {
  const [title, setTitle] = useState('');
  const [service, setService] = useState('checkout-api');
  const [severity, setSeverity] = useState('SEV1');
  const [environment, setEnvironment] = useState('production');
  const [summary, setSummary] = useState('');
  const [detectedBy, setDetectedBy] = useState('datadog');
  const [affectedUsers, setAffectedUsers] = useState(50);
  const [tags, setTags] = useState('checkout, api, regression');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setError('Title and summary are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title,
        service,
        severity,
        environment,
        summary,
        detectedBy: detectedBy || undefined,
        affectedUsersCount: Number(affectedUsers) || 0,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-purple-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-purple-100 bg-purple-50/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Open New Incident</span>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Elevated 503 spike after checkout deployment"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service *</label>
              <input
                type="text"
                required
                value={service}
                onChange={e => setService(e.target.value)}
                placeholder="e.g. checkout-api"
                className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity *</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white transition"
              >
                <option value="SEV1">SEV1 (Critical Outage)</option>
                <option value="SEV2">SEV2 (Major Impact)</option>
                <option value="SEV3">SEV3 (Moderate Degradation)</option>
                <option value="SEV4">SEV4 (Minor Issue)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Environment</label>
              <select
                value={environment}
                onChange={e => setEnvironment(e.target.value)}
                className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white transition"
              >
                <option value="production">production</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Affected Users</label>
              <input
                type="number"
                min="0"
                value={affectedUsers}
                onChange={e => setAffectedUsers(Number(e.target.value))}
                className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Summary & Symptoms *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe initial symptoms, alert spikes, or user impact..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full bg-purple-50/40 border border-purple-100 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="checkout, database, timeout"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition"
            />
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
              {loading ? 'Creating...' : 'Create Incident & Retain Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
