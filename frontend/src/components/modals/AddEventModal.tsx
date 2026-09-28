import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; description: string; metadata?: Record<string, unknown> }) => Promise<void>;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState('ALERT');
  const [description, setDescription] = useState('');
  const [metadataJson, setMetadataJson] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    let meta: Record<string, unknown> = {};
    if (metadataJson.trim()) {
      try {
        meta = JSON.parse(metadataJson);
      } catch {
        setError('Metadata must be valid JSON');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({ type, description, metadata: meta });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-purple-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-purple-100 bg-purple-50/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span>Add Timeline Event</span>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type *</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white transition"
            >
              <option value="ALERT">ALERT</option>
              <option value="DEPLOYMENT">DEPLOYMENT</option>
              <option value="INFRA_CHANGE">INFRA_CHANGE</option>
              <option value="DIAGNOSIS">DIAGNOSIS</option>
              <option value="RUNBOOK">RUNBOOK</option>
              <option value="HUMAN_FEEDBACK">HUMAN_FEEDBACK</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Database connection timeouts observed in checkout pods."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-purple-50/40 border border-purple-100 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Metadata (JSON)</label>
            <input
              type="text"
              value={metadataJson}
              onChange={e => setMetadataJson(e.target.value)}
              className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition"
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
              {loading ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
