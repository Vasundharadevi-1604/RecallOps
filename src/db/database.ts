import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { env } from "../config/env";

if (env.databasePath !== ":memory:") mkdirSync(dirname(env.databasePath), { recursive: true });
export const db = new Database(env.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS incidents (
 id TEXT PRIMARY KEY, incident_key TEXT UNIQUE NOT NULL, title TEXT NOT NULL, service TEXT NOT NULL,
 severity TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, environment TEXT NOT NULL,
 summary TEXT NOT NULL, detected_by TEXT, affected_users_count INTEGER NOT NULL DEFAULT 0,
 tags TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS incident_events (
 id TEXT PRIMARY KEY, incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
 event_type TEXT NOT NULL, description TEXT NOT NULL, occurred_at TEXT NOT NULL, metadata TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS evidence (
 id TEXT PRIMARY KEY, incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS remediations (
 id TEXT PRIMARY KEY, incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
 action TEXT NOT NULL, action_type TEXT NOT NULL, rationale TEXT NOT NULL, result TEXT NOT NULL,
 impact TEXT, performed_by TEXT, notes TEXT, timestamp TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS postmortems (
 id TEXT PRIMARY KEY, incident_id TEXT UNIQUE NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
 root_cause TEXT NOT NULL, contributing_factors TEXT NOT NULL, customer_impact TEXT NOT NULL,
 resolution TEXT NOT NULL, prevention_actions TEXT NOT NULL, lessons_learned TEXT NOT NULL,
 timeline_summary TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS analysis_runs (
 id TEXT PRIMARY KEY, incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
 mode TEXT NOT NULL, analysis_json TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY,
 email TEXT UNIQUE NOT NULL,
 name TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'SRE Responder',
 created_at TEXT NOT NULL,
 last_login_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_otps (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL,
 otp TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 used_at TEXT,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 email TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL
);
`);
