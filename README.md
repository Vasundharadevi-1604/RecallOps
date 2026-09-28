# RecallOps Backend

RecallOps is a memory-powered incident response assistant. It uses Hindsight as long-term operational memory to retrieve past incidents, failed attempts, runbooks, and postmortem outcomes; SQLite stores application records and current incident state.

## Architecture

Express + TypeScript exposes a REST API. SQLite stores incidents, timeline events, evidence, remediation feedback, postmortems, and analysis history. The Hindsight bank (`recallops-demo` by default) is the long-term memory layer. Hindsight `retain` is called for incident creation and meaningful updates; `recall` supplies relevant memories to analysis; `reflect` produces grounded analysis. If reflection is unavailable, the API uses Groq synthesis when configured, or an explicitly cautious deterministic fallback. Groq is also used for baseline no-memory analysis.

No production action is ever executed. Remediation suggestions involving rollback, scale, restart, failover, or configuration changes always require human approval.

## Run locally

Requirements: Node.js 20+, npm, and a reachable Hindsight instance. Hindsight Cloud can be used, or run the official Hindsight service using its current deployment instructions at [Hindsight docs](https://hindsight.vectorize.io/). The repository's compose file provides a local service option.

```sh
npm install
cp .env.example .env
# Set HINDSIGHT_BASE_URL, HINDSIGHT_API_KEY if required, and optionally GROQ_API_KEY
npm run dev
```

The API listens on `http://localhost:4000`. `npm run build` compiles to `dist/`; `npm start` runs the compiled service. `npm run seed` inserts demo records and attempts to retain each one in Hindsight. Seed is idempotent for a nonempty database. If retain fails, the API response/log reports that failure instead of claiming the memory was stored.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | API port |
| `NODE_ENV` | `development` | Runtime mode |
| `DATABASE_PATH` | `./data/recallops.sqlite` | SQLite file path (`:memory:` supported) |
| `HINDSIGHT_BASE_URL` | `http://localhost:8888` | Hindsight API URL |
| `HINDSIGHT_API_KEY` | empty | Cloud/API credential, if required |
| `HINDSIGHT_BANK_ID` | `recallops-demo` | Shared memory bank |
| `GROQ_API_KEY` | empty | Groq for baseline and reflection fallback |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Groq model |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |

## API

All success responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": { "code", "message" } }`.

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Service/integration status |
| GET | `/health/db` | SQLite connectivity |
| POST | `/api/incidents` | Create incident and retain initial memory |
| GET | `/api/incidents` | List incidents; filters: `status`, `severity`, `service`, `environment`, `limit`, `offset` |
| GET | `/api/incidents/:incidentId` | Incident and timeline |
| PATCH | `/api/incidents/:incidentId` | Update incident |
| POST | `/api/incidents/:incidentId/events` | Add timeline event |
| POST | `/api/incidents/:incidentId/evidence` | Add log, alert, deploy, or other evidence |
| POST | `/api/incidents/:incidentId/remediations` | Record remediation outcome for learning |
| POST | `/api/incidents/:incidentId/postmortem` | Save postmortem and resolve incident |
| POST | `/api/incidents/:incidentId/analyze` | Hindsight-powered analysis |
| POST | `/api/incidents/:incidentId/compare-analysis` | Baseline vs memory-powered analysis |
| GET | `/api/incidents/:incidentId/memories` | Retrieve evidence for an explanation panel |

Create an incident:

```sh
curl -X POST http://localhost:4000/api/incidents -H 'Content-Type: application/json' -d '{"title":"Checkout 503 spike","service":"checkout-api","severity":"SEV1","environment":"production","summary":"503s increased after a deployment","tags":["checkout"]}'
```

Add evidence and analyze (replace `INC-...` with returned incident key):

```sh
curl -X POST http://localhost:4000/api/incidents/INC-2026-001/evidence -H 'Content-Type: application/json' -d '{"kind":"log","content":"Database connection timeout"}'
curl -X POST http://localhost:4000/api/incidents/INC-2026-001/analyze
curl -X POST http://localhost:4000/api/incidents/INC-2026-001/compare-analysis
```

Record remediation feedback:

```sh
curl -X POST http://localhost:4000/api/incidents/INC-2026-001/remediations -H 'Content-Type: application/json' -d '{"action":"Restarted application pods","actionType":"restart","rationale":"Attempted to recover service","result":"FAILED","notes":"503 rate remained elevated"}'
```

## Demo

1. Configure Hindsight and optionally Groq, then run `npm run seed`.
2. Analyze the active `checkout-api@2.5.0` incident returned by the seed output.
3. Compare `/analyze` with `/compare-analysis`. Historical memory distinguishes a deployment/configuration cause from a traffic-driven database saturation incident, surfaces a previously failed pod restart, and suggests investigating deployment and connection metrics before considering rollback with human approval.
4. Record a remediation result and postmortem. Those results are retained for future recall.

## Limitations

Hindsight recall response shapes are normalized defensively because the SDK may evolve. Reflection output is schema-validated; malformed or unavailable reflection uses the Groq/deterministic fallback and the response identifies `analysisMode`. This MVP intentionally omits authentication and automatic operations. Rate limiting, advanced paging, and dedicated runbook CRUD can be added after the core memory loop.
