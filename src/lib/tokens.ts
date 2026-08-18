import crypto from "crypto";

/**
 * Short, human-typeable-ish token embedded in task assignment email
 * subjects (as "[REF-XXXXXX]") so replies can be matched back to the
 * right task. Uppercase alphanumeric, no ambiguous characters (0/O, 1/I).
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReplyToken(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let token = "";
  for (let i = 0; i < length; i++) {
    token += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return token;
}
