import { randomUUID } from "node:crypto";
import { db } from "../db/database";
import { retainMemory, recallMemories, type NormalizedMemory } from "./hindsight.service";
import { formatIncidentMemory } from "./memoryFormatter.service";
import type { Incident, TimelineEvent, Evidence, Remediation, Postmortem, AnalysisRun, SystemStats } from "../types/incident";
import { logger } from "../utils/logger";

const now = () => new Date().toISOString();
export function getIncident(id: string): Incident | undefined {
  const row = db.prepare("SELECT * FROM incidents WHERE id = ? OR incident_key = ?").get(id, id) as any;
  return row ? ({ ...row, tags: JSON.parse(row.tags) } as Incident) : undefined;
}
export function listIncidents(filters: Record<string, string | undefined>) {
  const clauses: string[] = []; const values: unknown[] = [];
  for (const field of ["status", "severity", "service", "environment"] as const) if (filters[field]) { clauses.push(`${field} = ?`); values.push(filters[field]); }
  const limit = Math.min(Math.max(Number(filters.limit ?? 50), 1), 100); const offset = Math.max(Number(filters.offset ?? 0), 0);
  return (db.prepare(`SELECT * FROM incidents ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY started_at DESC LIMIT ? OFFSET ?`).all(...values, limit, offset) as any[]).map(row => ({ ...row, tags: JSON.parse(row.tags) }));
}
export async function createIncident(input: any) {
  const id = randomUUID(); const stamp = now();
  const latest = db.prepare("SELECT incident_key FROM incidents ORDER BY created_at DESC LIMIT 1").get() as any;
  const year = new Date(stamp).getUTCFullYear();
  const seq = latest?.incident_key?.startsWith(`INC-${year}-`) ? Number(latest.incident_key.slice(-3)) + 1 : 1;
  const incident: Incident = {
    id,
    incident_key: `INC-${year}-${String(seq).padStart(3, "0")}`,
    status: input.status ?? "OPEN",
    started_at: input.startedAt ?? stamp,
    detected_by: input.detectedBy ?? null,
    affected_users_count: input.affectedUsersCount ?? 0,
    tags: input.tags ?? [],
    created_at: stamp,
    updated_at: stamp,
    resolved_at: input.status === "RESOLVED" ? stamp : null,
    title: input.title,
    service: input.service,
    severity: input.severity,
    environment: input.environment,
    summary: input.summary
  };
  db.prepare(`INSERT INTO incidents(id,incident_key,title,service,severity,status,started_at,environment,summary,detected_by,affected_users_count,tags,created_at,updated_at,resolved_at)
    VALUES(@id,@incident_key,@title,@service,@severity,@status,@started_at,@environment,@summary,@detected_by,@affected_users_count,@tags,@created_at,@updated_at,@resolved_at)`)
    .run({ ...incident, tags: JSON.stringify(incident.tags) });
  addEventLocal(id, "INCIDENT_CREATED", incident.summary, stamp);
  const memoryStatus = await retainMemory(formatIncidentMemory({ incident, type: "INCIDENT_CREATED", event: incident.summary, timestamp: stamp }), id);
  return { incident, memoryStatus };
}
export function addEventLocal(incidentId: string, type: string, description: string, occurredAt = now(), metadata: Record<string, unknown> = {}) {
  const id = randomUUID();
  db.prepare("INSERT INTO incident_events(id,incident_id,event_type,description,occurred_at,metadata) VALUES(?,?,?,?,?,?)").run(id, incidentId, type, description, occurredAt, JSON.stringify(metadata));
  return { id, incident_id: incidentId, event_type: type, description, occurred_at: occurredAt, metadata };
}
export function getTimeline(id: string): TimelineEvent[] {
  return (db.prepare("SELECT * FROM incident_events WHERE incident_id=? ORDER BY occurred_at ASC").all(id) as any[]).map(r => ({ ...r, metadata: JSON.parse(r.metadata) }));
}
export function getEvidence(incidentId: string): Evidence[] {
  return db.prepare("SELECT * FROM evidence WHERE incident_id = ? ORDER BY created_at DESC").all(incidentId) as Evidence[];
}
export function getRemediations(incidentId: string): Remediation[] {
  return db.prepare("SELECT * FROM remediations WHERE incident_id = ? ORDER BY timestamp DESC").all(incidentId) as Remediation[];
}
export function getPostmortem(incidentId: string): any {
  const row = db.prepare("SELECT * FROM postmortems WHERE incident_id = ?").get(incidentId) as any;
  if (!row) return null;
  const factors = JSON.parse(row.contributing_factors ?? "[]");
  const preventions = JSON.parse(row.prevention_actions ?? "[]");
  return {
    ...row,
    rootCause: row.root_cause,
    contributing_factors: factors,
    contributingFactors: factors,
    customerImpact: row.customer_impact,
    resolution: row.resolution,
    prevention_actions: preventions,
    preventionActions: preventions,
    lessonsLearned: row.lessons_learned,
    timelineSummary: row.timeline_summary,
    createdAt: row.created_at
  };
}
export function getAnalysisRuns(incidentId: string): AnalysisRun[] {
  const rows = db.prepare("SELECT * FROM analysis_runs WHERE incident_id = ? ORDER BY created_at DESC").all(incidentId) as any[];
  return rows.map(r => ({ ...r, analysis_json: JSON.parse(r.analysis_json) }));
}
export async function getIncidentDetails(id: string) {
  const incident = getIncident(id);
  if (!incident) return undefined;
  const timeline = getTimeline(incident.id);
  const evidence = getEvidence(incident.id);
  const remediations = getRemediations(incident.id);
  const postmortem = getPostmortem(incident.id);
  const analysisRuns = getAnalysisRuns(incident.id);
  const memories = await relatedMemories(incident);
  return {
    incident,
    timeline,
    evidence,
    remediations,
    postmortem,
    analysisRuns,
    relatedMemories: memories
  };
}
export async function addEvent(incident: Incident, input: any) {
  const stamp = input.timestamp ?? now(); const event = addEventLocal(incident.id, input.type, input.description, stamp, input.metadata ?? {});
  const memoryStatus = await retainMemory(formatIncidentMemory({ incident, type: input.type, event: input.description, timestamp: stamp, details: JSON.stringify(input.metadata ?? {}) }), incident.id);
  return { event, memoryStatus };
}
export async function addEvidence(incident: Incident, input: any) {
  const id = randomUUID(); const stamp = input.timestamp ?? now();
  db.prepare("INSERT INTO evidence(id,incident_id,kind,content,created_at) VALUES(?,?,?,?,?)").run(id, incident.id, input.kind, input.content, stamp);
  const type = input.kind === "log" ? "LOG_SNIPPET" : input.kind.toUpperCase();
  const memoryStatus = await retainMemory(formatIncidentMemory({ incident, type, event: input.content, timestamp: stamp, details: input.deploymentVersion ? `Deployment Version: ${input.deploymentVersion}` : undefined, deploymentVersion: input.deploymentVersion }), incident.id);
  return { evidence: { id, incident_id: incident.id, kind: input.kind, content: input.content, created_at: stamp }, memoryStatus };
}
export async function updateIncident(incident: Incident, patch: any) {
  const changes: Record<string, unknown> = {}; const map: Record<string, string> = { title: "title", service: "service", severity: "severity", status: "status", environment: "environment", summary: "summary", detectedBy: "detected_by", affectedUsersCount: "affected_users_count", tags: "tags" };
  for (const [key, column] of Object.entries(map)) if (patch[key] !== undefined) changes[column] = key === "tags" ? JSON.stringify(patch[key]) : patch[key];
  if (patch.status === "RESOLVED" && incident.status !== "RESOLVED") {
    changes.resolved_at = now();
  } else if (patch.status && patch.status !== "RESOLVED" && incident.status === "RESOLVED") {
    changes.resolved_at = null;
  }
  changes.updated_at = now();
  const assignments = Object.keys(changes).map(k => `${k}=@${k}`).join(",");
  db.prepare(`UPDATE incidents SET ${assignments} WHERE id=@id`).run({ ...changes, id: incident.id });
  if (patch.status && patch.status !== incident.status) addEventLocal(incident.id, "STATUS_CHANGED", `Status changed from ${incident.status} to ${patch.status}`);
  const updated = getIncident(incident.id)!;
  const memoryStatus = (patch.status || patch.severity || patch.summary) ? await retainMemory(formatIncidentMemory({ incident: updated, type: "HUMAN_FEEDBACK", event: `Incident updated: ${Object.keys(patch).join(", ")}`, details: JSON.stringify(patch) }), incident.id) : { success: true };
  return { incident: updated, memoryStatus };
}
export async function deleteIncident(id: string): Promise<boolean> {
  const incident = getIncident(id);
  if (!incident) return false;
  db.prepare("DELETE FROM incidents WHERE id = ?").run(incident.id);
  return true;
}
export async function addRemediation(incident: Incident, input: any) {
  const id = randomUUID(); const stamp = input.timestamp ?? now();
  db.prepare(`INSERT INTO remediations(id,incident_id,action,action_type,rationale,result,impact,performed_by,notes,timestamp) VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .run(id, incident.id, input.action, input.actionType, input.rationale, input.result, input.impact ?? null, input.performedBy ?? null, input.notes ?? null, stamp);
  const details = [`Action: ${input.action}`, `Rationale: ${input.rationale}`, `Impact: ${input.impact ?? "Not provided"}`, `Notes: ${input.notes ?? "Not provided"}`].join("\n");
  const outcome = input.result === "FAILED" ? "FAILED - UNSUCCESSFUL" : input.result;
  const memoryStatus = await retainMemory(formatIncidentMemory({ incident, type: "REMEDIATION_RESULT", event: details, timestamp: stamp, outcome }), incident.id);
  return { remediation: { id, incident_id: incident.id, action: input.action, action_type: input.actionType, rationale: input.rationale, result: input.result, impact: input.impact ?? null, performed_by: input.performedBy ?? null, notes: input.notes ?? null, timestamp: stamp }, memoryStatus };
}
export async function savePostmortem(incident: Incident, input: any) {
  const stamp = now(); const id = randomUUID();
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO postmortems(id,incident_id,root_cause,contributing_factors,customer_impact,resolution,prevention_actions,lessons_learned,timeline_summary,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`)
      .run(id, incident.id, input.rootCause, JSON.stringify(input.contributingFactors), input.customerImpact, input.resolution, JSON.stringify(input.preventionActions), input.lessonsLearned, input.timelineSummary, stamp);
    db.prepare("UPDATE incidents SET status='RESOLVED', resolved_at=?, updated_at=? WHERE id=?").run(stamp, stamp, incident.id);
    addEventLocal(incident.id, "POSTMORTEM_CREATED", "Post-mortem recorded; incident resolved", stamp);
  });
  tx();
  const postmortem = {
    id,
    incident_id: incident.id,
    root_cause: input.rootCause,
    rootCause: input.rootCause,
    contributing_factors: input.contributingFactors,
    contributingFactors: input.contributingFactors,
    customer_impact: input.customerImpact,
    customerImpact: input.customerImpact,
    resolution: input.resolution,
    prevention_actions: input.preventionActions,
    preventionActions: input.preventionActions,
    lessons_learned: input.lessonsLearned,
    lessonsLearned: input.lessonsLearned,
    timeline_summary: input.timelineSummary,
    timelineSummary: input.timelineSummary,
    created_at: stamp
  };
  const memoryStatus = await retainMemory(formatIncidentMemory({ incident: { ...incident, status: "RESOLVED" }, type: "POSTMORTEM", event: input.rootCause, outcome: input.resolution, details: JSON.stringify(input) }), incident.id);
  return { postmortem, memoryStatus };
}
export function localMemoriesFallback(incident: Incident): NormalizedMemory[] {
  const rows = db.prepare("SELECT * FROM incidents WHERE id != ? AND incident_key != ? AND status = 'RESOLVED' ORDER BY created_at DESC").all(incident.id, incident.incident_key) as any[];
  const results: NormalizedMemory[] = [];
  for (const past of rows) {
    const isSameService = past.service === incident.service;
    const pastRemediations = db.prepare("SELECT * FROM remediations WHERE incident_id = ?").all(past.id) as any[];
    const pastPostmortem = db.prepare("SELECT * FROM postmortems WHERE incident_id = ?").get(past.id) as any;
    for (const rem of pastRemediations) {
      results.push({
        id: `local-rem-${rem.id}`,
        text: `[INCIDENT MEMORY]\nIncident ID: ${past.incident_key}\nIncident Title: ${past.title}\nService: ${past.service}\nEnvironment: ${past.environment}\nSeverity: ${past.severity}\nTimestamp: ${rem.timestamp}\nMemory Type: REMEDIATION_RESULT\nOutcome: ${rem.result === "FAILED" ? "FAILED - UNSUCCESSFUL" : rem.result}\n\nEvent:\nAction: ${rem.action}\nRationale: ${rem.rationale}\nImpact: ${rem.impact ?? "Not provided"}\nNotes: ${rem.notes ?? "Not provided"}`,
        metadata: { incidentId: past.incident_key, memoryType: "REMEDIATION_RESULT", source: "local-store", action: rem.action, result: rem.result, isSameService }
      });
    }
    if (pastPostmortem) {
      results.push({
        id: `local-pm-${pastPostmortem.id}`,
        text: `[INCIDENT MEMORY]\nIncident ID: ${past.incident_key}\nIncident Title: ${past.title}\nService: ${past.service}\nEnvironment: ${past.environment}\nSeverity: ${past.severity}\nTimestamp: ${pastPostmortem.created_at}\nMemory Type: POSTMORTEM\nOutcome: ${pastPostmortem.resolution}\n\nEvent:\n${pastPostmortem.root_cause}\n\nDetails:\nResolution: ${pastPostmortem.resolution}\nLessons Learned: ${pastPostmortem.lessons_learned}`,
        metadata: { incidentId: past.incident_key, memoryType: "POSTMORTEM", source: "local-store", rootCause: pastPostmortem.root_cause, resolution: pastPostmortem.resolution, isSameService }
      });
    }
  }
  return results;
}
export async function relatedMemories(incident: Incident): Promise<NormalizedMemory[]> {
  const hindsightMemories = await recallMemories(`${incident.incident_key} ${incident.service} ${incident.title} ${incident.summary}`, incident.id);
  if (hindsightMemories.length > 0) return hindsightMemories;
  return localMemoriesFallback(incident);
}
export function getSystemStats(): SystemStats {
  const all = db.prepare("SELECT * FROM incidents").all() as any[];
  const statusBreakdown = { OPEN: 0, INVESTIGATING: 0, MITIGATED: 0, RESOLVED: 0 };
  const severityBreakdown = { SEV1: 0, SEV2: 0, SEV3: 0, SEV4: 0 };
  const servicesSet = new Set<string>();
  let totalResolvedDurationMinutes = 0;
  let resolvedWithTimeCount = 0;
  for (const row of all) {
    if (row.status in statusBreakdown) statusBreakdown[row.status as keyof typeof statusBreakdown]++;
    if (row.severity in severityBreakdown) severityBreakdown[row.severity as keyof typeof severityBreakdown]++;
    if (row.service) servicesSet.add(row.service);
    if (row.status === "RESOLVED" && row.resolved_at && row.started_at) {
      const start = new Date(row.started_at).getTime();
      const end = new Date(row.resolved_at).getTime();
      if (end > start) {
        totalResolvedDurationMinutes += (end - start) / (1000 * 60);
        resolvedWithTimeCount++;
      }
    }
  }
  const activeIncidents = statusBreakdown.OPEN + statusBreakdown.INVESTIGATING + statusBreakdown.MITIGATED;
  const mttrMinutes = resolvedWithTimeCount > 0 ? Math.round(totalResolvedDurationMinutes / resolvedWithTimeCount) : null;
  return {
    totalIncidents: all.length,
    activeIncidents,
    resolvedIncidents: statusBreakdown.RESOLVED,
    statusBreakdown,
    severityBreakdown,
    services: Array.from(servicesSet).sort(),
    mttrMinutes
  };
}
export function getServicesList(): string[] {
  const rows = db.prepare("SELECT DISTINCT service FROM incidents ORDER BY service ASC").all() as { service: string }[];
  return rows.map(r => r.service);
}
export async function seedDemoData(force = false) {
  if (force) {
    db.exec("DELETE FROM analysis_runs; DELETE FROM postmortems; DELETE FROM remediations; DELETE FROM evidence; DELETE FROM incident_events; DELETE FROM incidents;");
  } else {
    const existing = db.prepare("SELECT COUNT(*) AS n FROM incidents").get() as { n: number };
    if (existing.n > 0) {
      return { message: `Seed skipped: database already contains ${existing.n} incident(s).`, seeded: false, count: existing.n };
    }
  }
  let retainFailures = 0;
  const checkRetention = (result: { memoryStatus?: { success: boolean } }) => {
    if (result.memoryStatus && !result.memoryStatus.success) retainFailures++;
  };
  const historical = [
    {
      title: "Checkout API 503 spike after checkout-api@2.4.1 deployment",
      service: "checkout-api",
      severity: "SEV1" as const,
      environment: "production" as const,
      summary: "503s and database connection pool exhaustion began after version 2.4.1 deployment.",
      rootCause: "New database client configuration caused connection pool exhaustion.",
      resolution: "Rolled back to checkout-api@2.4.0 and restored prior database client settings.",
      failed: "Restarting application pods did not reduce the 503 rate.",
      version: "checkout-api@2.4.1"
    },
    {
      title: "Slow checkout during promotion event",
      service: "checkout-api",
      severity: "SEV2" as const,
      environment: "production" as const,
      summary: "Checkout latency rose during a sustained promotion traffic spike; no faulty deployment was found.",
      rootCause: "Traffic spike saturated the database.",
      resolution: "Temporary read-replica scale-out and query caching reduced saturation.",
      failed: "Increasing pod memory limits did not mitigate the database bottleneck.",
      version: undefined
    },
    {
      title: "Payment API timeout after load balancer change",
      service: "payment-api",
      severity: "SEV2" as const,
      environment: "production" as const,
      summary: "Payment requests timed out after an idle timeout configuration change.",
      rootCause: "Incorrect load balancer idle timeout.",
      resolution: "Reverted the load balancer timeout configuration.",
      failed: "Increasing pod count did not resolve the timeout.",
      version: undefined
    }
  ];
  for (const h of historical) {
    const created = await createIncident({
      title: h.title,
      service: h.service,
      severity: h.severity,
      status: "RESOLVED",
      environment: h.environment,
      summary: h.summary,
      startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      tags: ["seed", "historical"]
    });
    checkRetention(created);
    const incident = created.incident;
    if (h.version) {
      checkRetention(await addEvent(incident, { type: "DEPLOYMENT", description: `${h.version} deployed shortly before symptoms began.`, metadata: { deploymentVersion: h.version } }));
    }
    checkRetention(await addRemediation(incident, { action: h.failed, actionType: "restart_or_scale", rationale: "Attempted during incident response", result: "FAILED", notes: h.failed }));
    checkRetention(await addRemediation(incident, { action: h.resolution, actionType: "configuration_or_rollback", rationale: "Chosen after reviewing incident evidence", result: "SUCCESS", notes: `This succeeded because: ${h.resolution}` }));
    checkRetention(await savePostmortem(incident, { rootCause: h.rootCause, contributingFactors: ["Configuration regression in release", "Insufficient staging load testing"], customerImpact: "Checkout or payment requests were degraded.", resolution: h.resolution, preventionActions: ["Add connection pool health checks and automatic rollback canary."], lessonsLearned: h.rootCause, timelineSummary: `${h.summary} ${h.resolution}` }));
  }
  const active = await createIncident({
    title: "Elevated checkout errors shortly after checkout-api@2.5.0 deployment",
    service: "checkout-api",
    severity: "SEV1",
    status: "INVESTIGATING",
    environment: "production",
    summary: "Checkout 503s and database connection timeout logs began shortly after deployment. Root cause is not yet confirmed.",
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    detectedBy: "synthetic monitoring",
    affectedUsersCount: 120,
    tags: ["seed", "active-demo"]
  });
  checkRetention(active);
  checkRetention(await addEvent(active.incident, { type: "DEPLOYMENT", description: "checkout-api@2.5.0 deployed 15 minutes before the error spike.", metadata: { deploymentVersion: "checkout-api@2.5.0" } }));
  checkRetention(await addEvidence(active.incident, { kind: "log", content: "Database connection timeout; HTTP 503 response observed on checkout requests." }));
  checkRetention(await addEvidence(active.incident, { kind: "alert", content: "Checkout 503 rate increased to 14.2% shortly after deployment." }));
  logger.info({ retainFailures, activeKey: active.incident.incident_key }, "Seed data populated successfully");
  return {
    seeded: true,
    activeIncidentKey: active.incident.incident_key,
    retainFailures,
    message: `Seeded 3 resolved historical incidents and active demo incident ${active.incident.incident_key}.`
  };
}
