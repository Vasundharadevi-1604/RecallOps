import { describe, expect, it } from "vitest";
import { formatIncidentMemory } from "../src/services/memoryFormatter.service";
import type { Incident } from "../src/types/incident";

const incident: Incident = {
  id: "internal-id", incident_key: "INC-2026-001", title: "Checkout errors", service: "checkout-api",
  severity: "SEV1", status: "INVESTIGATING", started_at: "2026-09-28T12:00:00.000Z",
  environment: "production", summary: "Elevated 503s", detected_by: null, affected_users_count: 0,
  tags: [], created_at: "2026-09-28T12:00:00.000Z", updated_at: "2026-09-28T12:00:00.000Z", resolved_at: null
};

describe("formatIncidentMemory", () => {
  it("includes structured incident metadata and event content", () => {
    const text = formatIncidentMemory({ incident, type: "DEPLOYMENT", event: "Release completed", timestamp: "2026-09-28T12:10:00.000Z", deploymentVersion: "checkout-api@2.4.1" });
    expect(text).toContain("Incident ID: INC-2026-001");
    expect(text).toContain("Service: checkout-api");
    expect(text).toContain("Memory Type: DEPLOYMENT");
    expect(text).toContain("Deployment Version: checkout-api@2.4.1");
    expect(text).toContain("Release completed");
  });
});
