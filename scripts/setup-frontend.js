import fs from 'node:fs';
import path from 'node:path';

function write(relPath, content) {
  const full = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('Created:', relPath);
}

// 1. vite.config.ts
write('frontend/vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
`);

// 2. tsconfig.json
write('frontend/tsconfig.json', `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`);

// 3. postcss.config.js
write('frontend/postcss.config.js', `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`);

// 4. tailwind.config.js
write('frontend/tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        recall: {
          bg: '#0a0d14',
          surface: '#111726',
          card: '#161e31',
          border: '#1f2a44',
          accent: '#6366f1',
          warning: '#f59e0b',
          danger: '#ef4444',
          success: '#10b981',
          memory: '#a855f7'
        }
      }
    }
  },
  plugins: []
};
`);

// 5. index.html
write('frontend/index.html', `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RecallOps | Memory-Powered Incident Response</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-[#0a0d14] text-slate-100 font-['Inter',sans-serif] antialiased selection:bg-indigo-500 selection:text-white min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

// 6. src/index.css
write('frontend/src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #0a0d14;
    color: #e2e8f0;
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #0f172a;
  }
  ::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

.pulse-glow {
  animation: pulseGlow 2.5s infinite ease-in-out;
}
`);

// 7. src/types/index.ts
write('frontend/src/types/index.ts', `export type Severity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
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
`);

// 8. src/api/client.ts
write('frontend/src/api/client.ts', `import type {
  Incident,
  IncidentDetailsBundle,
  SystemStats,
  HealthStatus,
  AnalysisResult,
  CompareAnalysisResponse,
  TimelineEvent,
  Evidence,
  Remediation,
  Postmortem
} from '../types';

const API_BASE = '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(\`\${API_BASE}\${url}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  const body = await res.json();
  if (!res.ok || body.success === false) {
    const errorMsg = body?.error?.message || body?.message || \`HTTP \${res.status}: \${res.statusText}\`;
    throw new Error(errorMsg);
  }

  return body.data as T;
}

export const api = {
  // System health & stats
  getHealth: () => fetchJson<HealthStatus>('/health'),
  getStats: () => fetchJson<SystemStats>('/api/stats'),
  getServices: () => fetchJson<string[]>('/api/services'),

  // Incident Operations
  listIncidents: (filters?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }
    const q = params.toString();
    return fetchJson<Incident[]>(\`/api/incidents\${q ? \`?\${q}\` : ''}\`);
  },

  getIncident: (incidentKeyOrId: string) =>
    fetchJson<IncidentDetailsBundle>(\`/api/incidents/\${incidentKeyOrId}\`),

  createIncident: (data: {
    title: string;
    service: string;
    severity: string;
    environment: string;
    summary: string;
    detectedBy?: string;
    affectedUsersCount?: number;
    tags?: string[];
  }) => fetchJson<{ incident: Incident; memoryStatus: { success: boolean } }>('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateIncident: (incidentId: string, patch: Partial<Incident>) =>
    fetchJson<{ incident: Incident; memoryStatus: { success: boolean } }>(\`/api/incidents/\${incidentId}\`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    }),

  deleteIncident: (incidentId: string) =>
    fetchJson<{ deleted: boolean; incidentId: string }>(\`/api/incidents/\${incidentId}\`, {
      method: 'DELETE'
    }),

  // Events & Timeline
  addEvent: (incidentId: string, event: {
    type: string;
    description: string;
    metadata?: Record<string, unknown>;
  }) => fetchJson<{ event: TimelineEvent; memoryStatus: { success: boolean } }>(\`/api/incidents/\${incidentId}/events\`, {
    method: 'POST',
    body: JSON.stringify(event)
  }),

  // Evidence
  addEvidence: (incidentId: string, evidence: {
    kind: string;
    content: string;
    deploymentVersion?: string;
  }) => fetchJson<{ evidence: Evidence; memoryStatus: { success: boolean } }>(\`/api/incidents/\${incidentId}/evidence\`, {
    method: 'POST',
    body: JSON.stringify(evidence)
  }),

  // Remediation Outcome
  addRemediation: (incidentId: string, rem: {
    action: string;
    actionType: string;
    rationale: string;
    result: string;
    impact?: string;
    performedBy?: string;
    notes?: string;
  }) => fetchJson<{ remediation: Remediation; memoryStatus: { success: boolean } }>(\`/api/incidents/\${incidentId}/remediations\`, {
    method: 'POST',
    body: JSON.stringify(rem)
  }),

  // Postmortem
  savePostmortem: (incidentId: string, postmortem: {
    rootCause: string;
    contributingFactors: string[];
    customerImpact: string;
    resolution: string;
    preventionActions: string[];
    lessonsLearned: string;
    timelineSummary: string;
  }) => fetchJson<{ postmortem: Postmortem; memoryStatus: { success: boolean } }>(\`/api/incidents/\${incidentId}/postmortem\`, {
    method: 'POST',
    body: JSON.stringify(postmortem)
  }),

  // Analysis
  analyze: (incidentId: string) =>
    fetchJson<AnalysisResult>(\`/api/incidents/\${incidentId}/analyze\`, {
      method: 'POST'
    }),

  compareAnalysis: (incidentId: string) =>
    fetchJson<CompareAnalysisResponse>(\`/api/incidents/\${incidentId}/compare-analysis\`, {
      method: 'POST'
    }),

  getMemories: (incidentId: string) =>
    fetchJson<{ memories: any[] }>(\`/api/incidents/\${incidentId}/memories\`),

  // Seed / Reset
  seedDemo: (force = true) =>
    fetchJson<{ seeded: boolean; message: string; activeIncidentKey: string }>('/api/seed', {
      method: 'POST',
      body: JSON.stringify({ force })
    })
};
`);

console.log('Frontend setup script finished!');
