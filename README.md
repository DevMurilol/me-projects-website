# M.E Projects website

Business website for M.E Projects Pty Ltd (builder, Tugun QLD). Replaces the Squarespace site at me-projects.com.au.

- **Stack:** Astro 7 (static), plain CSS, Newsreader + Archivo variable fonts, Phosphor icons via `astro-icon`.
- **Hosting:** a Cloudflare Worker with Static Assets ([`wrangler.jsonc`](wrangler.jsonc)), deployed by Workers Builds on every push to `main`. The pages are static files; the Worker script ([`worker/`](worker/)) only runs for `/api/*` (the enquiry form).
- **Content:** Markdown/YAML in [`content/`](content/), loaded by content collections ([`src/content.config.ts`](src/content.config.ts)). The client doesn't edit the site; we do.
- **Design system:** [DESIGN.md](DESIGN.md).
- **Content status:** live with confirmed content only; unconfirmed items are left out. `npm run build` blocks placeholder (`[mock]`) content on main. See [MOCKS.md](MOCKS.md).
- **Plan and decisions:** [PLANNING.md](PLANNING.md).

## Commands

```bash
npm install
npm run dev          # http://localhost:4321
npm run dev:worker   # build, then site + Worker on http://localhost:8787 (needed to test the form)
npm run build        # static output in dist/, then the mock guard
npm run check:mocks  # fails while any [mock] content remains (must pass before launch)
```

## Structure

```
content/            services, projects, testimonials, faq, settings (site, about, contact form)
src/assets/photos/  client photography (source files, optimised at build)
src/components/     Header, Footer, SiteBoard, Logo, Button, ProjectCard, PageHead
public/brand/       client logo (used as a CSS mask)
src/layouts/        Base (SEO, schema.org, header, site board, footer)
src/pages/          home, services/[slug], projects/[slug], about, faq, contact, privacy-policy, 404
src/styles/         global.css (tokens + components), motion.css (scroll-driven motion)
scripts/            check-mocks.mjs
worker/             Cloudflare Worker: /api/enquiry (Turnstile + Resend), email templates
wrangler.jsonc      Worker config: name, static assets, run_worker_first, TURNSTILE_HOSTNAMES
```

## Enquiry form

`/contact` posts to `/api/enquiry` ([`worker/index.ts`](worker/index.ts)), which:

1. drops bot submissions (hidden honeypot field) and checks the Turnstile token server-side (action `enquiry`, hostname in `TURNSTILE_HOSTNAMES`);
2. validates against `/enquiry-form.json`, which the build writes from `content/settings/contact-form.yaml` and `site.yaml`, so fields, options and addresses have one source;
3. emails the **lead to `enquiryEmail`** through Resend, with photos/plans attached and reply-to set to the customer;
4. only then emails the **customer a confirmation** (reply-to Mark). If the lead fails, the visitor is told to call or email instead, so no enquiry is lost silently.

Photos over 1.5 MB are resized in the browser (2400px JPEG) before upload. Limits: 5 files, 10 MB each, 20 MB in total.

**Who receives it:** `enquiryEmail` in `content/settings/site.yaml` (any address; commit and push to change it). To use an address that shouldn't appear in the public site files, or to change it without a deploy, add a Worker secret `ENQUIRY_TO`, which overrides `enquiryEmail`. Both emails are *sent from* `email` in `site.yaml`, which must stay on `me-projects.com.au` (the domain verified in Resend).

### Turning it on (one-off)

1. **Resend:** add the domain `me-projects.com.au` and add the DNS records it lists in Cloudflare DNS (DKIM `resend._domainkey` TXT, plus MX and SPF TXT on the `send` subdomain). Leave the root MX records alone: they are Google Workspace. Wait for "Verified".
2. **Resend:** create an API key with *Sending access* for that domain.
3. **Cloudflare > Turnstile:** add a widget (mode *Managed*) for `me-projects.com.au` and `www.me-projects.com.au`. Put the **site key** in `contact-form.yaml` → `turnstileSiteKey` (it's public).
4. **Cloudflare > Workers & Pages > the Worker > Settings > Variables and Secrets:** add two secrets, `RESEND_API_KEY` and `TURNSTILE_SECRET` (the widget's secret key).
5. Check that the Worker's name in the dashboard is `me-projects-website` (the `name` in `wrangler.jsonc`), and that its build uses `npm run build` with deploy command `npx wrangler deploy`.
6. Set `enabled: true` in `contact-form.yaml`, push, and send a real test enquiry. Logs: the Worker's *Observability* tab (look for `[enquiry]`).

The build fails if the form is enabled without a site key. If a secret is missing, the form answers "call or email us" instead of pretending it sent.

### Testing locally

Copy `.env.example` to `.env` and `.dev.vars.example` to `.dev.vars` (both gitignored), fill in a Resend key and set `ENQUIRY_TO` to your own inbox (so test leads don't reach Mark), then `npm run dev:worker` and open http://localhost:8787/contact. Cloudflare's testing keys always pass Turnstile without a challenge; the real widget keys report the hostname `localhost`, which the production allowlist rejects. Emails go out for real from the verified domain. With a Resend account where me-projects.com.au isn't verified, uncomment `RESEND_FROM` (Resend's test sender), which only delivers to that account's login email: use it as both `ENQUIRY_TO` and the customer email.

## Not done yet

- Search Console; SPF/DMARC for me-projects.com.au (Google Workspace + Resend).
- Vector logo, project details and locations, Google reviews (see MOCKS.md).
