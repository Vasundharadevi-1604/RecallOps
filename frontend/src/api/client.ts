import type {
  Incident,
  IncidentDetailsBundle,
  SystemStats,
  HealthStatus,
  AnalysisResult,
  CompareAnalysisResponse,
  TimelineEvent,
  Evidence,
  Remediation,
  Postmortem
} from '../types';

const API_BASE = '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('recallops_auth_token');
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {})
    }
  });

  const body = await res.json();
  if (!res.ok || body.success === false) {
    const errorMsg = body?.error?.message || body?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return body.data as T;
}

export const api = {
  // System health & stats
  getHealth: () => fetchJson<HealthStatus>('/health'),
  getStats: () => fetchJson<SystemStats>('/api/stats'),
  getServices: () => fetchJson<string[]>('/api/services'),

  // Incident Operations
  listIncidents: (filters?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }
    const q = params.toString();
    return fetchJson<Incident[]>(`/api/incidents${q ? `?${q}` : ''}`);
  },

  getIncident: (incidentKeyOrId: string) =>
    fetchJson<IncidentDetailsBundle>(`/api/incidents/${incidentKeyOrId}`),

  createIncident: (data: {
    title: string;
    service: string;
    severity: string;
    environment: string;
    summary: string;
    detectedBy?: string;
    affectedUsersCount?: number;
    tags?: string[];
  }) => fetchJson<{ incident: Incident; memoryStatus: { success: boolean } }>('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateIncident: (incidentId: string, patch: Partial<Incident>) =>
    fetchJson<{ incident: Incident; memoryStatus: { success: boolean } }>(`/api/incidents/${incidentId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    }),

  deleteIncident: (incidentId: string) =>
    fetchJson<{ deleted: boolean; incidentId: string }>(`/api/incidents/${incidentId}`, {
      method: 'DELETE'
    }),

  // Events & Timeline
  addEvent: (incidentId: string, event: {
    type: string;
    description: string;
    metadata?: Record<string, unknown>;
  }) => fetchJson<{ event: TimelineEvent; memoryStatus: { success: boolean } }>(`/api/incidents/${incidentId}/events`, {
    method: 'POST',
    body: JSON.stringify(event)
  }),

  // Evidence
  addEvidence: (incidentId: string, evidence: {
    kind: string;
    content: string;
    deploymentVersion?: string;
  }) => fetchJson<{ evidence: Evidence; memoryStatus: { success: boolean } }>(`/api/incidents/${incidentId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(evidence)
  }),

  // Remediation Outcome
  addRemediation: (incidentId: string, rem: {
    action: string;
    actionType: string;
    rationale: string;
    result: string;
    impact?: string;
    performedBy?: string;
    notes?: string;
  }) => fetchJson<{ remediation: Remediation; memoryStatus: { success: boolean } }>(`/api/incidents/${incidentId}/remediations`, {
    method: 'POST',
    body: JSON.stringify(rem)
  }),

  // Postmortem
  savePostmortem: (incidentId: string, postmortem: {
    rootCause: string;
    contributingFactors: string[];
    customerImpact: string;
    resolution: string;
    preventionActions: string[];
    lessonsLearned: string;
    timelineSummary: string;
  }) => fetchJson<{ postmortem: Postmortem; memoryStatus: { success: boolean } }>(`/api/incidents/${incidentId}/postmortem`, {
    method: 'POST',
    body: JSON.stringify(postmortem)
  }),

  // Analysis
  analyze: (incidentId: string) =>
    fetchJson<AnalysisResult>(`/api/incidents/${incidentId}/analyze`, {
      method: 'POST'
    }),

  compareAnalysis: (incidentId: string) =>
    fetchJson<CompareAnalysisResponse>(`/api/incidents/${incidentId}/compare-analysis`, {
      method: 'POST'
    }),

  getMemories: (incidentId: string) =>
    fetchJson<{ memories: any[] }>(`/api/incidents/${incidentId}/memories`),

  // Seed / Reset
  seedDemo: (force = true) =>
    fetchJson<{ seeded: boolean; message: string; activeIncidentKey: string }>('/api/seed', {
      method: 'POST',
      body: JSON.stringify({ force })
    }),

  // Authentication
  sendOtp: (email: string) =>
    fetchJson<{ success: boolean; message: string; email: string; previewCode?: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  verifyOtp: (email: string, otp: string, name?: string, role?: string) =>
    fetchJson<{ token: string; user: any }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, name, role })
    }),

  getMe: () =>
    fetchJson<{ user: any }>('/api/auth/me'),

  logout: () =>
    fetchJson<{ loggedOut: boolean }>('/api/auth/logout', {
      method: 'POST'
    })
};
