import type { APIRoute } from "astro";
import type { EnquiryConfig } from "../lib/enquiry-config";
import { getContactForm, getServices, getSite } from "../lib/content";

// Read by the enquiry Worker at runtime (see src/lib/enquiry-config.ts). Everything here is
// already public on the site, so serving it as a static file is fine.
export const GET: APIRoute = async ({ site: siteUrl }) => {
  const site = await getSite();
  const form = await getContactForm();
  const services = await getServices();
  const origin = (siteUrl ?? new URL("https://www.me-projects.com.au")).origin;
  const clean = (o: string) => o.replace(/\s*\[mock\]/i, "");

  const config: EnquiryConfig = {
    businessName: site.businessName,
    shortName: site.shortName,
    enquiryEmail: site.enquiryEmail,
    email: site.email,
    phone: site.phone,
    siteUrl: origin,
    logoUrl: `${origin}/brand/me-projects-logo.png`,
    abn: site.abn,
    licences: site.licences.map((l) => `${l.authority} ${l.number}`),
    fields: form.fields.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      required: Boolean(f.required),
      ...(f.type === "select"
        ? { options: (f.optionsFrom === "services" ? services.map((s) => s.data.title) : (f.options ?? [])).map(clean) }
        : {}),
      ...(f.type === "file" ? { maxFiles: f.maxFiles ?? 5 } : {}),
    })),
  };

  return new Response(JSON.stringify(config), { headers: { "content-type": "application/json" } });
};
