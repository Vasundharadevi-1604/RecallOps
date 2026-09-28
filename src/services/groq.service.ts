import Groq from "groq-sdk";
import { z } from "zod";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const analysisSchema = z.object({
  summary: z.string(),
  likelyCauses: z.array(z.object({ cause: z.string(), confidence: z.enum(["LOW", "MEDIUM", "HIGH"]), evidence: z.array(z.string()), missingEvidence: z.array(z.string()).default([]) })),
  similarIncidents: z.array(z.object({ incidentId: z.string(), title: z.string(), similarityReason: z.string(), historicalResolution: z.string(), outcome: z.string() })).default([]),
  relevantChanges: z.array(z.object({ type: z.string(), description: z.string(), relevance: z.string() })).default([]),
  recommendedInvestigationSteps: z.array(z.object({ priority: z.number(), action: z.string(), reason: z.string(), humanApprovalRequired: z.boolean() })),
  recommendedRemediationSteps: z.array(z.object({ priority: z.number(), action: z.string(), reason: z.string(), humanApprovalRequired: z.boolean() })),
  deprioritizedActions: z.array(z.object({ action: z.string(), reason: z.string() })).default([]),
  escalationCriteria: z.array(z.string()).default([]), uncertainties: z.array(z.string()).default([]),
  memoryEvidence: z.array(z.object({ memoryId: z.string(), sourceIncidentId: z.string(), memoryType: z.string(), text: z.string(), whyRelevant: z.string() })).default([])
});
export type Analysis = z.infer<typeof analysisSchema>;
const client = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;
const system = `You are a cautious incident-response assistant. Use only provided incident facts and (if present) retrieved historical evidence. Never invent logs, historical incidents, runbooks, metrics, causes, or operational facts. Separate evidence from inference and state uncertainty. Never execute actions. Any rollback, scaling, restart, failover, or config change must set humanApprovalRequired=true. Return ONLY valid JSON matching the requested schema.`;

export async function generateAnalysis(context: unknown): Promise<Analysis> {
  if (!client) return deterministicAnalysis(context);
  try {
    const completion = await client.chat.completions.create({
      model: env.groqModel, temperature: 0.1, response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(context) }]
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = analysisSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return enforceSafety(parsed.data);
    logger.warn({ issues: parsed.error.issues }, "Groq returned invalid analysis schema; using deterministic fallback");
  } catch (error) { logger.warn({ err: error }, "Groq analysis unavailable; using deterministic fallback"); }
  return deterministicAnalysis(context);
}

export function enforceSafety(a: Analysis): Analysis {
  const disruptive = /\b(rollback|scale|restart|failover|configuration|config change|revert|reboot|terminate|drain)\b/i;
  return {
    ...a,
    recommendedRemediationSteps: a.recommendedRemediationSteps.map(step => ({
      ...step,
      humanApprovalRequired: step.humanApprovalRequired || disruptive.test(step.action)
    }))
  };
}

export function deterministicAnalysis(context: any): Analysis {
  const incident = context?.incident ?? context ?? {};
  const timeline = context?.timeline ?? [];
  const memories = context?.memories ?? [];
  const text = `${incident.title ?? ""} ${incident.summary ?? ""} ${JSON.stringify(timeline)}`.toLowerCase();
  const historical = memories.map((m: any) => m.text ?? "");
  const failed = historical.filter((memory: string) => /Outcome:\s*FAILED/i.test(memory)).map((memory: string) => {
    const event = memory.match(/Event:\s*([\s\S]*?)(?:\n\nDetails:|$)/i)?.[1]?.trim() ?? "Previously failed remediation";
    const action = event.replace(/^Action:\s*/i, "").split("\n")[0] ?? event;
    return { action, reason: `Recorded as unsuccessful in ${memory.match(/Incident ID:\s*([^\n]+)/i)?.[1] ?? "a prior incident"}. Avoid repeating doomed action.` };
  });
  const postmortems = historical.filter((memory: string) => /Memory Type:\s*POSTMORTEM/i.test(memory));
  const similarIncidents = historical.map((memory: string) => ({
    memory,
    incidentId: memory.match(/Incident ID:\s*([^\n]+)/i)?.[1],
    title: memory.match(/Incident Title:\s*([^\n]+)/i)?.[1]
  })).filter((entry: any) => entry.incidentId && entry.incidentId !== incident.incident_key).map((entry: any) => ({
    incidentId: entry.incidentId,
    title: entry.title ?? "Historical incident",
    similarityReason: "Retrieved operational memory matching the service signature and symptoms.",
    historicalResolution: entry.memory.match(/Resolution:\s*([^\n]+)/i)?.[1] ?? "See retained incident evidence and postmortem details.",
    outcome: "RESOLVED"
  })).filter((entry: any, index: number, list: any[]) => list.findIndex((other: any) => other.incidentId === entry.incidentId) === index);
  const historicalCause = postmortems.map((memory: string) => memory.match(/Event:\s*([^\n]+)/i)?.[1]).filter(Boolean)[0];
  const historicalRes = postmortems.map((memory: string) => memory.match(/Resolution:\s*([^\n]+)/i)?.[1]).filter(Boolean)[0];
  const successfulRemediation = historical.filter((memory: string) => /Outcome:\s*SUCCESS/i.test(memory)).map((memory: string) => memory.match(/Action:\s*([^\n]+)/i)?.[1]).filter(Boolean)[0];

  const causes = /connection|503|timeout|database/.test(text)
    ? [{
        cause: historicalCause ? `Database connection or saturation issue; historical postmortem evidence records: ${historicalCause}` : "Database connection or saturation issue",
        confidence: historicalCause ? ("HIGH" as const) : ("MEDIUM" as const),
        evidence: [
          "Current incident context mentions database, connection, 503, or timeout symptoms.",
          ...(historicalCause ? [`Historical memory from prior resolved incident: "${historicalCause}"`] : [])
        ],
        missingEvidence: ["Database saturation and active connection pool metrics"]
      }]
    : [{
        cause: "Cause is undetermined from the available evidence",
        confidence: "LOW" as const,
        evidence: ["No conclusive root-cause evidence was supplied."],
        missingEvidence: ["Service metrics, correlated changes, and representative logs"]
      }];

  const recommendedRemediations = [];
  if (successfulRemediation || historicalRes) {
    recommendedRemediations.push({
      priority: 1,
      action: successfulRemediation ?? historicalRes ?? "Apply verified historical fix with human approval",
      reason: "Successfully resolved a prior similar incident. Human approval is strictly required before execution.",
      humanApprovalRequired: true
    });
  }

  const memoryEvidence = memories.map((m: any, idx: number) => ({
    memoryId: String(m.id ?? `mem-${idx + 1}`),
    sourceIncidentId: String(m.metadata?.incidentId ?? m.metadata?.incident_key ?? "historical-bank"),
    memoryType: String(m.metadata?.memoryType ?? "HINDSIGHT_MEMORY"),
    text: String(m.text ?? "").slice(0, 500),
    whyRelevant: "Retrieved operational memory relevant to current incident service and error signatures."
  }));

  return {
    summary: String(incident.summary ?? incident.title ?? "Incident context is limited; investigation is required."),
    likelyCauses: causes,
    similarIncidents,
    relevantChanges: [],
    recommendedInvestigationSteps: [
      { priority: 1, action: "Collect service error rates, dependency health, and changes near the incident start", reason: "Establish timeline and corroborating evidence before mitigation.", humanApprovalRequired: false }
    ],
    recommendedRemediationSteps: recommendedRemediations,
    deprioritizedActions: failed,
    escalationCriteria: ["Escalate to the service on-call if customer impact is increasing or the cause remains unclear."],
    uncertainties: ["Analysis uses available context; validate all evidence with current telemetry."],
    memoryEvidence
  };
}
