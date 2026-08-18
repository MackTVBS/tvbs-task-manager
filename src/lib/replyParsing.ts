// Pure parsing helpers for turning an inbound email reply into a
// "mark this task complete" decision. Kept dependency-free and framework
// -free so it's easy to unit test in isolation from the actual IMAP
// connection.

const TOKEN_PATTERN = /\[REF-([A-Z0-9]{4,10})\]/i;

export function extractReplyToken(subject: string): string | null {
  const match = subject.match(TOKEN_PATTERN);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Emails clients quote the original message below a reply (and our own
 * assignment email's body literally contains the word "Completed" as an
 * instruction) — so we must only look at the NEW text the person typed,
 * not the quoted original, or every single reply would false-positive.
 * This trims the body at the first sign of quoted content.
 */
export function extractNewReplyText(bodyText: string): string {
  const lines = bodyText.replace(/\r\n/g, "\n").split("\n");
  const quoteStartIndex = lines.findIndex((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(">")) return true;
    // "On Mon, Aug 18, 2026 at 9:03 AM Priya Sharma <priya@x.com> wrote:"
    if (/^On .{0,120}wrote:\s*$/i.test(trimmed)) return true;
    if (/^-{2,}\s*Original Message\s*-{2,}$/i.test(trimmed)) return true;
    if (/^From:\s*.+$/i.test(trimmed) && lines[i + 1]?.startsWith("Sent:"))
      return true;
    return false;
  });

  const newText =
    quoteStartIndex === -1 ? lines : lines.slice(0, quoteStartIndex);
  return newText.join("\n").trim();
}

const COMPLETION_PATTERN = /\b(completed|complete|done|finished)\b/i;
const NEGATION_PATTERN =
  /\b(not|isn't|isnt|hasn't|hasnt|haven't|havent|can't|cant|won't|wont|couldn't|couldnt|unable to)\s+(\w+\s+){0,3}(complete|completed|done|finished)\b/i;

/**
 * Decides whether a reply's new (non-quoted) text should mark a task
 * complete. Deliberately conservative: requires a positive completion
 * word and no nearby negation ("not done yet", "can't complete this").
 */
export function isCompletionReply(newReplyText: string): boolean {
  const text = newReplyText.trim();
  if (!text) return false;
  if (NEGATION_PATTERN.test(text)) return false;
  return COMPLETION_PATTERN.test(text);
}
