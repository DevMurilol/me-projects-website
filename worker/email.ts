import type { EnquiryConfig } from "../src/lib/enquiry-config";

const RESEND_API = "https://api.resend.com/emails";

export interface Attachment {
  filename: string;
  content: string; // base64
}

export interface EmailMessage {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
}

/** Resend over plain fetch (no SDK). Returns the reason on failure instead of throwing. */
export async function sendEmail(
  message: EmailMessage,
  apiKey: string,
  endpoint = RESEND_API,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        reply_to: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.attachments?.length ? { attachments: message.attachments } : {}),
      }),
    });
    if (!response.ok) {
      // Resend explains the problem in the body (unverified domain, bad key...); the status alone isn't actionable.
      return { ok: false, reason: `Resend ${response.status}: ${await response.text().catch(() => "")}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------- Templates

export interface Enquiry {
  /** Answered fields in form order, e.g. [["Name", "Jane Smith"], ...]. Empty optional fields are left out. */
  rows: [label: string, value: string][];
  name: string;
  email: string;
  phone: string;
  suburb: string;
  projectType: string;
  message: string;
  files: string[];
}

const NAVY = "#13243b";
const MUTED = "#5b6472";
const LINE = "#e4e6e2";
const FONT = "Arial, Helvetica, sans-serif";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

function layout(config: EnquiryConfig, body: string, footer: string): string {
  return `<!doctype html>
<html lang="en-AU">
<body style="margin:0;padding:0;background:#f6f6f3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f3;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-top:4px solid ${NAVY};">
        <tr><td style="padding:28px 32px 8px;">
          <img src="${config.logoUrl}" width="150" alt="${escapeHtml(config.shortName)}" style="display:block;border:0;height:auto;">
        </td></tr>
        <tr><td style="padding:16px 32px 32px;font-family:${FONT};font-size:15px;line-height:1.6;color:#1d2633;">
          ${body}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${LINE};font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailsTable(rows: Enquiry["rows"]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 0;">
${rows
  .map(
    ([label, value]) => `<tr>
  <td style="padding:10px 12px 10px 0;border-bottom:1px solid ${LINE};color:${MUTED};font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
  <td style="padding:10px 0;border-bottom:1px solid ${LINE};color:#1d2633;vertical-align:top;white-space:pre-wrap;">${escapeHtml(value)}</td>
</tr>`,
  )
  .join("\n")}
</table>`;
}

const textTable = (rows: Enquiry["rows"]) => rows.map(([label, value]) => `${label}: ${value}`).join("\n");

/** The lead, to the business. Replying answers the customer directly. */
export function leadEmail(config: EnquiryConfig, e: Enquiry, submittedAt: string) {
  const subject = `New enquiry: ${e.projectType} in ${e.suburb} (${e.name})`;
  const telHref = `tel:${e.phone.replace(/[^\d+]/g, "")}`;
  const files = e.files.length
    ? `<p style="margin:20px 0 0;color:${MUTED};font-size:13px;">${e.files.length} file${e.files.length === 1 ? "" : "s"} attached: ${e.files.map(escapeHtml).join(", ")}</p>`
    : "";
  const html = layout(
    config,
    `<h1 style="margin:0 0 4px;font-size:22px;line-height:1.3;color:${NAVY};">New enquiry from ${escapeHtml(e.name)}</h1>
<p style="margin:0 0 16px;color:${MUTED};">${escapeHtml(e.projectType)} in ${escapeHtml(e.suburb)}</p>
<p style="margin:0 0 8px;">
  <a href="${telHref}" style="color:${NAVY};font-weight:bold;">Call ${escapeHtml(e.phone)}</a>
  &nbsp;&middot;&nbsp;
  <a href="mailto:${escapeHtml(e.email)}" style="color:${NAVY};font-weight:bold;">Email ${escapeHtml(firstName(e.name))}</a>
</p>
${detailsTable(e.rows)}
${files}
<p style="margin:20px 0 0;color:${MUTED};font-size:13px;">Reply to this email to answer ${escapeHtml(firstName(e.name))} directly.</p>`,
    `Sent from the enquiry form at ${escapeHtml(config.siteUrl.replace(/^https?:\/\//, ""))} on ${escapeHtml(submittedAt)} (Brisbane time).`,
  );
  const text = [
    `New enquiry from ${e.name}`,
    `${e.projectType} in ${e.suburb}`,
    "",
    textTable(e.rows),
    ...(e.files.length ? ["", `Attached: ${e.files.join(", ")}`] : []),
    "",
    `Reply to this email to answer ${firstName(e.name)} directly.`,
    `Sent from ${config.siteUrl} on ${submittedAt} (Brisbane time).`,
  ].join("\n");
  return { subject, html, text };
}

/** The courtesy copy, to the customer. Promises only what the site already promises. */
export function confirmationEmail(config: EnquiryConfig, e: Enquiry) {
  const subject = `We've received your enquiry | ${config.shortName}`;
  const legal = [config.businessName, `ABN ${config.abn}`, ...config.licences.map((l) => `${l}`)].join(" &middot; ");
  const files = e.files.length
    ? `<p style="margin:16px 0 0;color:${MUTED};font-size:13px;">Files received: ${e.files.map(escapeHtml).join(", ")}</p>`
    : "";
  const html = layout(
    config,
    `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${NAVY};">Thanks, ${escapeHtml(firstName(e.name))}.</h1>
<p style="margin:0 0 12px;">We've received your project details. We'll be in touch to talk it through and arrange a time on site.</p>
<p style="margin:0 0 24px;">If you'd like to talk sooner, call us on <a href="tel:${config.phone.replace(/[^\d+]/g, "")}" style="color:${NAVY};font-weight:bold;">${escapeHtml(config.phone)}</a> or reply to this email.</p>
<p style="margin:0;font-size:13px;font-weight:bold;color:${NAVY};text-transform:uppercase;letter-spacing:0.04em;">Your enquiry</p>
${detailsTable(e.rows)}
${files}`,
    `${legal}<br>
You're receiving this because you sent an enquiry through <a href="${config.siteUrl}" style="color:${MUTED};">${escapeHtml(config.siteUrl.replace(/^https?:\/\//, ""))}</a>.`,
  );
  const text = [
    `Thanks, ${firstName(e.name)}.`,
    "",
    "We've received your project details. We'll be in touch to talk it through and arrange a time on site.",
    `If you'd like to talk sooner, call us on ${config.phone} or reply to this email.`,
    "",
    "Your enquiry",
    textTable(e.rows),
    ...(e.files.length ? ["", `Files received: ${e.files.join(", ")}`] : []),
    "",
    `${config.businessName} · ABN ${config.abn} · ${config.licences.join(" · ")}`,
    config.siteUrl,
  ].join("\n");
  return { subject, html, text };
}
