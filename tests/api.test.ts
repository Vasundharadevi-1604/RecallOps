import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";

let app: Express;
beforeAll(async () => {
  process.env.DATABASE_PATH = ":memory:";
  ({ app } = await import("../src/app"));
});

describe("Incident API & Operations", () => {
  let createdIncidentKey = "";
  let createdIncidentId = "";

  it("returns a consistent 404 for an unknown incident analysis", async () => {
    const response = await request(app).post("/api/incidents/INC-DOES-NOT-EXIST/analyze");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("creates a new incident successfully", async () => {
    const res = await request(app)
      .post("/api/incidents")
      .send({
        title: "Database latency spike on payment gateway",
        service: "payment-api",
        severity: "SEV1",
        environment: "production",
        summary: "Connection timeouts and 504 errors reported on payment checkout.",
        detectedBy: "datadog-alert",
        affectedUsersCount: 450,
        tags: ["database", "payment"]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.incident).toBeDefined();
    expect(res.body.data.incident.incident_key).toMatch(/^INC-\d{4}-\d{3}$/);
    expect(res.body.data.incident.status).toBe("OPEN");

    createdIncidentKey = res.body.data.incident.incident_key;
    createdIncidentId = res.body.data.incident.id;
  });

  it("lists incidents with filters", async () => {
    const res = await request(app).get("/api/incidents?status=OPEN&severity=SEV1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].service).toBe("payment-api");
  });

  it("adds timeline events to incident", async () => {
    const res = await request(app)
      .post(`/api/incidents/${createdIncidentKey}/events`)
      .send({
        type: "ALERT",
        description: "Payment gateway p99 latency exceeded 5000ms threshold.",
        metadata: { latencyMs: 5400, thresholdMs: 1000 }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.event.event_type).toBe("ALERT");
  });

  it("attaches evidence to incident", async () => {
    const res = await request(app)
      .post(`/api/incidents/${createdIncidentKey}/evidence`)
      .send({
        kind: "log",
        content: "Error: ConnectionPoolExhausted: timeout waiting for connection from pool after 3000ms"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.evidence.kind).toBe("log");
  });

  it("records remediation attempt (failed action)", async () => {
    const res = await request(app)
      .post(`/api/incidents/${createdIncidentKey}/remediations`)
      .send({
        action: "Restarted payment-api pods",
        actionType: "restart",
        rationale: "Clear stuck database connections",
        result: "FAILED",
        notes: "Connection pool remained saturated immediately after restart."
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.remediation.result).toBe("FAILED");
  });

  it("retrieves the complete incident bundle (timeline, evidence, remediations)", async () => {
    const res = await request(app).get(`/api/incidents/${createdIncidentKey}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.incident).toBeDefined();
    expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(2); // INCIDENT_CREATED + ALERT
    expect(res.body.data.evidence.length).toBe(1);
    expect(res.body.data.evidence[0].content).toContain("ConnectionPoolExhausted");
    expect(res.body.data.remediations.length).toBe(1);
    expect(res.body.data.remediations[0].result).toBe("FAILED");
  });

  it("updates incident status to INVESTIGATING", async () => {
    const res = await request(app)
      .patch(`/api/incidents/${createdIncidentKey}`)
      .send({ status: "INVESTIGATING" });

    expect(res.status).toBe(200);
    expect(res.body.data.incident.status).toBe("INVESTIGATING");
  });

  it("runs memory-powered analysis and requires human approval for remediation", async () => {
    const res = await request(app).post(`/api/incidents/${createdIncidentKey}/analyze`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.likelyCauses.length).toBeGreaterThan(0);
    expect(res.body.data.safetyNotice).toContain("advisory");

    // Verify all remediation steps enforce human approval
    for (const step of res.body.data.recommendedRemediationSteps) {
      expect(step.humanApprovalRequired).toBe(true);
    }
  });

  it("compares baseline vs memory-powered analysis", async () => {
    const res = await request(app).post(`/api/incidents/${createdIncidentKey}/compare-analysis`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.baselineAnalysis).toBeDefined();
    expect(res.body.data.memoryPoweredAnalysis).toBeDefined();
    expect(res.body.data.improvementSummary).toBeDefined();
  });

  it("records postmortem and automatically resolves incident", async () => {
    const res = await request(app)
      .post(`/api/incidents/${createdIncidentKey}/postmortem`)
      .send({
        rootCause: "Leak in payment database connection pool under heavy query concurrency.",
        contributingFactors: ["Missing connection pool max_lifetime config", "Spike in concurrent checkouts"],
        customerImpact: "450 customer payments failed with 504 Gateway Timeout over 25 minutes.",
        resolution: "Increased connection pool size to 100 and added connection timeout backoff.",
        preventionActions: ["Add connection pool saturation alerts at 80% threshold", "Run load tests on checkout API"],
        lessonsLearned: "Restarting pods during connection pool exhaustion does not address database connection leakage.",
        timelineSummary: "Incident opened at 14:00, investigated, connection pool increased at 14:25, fully recovered."
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.postmortem.root_cause).toContain("Leak in payment database connection pool");

    // Verify incident is now marked RESOLVED with resolved_at timestamp
    const verifyRes = await request(app).get(`/api/incidents/${createdIncidentKey}`);
    expect(verifyRes.body.data.incident.status).toBe("RESOLVED");
    expect(verifyRes.body.data.incident.resolved_at).toBeTruthy();
    expect(verifyRes.body.data.postmortem).toBeDefined();
  });

  it("provides operational statistics via /api/stats", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalIncidents).toBeGreaterThanOrEqual(1);
    expect(res.body.data.services).toContain("payment-api");
    expect(res.body.data.severityBreakdown.SEV1).toBeGreaterThanOrEqual(1);
  });

  it("provides service list via /api/services", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain("payment-api");
  });

  it("allows seeding demo data via /api/seed", async () => {
    const res = await request(app).post("/api/seed").send({ force: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.seeded).toBe(true);
    expect(res.body.data.activeIncidentKey).toBeTruthy();
  }, 15000);
});

