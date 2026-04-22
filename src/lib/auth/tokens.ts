import crypto from "crypto";

/**
 * Generate a cryptographically random URL-safe token.
 * @param bytes - number of random bytes (default 32 → 64-char hex string)
 */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Return a Date that is `hours` hours from now.
 */
export function tokenExpiry(hours = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}