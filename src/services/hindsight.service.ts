import { HindsightClient } from "@vectorize-io/hindsight-client";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface NormalizedMemory { id: string; text: string; metadata: Record<string, unknown>; }
export interface RetainResult { success: boolean; memoryId?: string; error?: string; }
export interface ReflectionResult { text: string; available: boolean; }

const client = new HindsightClient({ baseUrl: env.hindsightBaseUrl, ...(env.hindsightApiKey ? { apiKey: env.hindsightApiKey } : {}) });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function retry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const msg = String((error as any)?.message ?? (error as any)?.details ?? error);
      const isDown = msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND");
      if (isDown || attempt >= 2) {
        break;
      }
      await delay(100 * (2 ** attempt));
    }
  }
  throw last;
}
function asMemories(response: unknown): NormalizedMemory[] {
  const root = response as any;
  const rows = Array.isArray(root) ? root : root?.results ?? root?.memories ?? root?.items ?? root?.data ?? [];
  return Array.isArray(rows) ? rows.map((row: any, index: number) => ({
    id: String(row?.id ?? row?.memory_id ?? `memory-${index + 1}`),
    text: String(row?.text ?? row?.content ?? row?.memory ?? row?.summary ?? ""),
    metadata: row?.metadata && typeof row.metadata === "object" ? row.metadata : {}
  })).filter((item: NormalizedMemory) => item.text.length > 0) : [];
}

export async function retainMemory(content: string, incidentId?: string): Promise<RetainResult> {
  try {
    await retry(() => client.retain(env.hindsightBankId, content));
    logger.info({ requestType: "retain", incidentId }, "Hindsight memory retained");
    return { success: true };
  } catch (error) {
    logger.error({ requestType: "retain", incidentId, err: error }, "Hindsight retain failed");
    return { success: false, error: "Hindsight memory service is unavailable" };
  }
}

export async function recallMemories(query: string, incidentId?: string): Promise<NormalizedMemory[]> {
  try {
    const response = await retry(() => client.recall(env.hindsightBankId, query));
    logger.info({ requestType: "recall", incidentId }, "Hindsight recall completed");
    return asMemories(response);
  } catch (error) {
    logger.warn({ requestType: "recall", incidentId, err: error }, "Hindsight recall unavailable");
    return [];
  }
}

export async function reflectOnMemories(prompt: string, budget = "mid", incidentId?: string): Promise<ReflectionResult> {
  try {
    const response = await retry(() => (client as any).reflect(env.hindsightBankId, prompt, { budget }));
    const text = typeof response === "string" ? response : String((response as any)?.text ?? (response as any)?.response ?? (response as any)?.content ?? "");
    if (!text) return { text: "", available: false };
    logger.info({ requestType: "reflect", incidentId }, "Hindsight reflection completed");
    return { text, available: true };
  } catch (error) {
    logger.warn({ requestType: "reflect", incidentId, err: error }, "Hindsight reflect unavailable");
    return { text: "", available: false };
  }
}

export function buildIncidentAnalysisPrompt(incident: unknown, timeline: unknown[], recalledMemories: NormalizedMemory[]): string {
  return `Analyze this production incident using only supplied facts and retrieved memories. Separate evidence from inference, state uncertainty, do not invent facts, and never execute an operational action. Mark rollback, restart, scaling, failover, and configuration changes HUMAN APPROVAL REQUIRED.\nCURRENT INCIDENT:\n${JSON.stringify(incident)}\nTIMELINE:\n${JSON.stringify(timeline)}\nRETRIEVED HINDSIGHT MEMORIES:\n${JSON.stringify(recalledMemories)}`;
}
