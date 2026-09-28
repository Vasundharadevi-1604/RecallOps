import { randomUUID } from "node:crypto";
import { db } from "../db/database";
import { sendOtpEmail } from "./email.service";
import { logger } from "../utils/logger";

const now = () => new Date().toISOString();

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  last_login_at: string;
}

export function formatNameFromEmail(email: string): string {
  const local = email.split("@")[0] || "Responder";
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "SRE Responder";
}

export async function requestOtp(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@") || !email.includes(".")) {
    const err: any = new Error("Please provide a valid email address");
    err.status = 400;
    throw err;
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const id = randomUUID();
  const createdAt = now();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Invalidate any older unused codes for this email
  db.prepare("UPDATE auth_otps SET used_at = ? WHERE email = ? AND used_at IS NULL").run(createdAt, email);

  // Insert fresh OTP record
  db.prepare(`
    INSERT INTO auth_otps (id, email, otp, expires_at, attempts, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(id, email, otp, expiresAt, createdAt);

  // Send the email via SMTP or simulated dev transporter
  await sendOtpEmail(email, otp);

  return {
    success: true,
    message: `Verification code sent to ${email}`,
    email
  };
}

export async function verifyOtp(rawEmail: string, rawOtp: string, customName?: string, customRole?: string) {
  const email = rawEmail.trim().toLowerCase();
  const otp = rawOtp.trim();

  if (!email || !otp) {
    const err: any = new Error("Email and OTP are required");
    err.status = 400;
    throw err;
  }

  const stamp = now();

  // Find latest OTP record
  const record = db.prepare(`
    SELECT * FROM auth_otps
    WHERE email = ? AND used_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `).get(email) as any;

  if (!record) {
    const err: any = new Error("No active verification code found for this email. Please request a new one.");
    err.status = 400;
    throw err;
  }

  if (record.expires_at < stamp) {
    const err: any = new Error("Verification code has expired. Please request a new one.");
    err.status = 400;
    throw err;
  }

  if (record.attempts >= 5) {
    const err: any = new Error("Too many invalid attempts. This code is now void; please request a new one.");
    err.status = 400;
    throw err;
  }

  if (record.otp !== otp) {
    db.prepare("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?").run(record.id);
    const remaining = 5 - (record.attempts + 1);
    const err: any = new Error(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
    err.status = 401;
    throw err;
  }

  // Mark OTP as used
  db.prepare("UPDATE auth_otps SET used_at = ? WHERE id = ?").run(stamp, record.id);

  // Upsert user
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;

  if (!user) {
    const userId = randomUUID();
    const name = customName?.trim() || formatNameFromEmail(email);
    const role = customRole?.trim() || (email.includes("admin") || email.includes("lead") ? "SRE Commander" : "On-Call Responder");
    db.prepare(`
      INSERT INTO users (id, email, name, role, created_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, email, name, role, stamp, stamp);
    user = { id: userId, email, name, role, created_at: stamp, last_login_at: stamp };
  } else {
    const updatedName = customName?.trim() || user.name;
    const updatedRole = customRole?.trim() || user.role;
    db.prepare("UPDATE users SET name = ?, role = ?, last_login_at = ? WHERE id = ?").run(updatedName, updatedRole, stamp, user.id);
    user.name = updatedName;
    user.role = updatedRole;
    user.last_login_at = stamp;
  }

  // Create session
  const token = randomUUID();
  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  db.prepare(`
    INSERT INTO sessions (token, user_id, email, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(token, user.id, email, sessionExpiresAt, stamp);

  logger.info({ email, userId: user.id }, "User successfully authenticated via email OTP");

  return {
    token,
    user
  };
}

export function getUserByToken(token: string): User | null {
  if (!token) return null;
  const stamp = now();

  const session = db.prepare(`
    SELECT * FROM sessions WHERE token = ? AND expires_at > ?
  `).get(token, stamp) as any;

  if (!session) return null;

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id) as User | undefined;
  return user || null;
}

export function terminateSession(token: string): void {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
