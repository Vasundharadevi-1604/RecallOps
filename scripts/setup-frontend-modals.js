import fs from 'node:fs';
import path from 'node:path';

function write(relPath, content) {
  const full = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('Created:', relPath);
}

// 1. CreateIncidentModal.tsx
write('frontend/src/components/modals/CreateIncidentModal.tsx', `import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-recall-surface border border-recall-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-recall-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span>Open New Incident</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Incident Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Elevated 503 spike after checkout deployment"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Service *</label>
              <input
                type="text"
                required
                value={service}
                onChange={e => setService(e.target.value)}
                placeholder="e.g. checkout-api"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Severity *</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Environment</label>
              <select
                value={environment}
                onChange={e => setEnvironment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="production">production</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Affected Users</label>
              <input
                type="number"
                min="0"
                value={affectedUsers}
                onChange={e => setAffectedUsers(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Summary & Symptoms *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe initial symptoms, alert spikes, or user impact..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="checkout, database, timeout"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-recall-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Incident & Retain Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);

// 2. AddEventModal.tsx
write('frontend/src/components/modals/AddEventModal.tsx', `import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-recall-surface border border-recall-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-recall-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span>Add Timeline Event</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Event Type *</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Database connection timeouts observed in checkout pods."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Metadata (JSON)</label>
            <input
              type="text"
              value={metadataJson}
              onChange={e => setMetadataJson(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-recall-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);

// 3. AddEvidenceModal.tsx
write('frontend/src/components/modals/AddEvidenceModal.tsx', `import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-recall-surface border border-recall-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-recall-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            <span>Attach Evidence to Incident</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kind *</label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Deployment Version</label>
              <input
                type="text"
                placeholder="e.g. checkout-api@2.5.0"
                value={deploymentVersion}
                onChange={e => setDeploymentVersion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Evidence Content / Raw Logs *</label>
            <textarea
              required
              rows={5}
              placeholder="Paste stack trace, error logs, or alert JSON..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-slate-950 font-mono border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-2.5 rounded bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-300">
            ℹ️ Attaching evidence immediately writes to SQLite and retains memory into Hindsight bank for future similarity queries.
          </div>

          <div className="pt-3 border-t border-recall-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
            >
              {loading ? 'Attaching...' : 'Attach & Retain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);

// 4. RecordRemediationModal.tsx
write('frontend/src/components/modals/RecordRemediationModal.tsx', `import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-recall-surface border border-recall-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-recall-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <RotateCcw className="h-4 w-4 text-amber-400" />
            <span>Record Remediation Feedback (Learning Loop)</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Action Attempted *</label>
            <input
              type="text"
              required
              placeholder="e.g. Restarted application pods, or Rolled back to checkout-api@2.4.0"
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Action Type *</label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Outcome Result *</label>
              <select
                value={result}
                onChange={e => setResult(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="FAILED">FAILED (No relief / waste of time)</option>
                <option value="SUCCESS">SUCCESS (Incident Mitigated / Resolved)</option>
                <option value="PARTIAL_SUCCESS">PARTIAL SUCCESS (Reduced error rate)</option>
                <option value="UNKNOWN">UNKNOWN / INCONCLUSIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Rationale *</label>
            <input
              type="text"
              required
              placeholder="Why was this action chosen?"
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Outcome Notes & Observations</label>
            <textarea
              rows={2}
              placeholder="e.g. 503 rate remained at 14% after pod restart; did not address database pool exhaustion."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Safety Verification Checkbox */}
          <div className="pt-2">
            <label className="flex items-start space-x-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={safetyAck}
                onChange={e => setSafetyAck(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
              />
              <span>
                I confirm this operational action was approved and executed by authorized personnel.
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-recall-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Outcome & Retain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);

// 5. PostmortemModal.tsx
write('frontend/src/components/modals/PostmortemModal.tsx', `import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-recall-surface border border-recall-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b border-recall-border flex items-center justify-between sticky top-0 bg-recall-surface z-10">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Complete Postmortem & Resolve Incident</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Confirmed Root Cause *</label>
            <textarea
              required
              rows={2}
              value={rootCause}
              onChange={e => setRootCause(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Final Resolution *</label>
            <textarea
              required
              rows={2}
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Contributing Factors (comma-separated)</label>
            <input
              type="text"
              value={factors}
              onChange={e => setFactors(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Customer Impact</label>
            <input
              type="text"
              value={customerImpact}
              onChange={e => setCustomerImpact(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Prevention Actions (comma-separated)</label>
            <input
              type="text"
              value={prevention}
              onChange={e => setPrevention(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Lessons Learned</label>
            <textarea
              rows={2}
              value={lessonsLearned}
              onChange={e => setLessonsLearned(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Timeline Summary</label>
            <input
              type="text"
              value={timelineSummary}
              onChange={e => setTimelineSummary(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-recall-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
            >
              {loading ? 'Resolving...' : 'Publish Postmortem & Resolve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`);

console.log('Modals generated successfully!');
