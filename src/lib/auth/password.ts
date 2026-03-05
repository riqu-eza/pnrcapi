import bcrypt from "bcryptjs";

const saltRounds = 12;
export async function hashPassword(password: string) {
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  hash: string,
  password: string
) {
  return bcrypt.compare(hash, password);
}
