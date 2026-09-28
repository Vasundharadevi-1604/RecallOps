import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/db/database";

describe("OTP Email Authentication API", () => {
  const testEmail = "oncall.tester@recallops.io";
  let activeOtp = "";
  let authToken = "";

  it("POST /api/auth/send-otp rejects invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/send-otp successfully dispatches OTP (without exposing code in response)", async () => {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    // Secure: OTP is NOT exposed in the JSON response
    expect(res.body.data.previewCode).toBeUndefined();

    // Verify OTP was securely stored in DB for verification
    const row = db.prepare("SELECT otp FROM auth_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1").get(testEmail) as any;
    expect(row).toBeDefined();
    expect(row.otp).toHaveLength(6);
    activeOtp = row.otp;
  });

  it("POST /api/auth/verify-otp fails on incorrect OTP", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: testEmail, otp: "000000" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/verify-otp succeeds on correct OTP and returns token + user", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: testEmail, otp: activeOtp });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBeDefined();
    authToken = res.body.data.token;
  });

  it("GET /api/auth/me returns authenticated user with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it("GET /api/auth/me returns 401 with missing or invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/logout terminates the session", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify token is now invalid
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(meRes.status).toBe(401);
  });
});
