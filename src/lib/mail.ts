import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;
let warnedNoConfig = false;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    if (!warnedNoConfig) {
      console.warn(
        "[mail] GMAIL_USER / GMAIL_APP_PASSWORD are not set. Emails will be logged to the console instead of sent."
      );
      warnedNoConfig = true;
    }
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const t = getTransporter();
  const from = process.env.GMAIL_USER
    ? `TVBS Task Manager <${process.env.GMAIL_USER}>`
    : "TVBS Task Manager <no-reply@tvbs.local>";

  if (!t) {
    console.log("----- [mail:not-sent] -----");
    console.log("To:", opts.to);
    console.log("Subject:", opts.subject);
    console.log(opts.text || opts.html.replace(/<[^>]+>/g, " "));
    console.log("----------------------------");
    return { sent: false as const };
  }

  try {
    await t.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { sent: true as const };
  } catch (err) {
    console.error("[mail] Failed to send email:", err);
    return { sent: false as const, error: String(err) };
  }
}

function wrapEmail(title: string, bodyHtml: string) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <div style="background:#0f172a; padding:20px 24px; border-radius:8px 8px 0 0;">
      <h1 style="color:#fff; font-size:18px; margin:0;">TVBS Task Manager</h1>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:none; padding:24px; border-radius:0 0 8px 8px;">
      <h2 style="font-size:16px; margin-top:0;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:24px; font-size:12px; color:#6b7280;">
        This is an automated message from TVBS's internal task manager.
      </p>
    </div>
  </div>`;
}

export async function sendTaskAssignedEmail(params: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  taskDescription: string | null;
  clientName: string;
  dueDate: string;
  dueTime?: string | null;
  priority: string;
  appUrl: string;
  taskId: number;
  replyToken?: string | null;
}) {
  const replyHint = params.replyToken
    ? `<p style="background:#f1f5f9; border-radius:6px; padding:10px 12px; font-size:13px; color:#334155;">
         Tip: you can also just <strong>reply to this email with "Completed"</strong> once you're done — no need to log in.
       </p>`
    : "";

  const html = wrapEmail(
    "New task assigned to you",
    `
      <p>Hi ${escapeHtml(params.assigneeName)},</p>
      <p>You've been assigned a new task for <strong>${escapeHtml(
        params.clientName
      )}</strong>:</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:6px 0; color:#6b7280; width:120px;">Task</td><td style="padding:6px 0;"><strong>${escapeHtml(
          params.taskTitle
        )}</strong></td></tr>
        ${
          params.taskDescription
            ? `<tr><td style="padding:6px 0; color:#6b7280;">Details</td><td style="padding:6px 0;">${escapeHtml(
                params.taskDescription
              )}</td></tr>`
            : ""
        }
        <tr><td style="padding:6px 0; color:#6b7280;">Due date</td><td style="padding:6px 0;">${escapeHtml(
          params.dueDate
        )}${
      params.dueTime
        ? ` at ${escapeHtml(formatTime12h(params.dueTime))}`
        : ""
    }</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280;">Priority</td><td style="padding:6px 0;">${escapeHtml(
          params.priority
        )}</td></tr>
      </table>
      <p><a href="${params.appUrl}/tasks/${params.taskId}" style="background:#0f172a; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none; display:inline-block;">View task</a></p>
      ${replyHint}
    `
  );

  const subjectSuffix = params.replyToken ? ` [REF-${params.replyToken}]` : "";

  return sendMail({
    to: params.to,
    subject: `New task assigned: ${params.taskTitle} (${params.clientName})${subjectSuffix}`,
    html,
  });
}

export async function sendTaskReminderEmail(params: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  clientName: string;
  dueDate: string;
  status: "overdue" | "due-today" | "due-soon";
  appUrl: string;
  taskId: number;
}) {
  const statusLabel =
    params.status === "overdue"
      ? "OVERDUE"
      : params.status === "due-today"
      ? "Due today"
      : "Due soon";

  const html = wrapEmail(
    `Reminder: ${statusLabel} — ${params.taskTitle}`,
    `
      <p>Hi ${escapeHtml(params.assigneeName)},</p>
      <p>This is a reminder about a task for <strong>${escapeHtml(
        params.clientName
      )}</strong> that is <strong>${statusLabel.toLowerCase()}</strong>:</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:6px 0; color:#6b7280; width:120px;">Task</td><td style="padding:6px 0;"><strong>${escapeHtml(
          params.taskTitle
        )}</strong></td></tr>
        <tr><td style="padding:6px 0; color:#6b7280;">Due date</td><td style="padding:6px 0;">${escapeHtml(
          params.dueDate
        )}</td></tr>
      </table>
      <p><a href="${params.appUrl}/tasks/${params.taskId}" style="background:#0f172a; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none; display:inline-block;">View task</a></p>
    `
  );

  return sendMail({
    to: params.to,
    subject: `[${statusLabel}] ${params.taskTitle} — ${params.clientName}`,
    html,
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  tempPassword: string;
  appUrl: string;
}) {
  const html = wrapEmail(
    "Welcome to the TVBS Task Manager",
    `
      <p>Hi ${escapeHtml(params.name)},</p>
      <p>An account has been created for you on the TVBS task manager. You'll receive an email whenever a task is assigned to you, with the details and due date.</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:6px 0; color:#6b7280; width:120px;">Login email</td><td style="padding:6px 0;">${escapeHtml(
          params.to
        )}</td></tr>
        <tr><td style="padding:6px 0; color:#6b7280;">Temp password</td><td style="padding:6px 0;"><code>${escapeHtml(
          params.tempPassword
        )}</code></td></tr>
      </table>
      <p><a href="${params.appUrl}/login" style="background:#0f172a; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none; display:inline-block;">Log in</a></p>
      <p style="font-size:13px; color:#6b7280;">Please log in and change your password.</p>
    `
  );

  return sendMail({
    to: params.to,
    subject: "Your TVBS Task Manager account",
    html,
  });
}

function formatTime12h(hhmm: string) {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
