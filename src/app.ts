import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "./db/database";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { analysisSchema, generateAnalysis, enforceSafety } from "./services/groq.service";
import { buildIncidentAnalysisPrompt, recallMemories, reflectOnMemories } from "./services/hindsight.service";
import { requestOtp, verifyOtp, getUserByToken, terminateSession } from "./services/auth.service";
import {
  addEvidence,
  addEvent,
  addRemediation,
  createIncident,
  getIncident,
  getIncidentDetails,
  getTimeline,
  listIncidents,
  relatedMemories,
  savePostmortem,
  updateIncident,
  deleteIncident,
  getSystemStats,
  getServicesList,
  seedDemoData
} from "./services/incident.service";
import { environments, severities, statuses, type Incident } from "./types/incident";

export const app = express();
app.use(cors({ origin: env.nodeEnv === "production" ? env.frontendUrl : [env.frontendUrl, "http://localhost:3000", "http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "1mb" }));

const createSchema = z.object({ title: z.string().min(3), service: z.string().min(1), severity: z.enum(severities), status: z.enum(statuses).optional(), startedAt: z.string().datetime().optional(), environment: z.enum(environments), summary: z.string().min(1), detectedBy: z.string().optional(), affectedUsersCount: z.number().int().nonnegative().optional(), tags: z.array(z.string()).optional() });
const eventSchema = z.object({ type: z.enum(["ALERT", "DEPLOYMENT", "INFRA_CHANGE", "DIAGNOSIS", "RUNBOOK", "HUMAN_FEEDBACK"]), description: z.string().min(1), timestamp: z.string().datetime().optional(), metadata: z.record(z.unknown()).optional() });
const evidenceSchema = z.object({ kind: z.enum(["alert", "log", "deployment", "infra_change", "diagnosis", "runbook", "other"]), content: z.string().min(1), timestamp: z.string().datetime().optional(), deploymentVersion: z.string().optional() });
const remediationSchema = z.object({ action: z.string().min(1), actionType: z.string().min(1), rationale: z.string().min(1), result: z.enum(["SUCCESS", "PARTIAL_SUCCESS", "FAILED", "UNKNOWN"]), impact: z.string().optional(), performedBy: z.string().optional(), notes: z.string().optional(), timestamp: z.string().datetime().optional() });
const postmortemSchema = z.object({ rootCause: z.string().min(1), contributingFactors: z.array(z.string()), customerImpact: z.string(), resolution: z.string(), preventionActions: z.array(z.string()), lessonsLearned: z.string(), timelineSummary: z.string() });
const patchSchema = z.object({ title: z.string().min(3).optional(), service: z.string().min(1).optional(), severity: z.enum(severities).optional(), status: z.enum(statuses).optional(), environment: z.enum(environments).optional(), summary: z.string().min(1).optional(), detectedBy: z.string().optional(), affectedUsersCount: z.number().int().nonnegative().optional(), tags: z.array(z.string()).optional() }).refine(v => Object.keys(v).length > 0);
const success = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
function validate<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw Object.assign(new Error("Request validation failed"), { status: 422, code: "VALIDATION_ERROR", details: parsed.error.issues });
  return parsed.data;
}
function requireIncident(req: Request, res: Response): Incident | undefined {
  const incident = getIncident(String(req.params.incidentId));
  if (!incident) { res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Incident not found" } }); return undefined; }
  return incident;
}
async function analyze(incident: Incident, useMemory: boolean) {
  const timeline = getTimeline(incident.id);
  const memories = useMemory ? await relatedMemories(incident) : [];
  const prompt = buildIncidentAnalysisPrompt(incident, timeline, memories);
  let analysisMode = "baseline";
  let result;
  if (useMemory) {
    const reflected = await reflectOnMemories(prompt, "mid", incident.id);
    if (reflected.available) {
      try { result = enforceSafety(analysisSchema.parse(JSON.parse(reflected.text))); analysisMode = "hindsight-reflect"; }
      catch { result = await generateAnalysis({ incident, timeline, memories, reflection: reflected.text }); analysisMode = "fallback"; }
    } else { result = await generateAnalysis({ incident, timeline, memories }); analysisMode = "fallback"; }
  } else { result = await generateAnalysis({ incident, timeline }); }
  const memoryEvidence = memories.map(m => ({ memoryId: m.id, sourceIncidentId: String(m.metadata.incidentId ?? m.metadata.incident_id ?? "unknown"), memoryType: String(m.metadata.memoryType ?? m.metadata.memory_type ?? "HINDSIGHT_MEMORY"), text: m.text.slice(0, 500), whyRelevant: "Retrieved operational memory; verify against current telemetry." }));
  const output = { incidentId: incident.incident_key, analysisMode, generatedAt: new Date().toISOString(),
    severityAssessment: { currentSeverity: incident.severity, rationale: "Severity is the incident's recorded severity; reassess it against verified customer impact and current service metrics." },
    ...result, memoryEvidence: result.memoryEvidence.length ? result.memoryEvidence : memoryEvidence,
    safetyNotice: "This analysis is advisory. A qualified on-call engineer must verify evidence and approve all production changes." };
  db.prepare("INSERT INTO analysis_runs(id,incident_id,mode,analysis_json,created_at) VALUES(?,?,?,?,?)").run(randomUUID(), incident.id, analysisMode, JSON.stringify(output), output.generatedAt);
  return output;
}

app.get("/health", (_req, res) => success(res, { status: "ok", service: "recallops-backend", timestamp: new Date().toISOString(), integrations: { hindsight: "configured" in env && Boolean(env.hindsightApiKey || env.hindsightBaseUrl), groq: Boolean(env.groqApiKey) } }));
app.get("/health/db", (_req, res) => { try { db.prepare("SELECT 1").get(); success(res, { status: "ok" }); } catch { res.status(503).json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database unavailable" } }); } });
app.get("/api/stats", (_req, res) => success(res, getSystemStats()));
app.get("/api/services", (_req, res) => success(res, getServicesList()));
app.post("/api/seed", async (req, res, next) => { try { const force = Boolean(req.body?.force); const result = await seedDemoData(force); success(res, result); } catch (e) { next(e); } });

// Authentication Endpoints
const sendOtpSchema = z.object({ email: z.string().email("A valid email is required") });
const verifyOtpSchema = z.object({
  email: z.string().email("A valid email is required"),
  otp: z.string().min(4, "OTP is required"),
  name: z.string().optional(),
  role: z.string().optional()
});

app.post("/api/auth/send-otp", async (req, res, next) => {
  try {
    const { email } = validate(sendOtpSchema, req.body);
    const result = await requestOtp(email);
    success(res, result);
  } catch (e) { next(e); }
});

app.post("/api/auth/verify-otp", async (req, res, next) => {
  try {
    const { email, otp, name, role } = validate(verifyOtpSchema, req.body);
    const session = await verifyOtp(email, otp, name, role);
    success(res, session);
  } catch (e) { next(e); }
});

app.get("/api/auth/me", (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const user = getUserByToken(token);
    if (!user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      return;
    }
    success(res, { user });
  } catch (e) { next(e); }
});

app.post("/api/auth/logout", (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    terminateSession(token);
    success(res, { loggedOut: true });
  } catch (e) { next(e); }
});

app.post("/api/incidents", async (req, res, next) => { try { const created = await createIncident(validate(createSchema, req.body)); success(res, created, 201); } catch (e) { next(e); } });
app.get("/api/incidents", (req, res) => success(res, listIncidents({ status: req.query.status as string, severity: req.query.severity as string, service: req.query.service as string, environment: req.query.environment as string, limit: req.query.limit as string, offset: req.query.offset as string })));
app.get("/api/incidents/:incidentId", async (req, res, next) => {
  try {
    const details = await getIncidentDetails(String(req.params.incidentId));
    if (!details) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Incident not found" } });
      return;
    }
    success(res, details);
  } catch (e) { next(e); }
});
app.delete("/api/incidents/:incidentId", async (req, res, next) => {
  try {
    const ok = await deleteIncident(String(req.params.incidentId));
    if (!ok) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Incident not found" } });
      return;
    }
    success(res, { deleted: true, incidentId: req.params.incidentId });
  } catch (e) { next(e); }
});
app.patch("/api/incidents/:incidentId", async (req, res, next) => { try { const i = requireIncident(req, res); if (i) success(res, await updateIncident(i, validate(patchSchema, req.body))); } catch (e) { next(e); } });
app.post("/api/incidents/:incidentId/events", async (req, res, next) => { try { const i = requireIncident(req, res); if (i) success(res, await addEvent(i, validate(eventSchema, req.body)), 201); } catch (e) { next(e); } });
app.post("/api/incidents/:incidentId/evidence", async (req, res, next) => { try { const i = requireIncident(req, res); if (i) success(res, await addEvidence(i, validate(evidenceSchema, req.body)), 201); } catch (e) { next(e); } });
app.post("/api/incidents/:incidentId/remediations", async (req, res, next) => { try { const i = requireIncident(req, res); if (i) success(res, await addRemediation(i, validate(remediationSchema, req.body)), 201); } catch (e) { next(e); } });
app.post("/api/incidents/:incidentId/postmortem", async (req, res, next) => { try { const i = requireIncident(req, res); if (i) success(res, await savePostmortem(i, validate(postmortemSchema, req.body)), 201); } catch (e) { next(e); } });
app.get("/api/incidents/:incidentId/memories", async (req, res, next) => { try { const i = requireIncident(req, res); if (i) success(res, { memories: await recallMemories(`${i.incident_key} ${i.service} ${i.title} historical resolution runbook`, i.id) }); } catch (e) { next(e); } });
app.post("/api/incidents/:incidentId/analyze", async (req, res, next) => { try { const i = requireIncident(req, res); if (i) success(res, await analyze(i, true)); } catch (e) { next(e); } });
app.post("/api/incidents/:incidentId/compare-analysis", async (req, res, next) => { try {
  const i = requireIncident(req, res); if (!i) return;
  const baselineAnalysis = await analyze(i, false); const memoryPoweredAnalysis = await analyze(i, true);
  const improvementSummary = memoryPoweredAnalysis.memoryEvidence.length
    ? `Hindsight retrieved ${memoryPoweredAnalysis.memoryEvidence.length} relevant memory item(s). Review the evidence and compare historical outcomes with the baseline recommendations.`
    : "No matching Hindsight memories were available, so the memory-powered result used current incident context only. Retain seed data or connect Hindsight to demonstrate historical learning.";
  success(res, { baselineAnalysis, memoryPoweredAnalysis, improvementSummary });
} catch (e) { next(e); } });

// Static assets serving for production
const frontendDist = existsSync(path.join(process.cwd(), "frontend", "dist"))
  ? path.join(process.cwd(), "frontend", "dist")
  : path.join(process.cwd(), "dist", "frontend");

if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((_req, res) => res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } }));
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = error.status ?? 500;
  logger.error({ err: error, status }, "Request failed");
  res.status(status).json({ success: false, error: { code: error.code ?? "INTERNAL_ERROR", message: status === 500 ? "Unexpected server error" : error.message, ...(error.details ? { details: error.details } : {}) } });
});

