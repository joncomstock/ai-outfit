import { randomBytes } from "crypto";

/**
 * Generates a cryptographically secure share token.
 * Returns a 32-character hex string (16 bytes of entropy).
 */
export function generateShareToken(): string {
  return randomBytes(16).toString("hex");
}
