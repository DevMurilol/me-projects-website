# M.E Projects website

Business website for M.E Projects Pty Ltd (builder, Tugun QLD). Replaces the Squarespace site at me-projects.com.au.

- **Stack:** Astro 7 (static), plain CSS, Newsreader + Archivo variable fonts, Phosphor icons via `astro-icon`.
- **Content:** Markdown/YAML in [`content/`](content/), loaded by content collections ([`src/content.config.ts`](src/content.config.ts)). The client doesn't edit the site; we do.
- **Design system:** [DESIGN.md](DESIGN.md).
- **Placeholders:** anything tagged `[mock]` is invented and shows highlighted on the page. See [MOCKS.md](MOCKS.md).
- **Plan and decisions:** [PLANNING.md](PLANNING.md).

## Commands

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in dist/
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
```

## Not done yet

- Contact form endpoint (Cloudflare + Resend + Turnstile). The form validates but doesn't send.
- Cloudflare Pages deploy, DNS move (keep Google Workspace MX), Search Console.
- Vector logo, project details and locations, Google reviews (see MOCKS.md).
