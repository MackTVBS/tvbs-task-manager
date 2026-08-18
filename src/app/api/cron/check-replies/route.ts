import { NextRequest, NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTaskByReplyToken } from "@/lib/db/queries";
import {
  extractReplyToken,
  extractNewReplyText,
  isCompletionReply,
} from "@/lib/replyParsing";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("x-cron-secret");
  const query = request.nextUrl.searchParams.get("secret");
  return header === secret || query === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return NextResponse.json(
      { error: "GMAIL_USER / GMAIL_APP_PASSWORD not configured" },
      { status: 200 }
    );
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const results: {
    uid: number;
    from: string | null;
    token: string | null;
    outcome: string;
  }[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      for await (const msg of client.fetch(
        { seen: false, since: twoWeeksAgo },
        { envelope: true, source: true, uid: true }
      )) {
        const subject = msg.envelope?.subject || "";
        const fromAddress = msg.envelope?.from?.[0]?.address || null;
        const token = extractReplyToken(subject);

        if (!token) {
          // Not one of our task emails — leave it completely untouched.
          continue;
        }

        const task = await getTaskByReplyToken(token);
        if (!task) {
          results.push({
            uid: msg.uid,
            from: fromAddress,
            token,
            outcome: "no-matching-task",
          });
          await client.messageFlagsAdd([msg.uid], ["\\Seen"], { uid: true });
          continue;
        }

        const senderMatches =
          !!fromAddress &&
          !!task.assigneeEmail &&
          fromAddress.toLowerCase() === task.assigneeEmail.toLowerCase();

        if (!senderMatches) {
          results.push({
            uid: msg.uid,
            from: fromAddress,
            token,
            outcome: "sender-mismatch",
          });
          await client.messageFlagsAdd([msg.uid], ["\\Seen"], { uid: true });
          continue;
        }

        let bodyText = "";
        if (msg.source) {
          const parsed = await simpleParser(msg.source);
          bodyText = parsed.text || "";
        }
        const newText = extractNewReplyText(bodyText);
        const now = new Date().toISOString();

        if (task.status === "COMPLETED") {
          results.push({
            uid: msg.uid,
            from: fromAddress,
            token,
            outcome: "already-completed",
          });
        } else if (isCompletionReply(newText)) {
          await db
            .update(tasks)
            .set({
              status: "COMPLETED",
              completedAt: now,
              repliedAt: now,
              updatedAt: now,
            })
            .where(eq(tasks.id, task.id));
          results.push({
            uid: msg.uid,
            from: fromAddress,
            token,
            outcome: "marked-completed",
          });
        } else {
          await db
            .update(tasks)
            .set({ repliedAt: now })
            .where(eq(tasks.id, task.id));
          results.push({
            uid: msg.uid,
            from: fromAddress,
            token,
            outcome: "replied-not-completion",
          });
        }

        await client.messageFlagsAdd([msg.uid], ["\\Seen"], { uid: true });
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    try {
      await client.logout();
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: "IMAP check failed", detail: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({ checked: results.length, results });
}
