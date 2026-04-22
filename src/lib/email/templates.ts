const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "MyApp";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Verification email
// ---------------------------------------------------------------------------
export function buildVerificationEmail(token: string): {
  subject: string;
  html: string;
  text: string;
} {
  const link = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  const subject = `Verify your ${APP_NAME} email address`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff;
               border-radius: 8px; overflow: hidden;
               box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header  { background: #18181b; padding: 32px 40px; }
    .header h1 { margin: 0; color: #fff; font-size: 22px; letter-spacing: -.5px; }
    .body    { padding: 36px 40px; color: #3f3f46; line-height: 1.6; }
    .body p  { margin: 0 0 16px; }
    .btn     { display: inline-block; margin: 8px 0 24px;
               padding: 12px 28px; background: #18181b; color: #fff !important;
               border-radius: 6px; text-decoration: none; font-weight: 600;
               font-size: 15px; }
    .footer  { padding: 20px 40px; background: #f4f4f5;
               font-size: 12px; color: #71717a; }
    .footer a { color: #71717a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${APP_NAME}</h1>
    </div>
    <div class="body">
      <p>Hi there 👋</p>
      <p>Thanks for signing up. Please verify your email address by clicking the button below.
         The link expires in <strong>24 hours</strong>.</p>
      <a href="${link}" class="btn">Verify my email</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break:break-all;font-size:13px;color:#71717a;">${link}</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br />
      You received this email because someone signed up using this address.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${APP_NAME} – Verify your email
=================================

Hi there,

Thanks for signing up. Please verify your email address by visiting the link below.
The link expires in 24 hours.

${link}

If you didn't create an account, you can safely ignore this email.
  `.trim();

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Welcome email (sent after successful verification)
// ---------------------------------------------------------------------------
export function buildWelcomeEmail(email: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Welcome to ${APP_NAME}!`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family:sans-serif; }
    .wrapper { max-width:560px; margin:40px auto; background:#fff;
               border-radius:8px; overflow:hidden;
               box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header  { background:#18181b; padding:32px 40px; }
    .header h1 { margin:0; color:#fff; font-size:22px; }
    .body    { padding:36px 40px; color:#3f3f46; line-height:1.6; }
    .body p  { margin:0 0 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>${APP_NAME}</h1></div>
    <div class="body">
      <p>🎉 Your email <strong>${email}</strong> has been verified.</p>
      <p>You can now log in and explore everything ${APP_NAME} has to offer.</p>
      <p>Welcome aboard!</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `Your email ${email} has been verified. Welcome to ${APP_NAME}!`;

  return { subject, html, text };
}