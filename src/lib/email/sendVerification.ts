import { EMAIL_FROM, transporter } from "./mailer";
import { buildVerificationEmail, buildWelcomeEmail } from "./templates";

/**
 * Send the email-verification link to a newly registered user.
 */
export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const { subject, html, text } = buildVerificationEmail(token);

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
}

/**
 * Send a welcome email once the user successfully verifies their address.
 */
export async function sendWelcomeEmail(to: string): Promise<void> {
  const { subject, html, text } = buildWelcomeEmail(to);

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
}