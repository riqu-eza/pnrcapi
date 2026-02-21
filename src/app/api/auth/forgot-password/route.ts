import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await prisma.appUser.findUnique({
    where: { email }
  });

  if (!user) {
    return Response.json(
      { message: "If account exists, reset email sent." },
      { status: 200 }
    );
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await prisma.appUser.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 1000 * 60 * 20)
    }
  });

  const resetURL = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  await sendResetEmail(user.email, resetURL);

  return Response.json(
    { message: "If account exists, reset email sent." },
    { status: 200 }
  );
}