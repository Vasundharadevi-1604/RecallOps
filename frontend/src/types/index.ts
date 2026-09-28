export type Severity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
export type Environment = 'production' | 'staging' | 'development';

export interface Incident {
  id: string;
  incident_key: string;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  started_at: string;
  environment: Environment;
  summary: string;
  detected_by: string | null;
  affected_users_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface TimelineEvent {
  id: string;
  incident_id: string;
  event_type: string;
  description: string;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

export interface Evidence {
  id: string;
  incident_id: string;
  kind: string;
  content: string;
  created_at: string;
}

export interface Remediation {
  id: string;
  incident_id: string;
  action: string;
  action_type: string;
  rationale: string;
  result: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'UNKNOWN';
  impact: string | null;
  performed_by: string | null;
  notes: string | null;
  timestamp: string;
}

export interface Postmortem {
  id: string;
  incident_id: string;
  root_cause: string;
  rootCause?: string;
  contributing_factors: string[];
  contributingFactors?: string[];
  customer_impact: string;
  customerImpact?: string;
  resolution: string;
  prevention_actions: string[];
  preventionActions?: string[];
  lessons_learned: string;
  lessonsLearned?: string;
  timeline_summary: string;
  timelineSummary?: string;
  created_at: string;
}

export interface NormalizedMemory {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface AnalysisRun {
  id: string;
  incident_id: string;
  mode: string;
  analysis_json: AnalysisResult;
  created_at: string;
}

export interface LikelyCause {
  cause: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: string[];
  missingEvidence?: string[];
}

export interface SimilarIncident {
  incidentId: string;
  title: string;
  similarityReason: string;
  historicalResolution: string;
  outcome: string;
}

export interface RemediationStep {
  priority: number;
  action: string;
  reason: string;
  humanApprovalRequired: boolean;
}

export interface DeprioritizedAction {
  action: string;
  reason: string;
}

export interface MemoryEvidence {
  memoryId: string;
  sourceIncidentId: string;
  memoryType: string;
  text: string;
  whyRelevant: string;
}

export interface AnalysisResult {
  incidentId: string;
  analysisMode: string;
  generatedAt: string;
  summary: string;
  severityAssessment: {
    currentSeverity: Severity;
    rationale: string;
  };
  likelyCauses: LikelyCause[];
  similarIncidents: SimilarIncident[];
  recommendedInvestigationSteps: {
    priority: number;
    action: string;
    reason: string;
    humanApprovalRequired: boolean;
  }[];
  recommendedRemediationSteps: RemediationStep[];
  deprioritizedActions: DeprioritizedAction[];
  escalationCriteria: string[];
  uncertainties: string[];
  memoryEvidence: MemoryEvidence[];
  safetyNotice: string;
}

export interface CompareAnalysisResponse {
  baselineAnalysis: AnalysisResult;
  memoryPoweredAnalysis: AnalysisResult;
  improvementSummary: string;
}

export interface IncidentDetailsBundle {
  incident: Incident;
  timeline: TimelineEvent[];
  evidence: Evidence[];
  remediations: Remediation[];
  postmortem: Postmortem | null;
  analysisRuns: AnalysisRun[];
  relatedMemories: NormalizedMemory[];
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

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  integrations: {
    hindsight: boolean;
    groq: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  last_login_at: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: User;
}

