import { describe, expect, it } from "vitest";
import { enforceSafety, analysisSchema } from "../src/services/groq.service";

describe("analysis safety", () => {
  it("requires human approval for disruptive remediation recommendations", () => {
    const analysis = analysisSchema.parse({
      summary: "Evidence is incomplete.", likelyCauses: [], similarIncidents: [], relevantChanges: [],
      recommendedInvestigationSteps: [],
      recommendedRemediationSteps: [{ priority: 1, action: "Rollback the deployment", reason: "Investigate the release correlation", humanApprovalRequired: false }],
      deprioritizedActions: [], escalationCriteria: [], uncertainties: [], memoryEvidence: []
    });
    expect(enforceSafety(analysis).recommendedRemediationSteps[0]?.humanApprovalRequired).toBe(true);
  });
});
