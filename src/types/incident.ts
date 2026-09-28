export const severities = ["SEV1", "SEV2", "SEV3", "SEV4"] as const;
export const statuses = ["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"] as const;
export const environments = ["production", "staging", "development"] as const;
export type Severity = typeof severities[number];
export type IncidentStatus = typeof statuses[number];
export type Environment = typeof environments[number];

export interface Incident {
  id: string; incident_key: string; title: string; service: string; severity: Severity;
  status: IncidentStatus; started_at: string; environment: Environment; summary: string;
  detected_by: string | null; affected_users_count: number; tags: string[];
  created_at: string; updated_at: string; resolved_at: string | null;
}
export interface TimelineEvent {
  id: string; incident_id: string; event_type: string; description: string;
  occurred_at: string; metadata: Record<string, unknown>;
}
export interface Evidence { id: string; incident_id: string; kind: string; content: string; created_at: string; }
export interface Remediation { id: string; incident_id: string; action: string; action_type: string; rationale: string; result: string; impact: string | null; performed_by: string | null; notes: string | null; timestamp: string; }
export interface Postmortem {
  id: string;
  incident_id: string;
  root_cause: string;
  contributing_factors: string[];
  customer_impact: string;
  resolution: string;
  prevention_actions: string[];
  lessons_learned: string;
  timeline_summary: string;
  created_at: string;
}
export interface AnalysisRun {
  id: string;
  incident_id: string;
  mode: string;
  analysis_json: unknown;
  created_at: string;
}
export interface SystemStats {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  statusBreakdown: Record<IncidentStatus, number>;
  severityBreakdown: Record<Severity, number>;
  services: string[];
  mttrMinutes: number | null;
}
