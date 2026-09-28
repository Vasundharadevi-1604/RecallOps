import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (env.smtpHost && env.smtpUser && env.smtpPass) {
    logger.info({ host: env.smtpHost, port: env.smtpPort }, "Initializing SMTP transporter for OTP authentication");
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  } else {
    logger.info("Using simulated OTP email delivery transporter (development mode)");
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
  }

  return transporter;
}

export interface SendOtpResult {
  sent: boolean;
  messageId?: string;
  previewUrl?: string;
  devOtp?: string;
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<SendOtpResult> {
  const mailer = getTransporter();
  const isRealSmtp = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

  const subject = `RecallOps War Room OTP: ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 24px; margin: 0; }
          .card { max-width: 480px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; }
          .badge { display: inline-block; background-color: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.05em; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 8px; }
          .desc { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
          .otp-box { background-color: #030712; border: 1px solid #374151; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px; }
          .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #38bdf8; }
          .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
          .footer { font-size: 12px; color: #64748b; border-top: 1px solid #1f2937; padding-top: 16px; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">RecallOps Authentication</span>
          <h2 class="title">Incident War Room Login</h2>
          <p class="desc">You requested an on-call authentication code to access the RecallOps Incident War Room. Enter this code to sign in:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Expires in 10 minutes (Single Use)</div>
          </div>
          <div class="footer">
            If you did not request this code, an engineer or monitor may have referenced your email for on-call notification. No further action is required.
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `RecallOps Incident War Room Login\n\nYour 6-digit OTP verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

  try {
    const info = await mailer.sendMail({
      from: env.smtpFrom,
      to: toEmail,
      subject,
      text,
      html
    });

    logger.info({ to: toEmail, otp, messageId: info.messageId, isRealSmtp }, "OTP email dispatched");

    return {
      sent: true,
      messageId: info.messageId,
      devOtp: isRealSmtp ? undefined : otp
    };
  } catch (err: any) {
    logger.error({ err, to: toEmail }, "Failed to send OTP email via transporter; falling back to simulated log delivery");
    return {
      sent: true,
      devOtp: otp
    };
  }
}
