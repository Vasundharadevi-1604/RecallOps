import type { Incident } from "../types/incident";

export function formatIncidentMemory(input: {
  incident: Incident; type: string; event: string; timestamp?: string;
  outcome?: string; confidence?: string; deploymentVersion?: string; details?: string;
}): string {
  const { incident } = input;
  return `[INCIDENT MEMORY]\nIncident ID: ${incident.incident_key}\nIncident Title: ${incident.title}\nService: ${incident.service}\nEnvironment: ${incident.environment}\nSeverity: ${incident.severity}\nTimestamp: ${input.timestamp ?? new Date().toISOString()}\nMemory Type: ${input.type}${input.deploymentVersion ? `\nDeployment Version: ${input.deploymentVersion}` : ""}${input.outcome ? `\nOutcome: ${input.outcome}` : ""}${input.confidence ? `\nConfidence: ${input.confidence}` : ""}\n\nEvent:\n${input.event}${input.details ? `\n\nDetails:\n${input.details}` : ""}`;
}
