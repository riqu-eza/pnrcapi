import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { token, newPassword } = await req.json();

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await prisma.appUser.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    return Response.json(
      { message: "Invalid or expired token." },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.appUser.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  });

  return Response.json(
    { message: "Password reset successful." },
    { status: 200 }
  );
}