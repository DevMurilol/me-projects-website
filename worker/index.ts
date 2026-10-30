// Cloudflare Worker for www.me-projects.com.au.
// The site itself is static (Astro -> dist/, served straight from Workers Static Assets). This
// script only runs for /api/* (see run_worker_first in wrangler.jsonc): the enquiry form posts to
// /api/enquiry, which checks Turnstile, emails the lead to the business through Resend with any
// photos or plans attached, then emails the customer a confirmation.

import {
  ENQUIRY_CONFIG_PATH,
  ENQUIRY_ENDPOINT,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  TURNSTILE_ACTION,
  type EnquiryConfig,
  type EnquiryField,
} from "../src/lib/enquiry-config";
import { confirmationEmail, leadEmail, sendEmail, type Attachment, type Enquiry } from "./email";
import { verifyTurnstile } from "./turnstile";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Secret. Resend API key with sending access for me-projects.com.au. */
  RESEND_API_KEY?: string;
  /** Secret. The Turnstile widget's secret key. */
  TURNSTILE_SECRET?: string;
  /** Comma-separated hostnames the form may be submitted from (wrangler.jsonc vars). */
  TURNSTILE_HOSTNAMES?: string;
  /** Optional. Overrides site.yaml enquiryEmail without a deploy (e.g. a private address), as a Worker secret. */
  ENQUIRY_TO?: string;
  // Local testing only (.dev.vars). Never set these on the production Worker.
  RESEND_FROM?: string;
  RESEND_ENDPOINT?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === ENQUIRY_ENDPOINT) return handleEnquiry(request, env);
    return env.ASSETS.fetch(request);
  },
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });

let configPromise: Promise<EnquiryConfig> | undefined;

/** Fields, options and addresses come from the same build as the form (src/pages/enquiry-form.json.ts). */
function loadConfig(request: Request, env: Env): Promise<EnquiryConfig> {
  configPromise ??= env.ASSETS.fetch(new Request(new URL(ENQUIRY_CONFIG_PATH, request.url))).then((r) => {
    if (!r.ok) throw new Error(`${ENQUIRY_CONFIG_PATH} answered ${r.status}`);
    return r.json() as Promise<EnquiryConfig>;
  });
  configPromise.catch(() => (configPromise = undefined));
  return configPromise;
}

async function handleEnquiry(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, { allow: "POST" });

  let config: EnquiryConfig;
  try {
    config = await loadConfig(request, env);
  } catch (error) {
    console.error("[enquiry] Could not load the form config:", error);
    return json({ ok: false, error: "Our online form isn't available right now. Please call or email us." }, 503);
  }
  const contactInstead = `Please call ${config.phone} or email ${config.email}`;

  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET) {
    console.error("[enquiry] RESEND_API_KEY or TURNSTILE_SECRET is not set. Nothing was sent.");
    return json({ ok: false, error: `Our online form isn't available right now. ${contactInstead}.` }, 503);
  }

  // Reject oversized uploads before reading them into memory (+1 MB for the text fields).
  if (Number(request.headers.get("content-length") ?? 0) > MAX_TOTAL_BYTES + 1024 * 1024) {
    return json({ ok: false, error: `Your files are too large to send. Keep them under 20 MB in total, or email them to ${config.email}.` }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "We couldn't read the form. Please try again." }, 400);
  }

  // Honeypot: hidden from people, so a value means a bot. Report success anyway, so it learns
  // nothing, and check it before Turnstile so bot traffic costs no siteverify call.
  if (String(form.get("company") ?? "").trim()) return json({ ok: true, confirmationSent: true });

  const verified = await verifyTurnstile({
    token: form.get("cf-turnstile-response"),
    secret: env.TURNSTILE_SECRET,
    remoteIp: request.headers.get("cf-connecting-ip"),
    action: TURNSTILE_ACTION,
    hostnames: new Set((env.TURNSTILE_HOSTNAMES ?? "").split(",").map((h) => h.trim()).filter(Boolean)),
  });
  if (!verified) {
    return json({ ok: false, error: "We couldn't confirm the form was sent by a person. Please try again." }, 403);
  }

  const { values, files, errors } = validate(form, config.fields);
  if (errors) return json({ ok: false, error: "Please check the highlighted fields.", fields: errors }, 422);

  const attachments: Attachment[] = await Promise.all(
    files.map(async (file, i) => ({ filename: safeFilename(file.name, i), content: toBase64(await file.arrayBuffer()) })),
  );
  const enquiry: Enquiry = {
    rows: config.fields.filter((f) => f.type !== "file" && values[f.name]).map((f) => [f.label, values[f.name]]),
    name: values.name ?? "Website visitor",
    email: values.email ?? "",
    phone: values.phone ?? "",
    suburb: values.suburb ?? "your area",
    projectType: values.projectType ?? "Project",
    message: values.message ?? "",
    files: attachments.map((a) => a.filename),
  };
  const submittedAt = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    dateStyle: "medium",
    timeStyle: "short",
  });
  // Sent from the business address (on the Resend-verified domain), whatever enquiryEmail is.
  const sender = (label: string) => env.RESEND_FROM ?? `${label} <${config.email}>`;

  // 1. The lead. Without it the enquiry is lost, so a failure here is reported to the visitor.
  const lead = await sendEmail(
    {
      from: sender(`${config.shortName} Website`),
      to: env.ENQUIRY_TO ?? config.enquiryEmail,
      replyTo: enquiry.email || config.email,
      ...leadEmail(config, enquiry, submittedAt),
      attachments,
    },
    env.RESEND_API_KEY,
    env.RESEND_ENDPOINT,
  );
  if (!lead.ok) {
    console.error("[enquiry] Lead email failed:", lead.reason);
    return json({ ok: false, error: `We couldn't send your enquiry just now. ${contactInstead}.` }, 502);
  }

  // 2. The customer's copy. Only sent once the lead is safe, and a failure doesn't undo the enquiry.
  let confirmationSent = false;
  if (enquiry.email) {
    const confirmation = await sendEmail(
      { from: sender(config.shortName), to: enquiry.email, replyTo: config.enquiryEmail, ...confirmationEmail(config, enquiry) },
      env.RESEND_API_KEY,
      env.RESEND_ENDPOINT,
    );
    confirmationSent = confirmation.ok;
    if (!confirmation.ok) console.error("[enquiry] Confirmation email failed:", confirmation.reason);
  }

  return json({ ok: true, confirmationSent });
}

// ---------- Validation (mirrors the checks in src/pages/contact.astro)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LENGTH: Record<EnquiryField["type"], number> = {
  text: 120,
  tel: 30,
  email: 254,
  select: 120,
  textarea: 5000,
  file: 0,
};
const ALLOWED_FILE = /\.(jpe?g|png|webp|gif|heic|heif|pdf)$/i;

function validate(form: FormData, fields: EnquiryField[]) {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  let files: File[] = [];

  for (const field of fields) {
    if (field.type === "file") {
      files = form.getAll(field.name).filter((v): v is File => typeof v !== "string" && v.size > 0);
      const max = field.maxFiles ?? 5;
      const total = files.reduce((sum, f) => sum + f.size, 0);
      if (field.required && files.length === 0) errors[field.name] = "Add at least one photo or plan.";
      else if (files.length > max) errors[field.name] = `Choose up to ${max} files.`;
      else if (files.some((f) => !(f.type.startsWith("image/") || f.type === "application/pdf" || ALLOWED_FILE.test(f.name))))
        errors[field.name] = "Photos and PDF plans only.";
      else if (files.some((f) => f.size > MAX_FILE_BYTES)) errors[field.name] = "Each file must be under 10 MB.";
      else if (total > MAX_TOTAL_BYTES) errors[field.name] = "Files must be under 20 MB in total.";
      continue;
    }

    const raw = form.get(field.name);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (field.required) errors[field.name] = "This field is required.";
      continue;
    }
    if (value.length > MAX_LENGTH[field.type]) errors[field.name] = `Keep this under ${MAX_LENGTH[field.type]} characters.`;
    else if (field.type === "email" && !EMAIL.test(value)) errors[field.name] = "Enter an email address like name@example.com.";
    else if (field.type === "tel" && (/[^\d\s()+-]/.test(value) || value.replace(/\D/g, "").length < 8))
      errors[field.name] = "Enter a phone number we can call.";
    else if (field.type === "select" && !field.options?.includes(value)) errors[field.name] = "Choose one of the options.";
    else values[field.name] = value;
  }

  return { values, files, errors: Object.keys(errors).length ? errors : null };
}

function safeFilename(name: string, index: number): string {
  const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim().slice(-100);
  return clean || `attachment-${index + 1}`;
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
