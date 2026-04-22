import nodemailer from "nodemailer";

/**
 * Reusable nodemailer transporter.
 * Configure via environment variables:
 *
 *   EMAIL_HOST      – SMTP host (e.g. smtp.gmail.com)
 *   EMAIL_PORT      – SMTP port (e.g. 587)
 *   EMAIL_SECURE    – "true" for port 465, otherwise false
 *   EMAIL_USER      – sender address / login
 *   EMAIL_PASS      – sender password / app-password
 *   EMAIL_FROM      – display name + address, e.g. "MyApp <no-reply@myapp.com>"
 */
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? `"MyApp" <no-reply@myapp.com>`;