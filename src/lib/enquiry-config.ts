// The contract between the site build and the enquiry Worker (worker/index.ts).
// Astro writes it to /enquiry-form.json from content/settings, so the Worker validates
// against the same fields, options and email addresses the form was built from.

export interface EnquiryField {
  name: string;
  label: string;
  type: "text" | "tel" | "email" | "select" | "file" | "textarea";
  required: boolean;
  options?: string[];
  maxFiles?: number;
}

export interface EnquiryConfig {
  businessName: string;
  shortName: string;
  /** Where leads go (settings/site.yaml -> enquiryEmail). Any address; customers' replies go here too. */
  enquiryEmail: string;
  /** The business address (site.yaml -> email). Must be on the domain verified in Resend: it's the sender
   *  of both emails and the address offered to visitors if the form fails. */
  email: string;
  phone: string;
  siteUrl: string;
  logoUrl: string;
  abn: string;
  licences: string[];
  fields: EnquiryField[];
}

export const ENQUIRY_CONFIG_PATH = "/enquiry-form.json";
export const ENQUIRY_ENDPOINT = "/api/enquiry";
/** Turnstile action for this form. The Worker rejects tokens issued for any other action. */
export const TURNSTILE_ACTION = "enquiry";

// Upload limits. Photos are resized in the browser first, so a phone photo is usually under 1 MB.
// Resend accepts up to 40 MB per email after base64 encoding (+33%), so 20 MB of files fits.
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
