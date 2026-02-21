import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendResetEmail(
  to: string,
  resetUrl: string
) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Reset Your Password",
    html: resetPasswordTemplate(resetUrl),
  });
}

function resetPasswordTemplate(resetUrl: string) {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:8px;">
      
      <h2 style="color:#1a1a1a;">Password Reset Request</h2>
      
      <p>You requested to reset your password.</p>
      
      <p>Click the button below to set a new password. This link will expire in 20 minutes.</p>
      
      <div style="text-align:center; margin:30px 0;">
        <a href="${resetUrl}" 
           style="background:#2563eb; color:white; padding:12px 24px; 
                  text-decoration:none; border-radius:6px; font-weight:bold;">
          Reset Password
        </a>
      </div>
      
      <p>If you did not request this, please ignore this email.</p>
      
      <hr style="margin:30px 0;" />
      
      <p style="font-size:12px; color:#666;">
        This is an automated message. Do not reply.
      </p>
    </div>
  </div>
  `;
}