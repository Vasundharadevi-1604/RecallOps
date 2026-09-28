import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databasePath: process.env.DATABASE_PATH ?? "./data/recallops.sqlite",
  hindsightBaseUrl: process.env.HINDSIGHT_BASE_URL ?? "http://localhost:8888",
  hindsightApiKey: process.env.HINDSIGHT_API_KEY,
  hindsightBankId: process.env.HINDSIGHT_BANK_ID ?? "recallops-demo",
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM ?? "RecallOps Security <no-reply@recallops.io>"
};
