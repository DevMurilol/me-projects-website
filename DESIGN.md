# M.E Projects: design system

**Design read:** multi-page business site for homeowners on the southern Gold Coast and Northern NSW planning extensions and new builds (plus small commercial clients). Craft-led, calm, solid. Goal from the briefing: *bigger jobs, look more professional*.

Competitors (lovebuildhomes.au, burleighconstructions.com.au) use text-only heroes and neutral templates. M.E Projects leads with its own photography (a full-bleed hero, an editorial case study) and one ownable device: the **site board**.

## The one bold element: the site board

Every job has a sign out the front with the builder's name, phone and licence numbers, and QLD law requires the licence number on advertising. The navy `SiteBoard` component (above the footer on every page) is that sign: consultation CTA, phone, email, then a strip with builder, QBCC, NSW licence, ABN and service areas. Everything else stays quiet.

## Tokens (`src/styles/global.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| Workwear navy | `#13243B` | `#EEF1F4` as accent | Brand (the work shirt), headings, primary buttons, site board |
| Deep navy | `#0B1626` | page background | |
| Render white | `#F6F6F3` | | Page background (cool, not cream) |
| Concrete | `#E4E6E2` | `#111F33` | Tinted sections, text tiles, form panel |
| Graphite | `#4A5361` | `#A3AFBF` | Secondary text |

- **One accent:** navy. Photography supplies the warmth (timber, stone). No brass, no orange.
- **Shadows:** tinted navy, never black (`--shadow`).
- **Dark mode:** automatic via `prefers-color-scheme`, same hierarchy.

## Type

Two families, clearly distinct (self-hosted via Fontsource):

| Role | Setting |
|---|---|
| Headlines, statements, quotes (h1, h2, hero, review quotes, step numbers) | **Newsreader** variable, optical size 72, weight ~430, tracking -0.012em, sentence case |
| Sub-headings (h3), phone, licence numbers, the site board | **Archivo** width 125%, weight ~680: the builder's signage voice |
| Labels, buttons, nav | Archivo width 112%, weight 600 |
| Body | Archivo width 100%, weight 400, 17px / 1.6 |

Newsreader was chosen over Cormorant Garamond after rendering both on the hero photo: stronger on the image, lining numerals ("20 years"), reads established rather than fashion. Scale: 14 / 17 / 21 / 30 / 52 / 76px (fluid with `clamp`). No uppercase labels or eyebrows.

## Shape and layout

- Radius **2px** on anything interactive or boxed; **0** on photographs.
- Photos sit in a `.frame` (mat + hairline + tinted shadow), like a mounted print, except full-bleed photography (hero, wide project covers).
- Home hero: full-bleed photo under the floating header, navy scrim (left and bottom on desktop, bottom on phones), copy from the original site.
- Container 80rem, gutter `clamp(1rem, 4vw, 2.5rem)`, section spacing `clamp(5rem, 9vw, 8.5rem)`.
- Floating sticky header (64px), blur only there.
- Home uses a different layout family per section: full-bleed hero, credentials row, 6-cell bento, editorial spread (flagship project), offset project pair, statement, numbered process (a real sequence), scroll-snap reviews, site board.
- Project pages are photo stories: photos 1400px+ wide get a full row, smaller ones are paired (every other pair offset), a leftover sits offset. Layout adapts automatically as better photos arrive.

## Motion (`src/styles/motion.css`)

No animation library. One easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Everything is progressive: unsupported browsers and `prefers-reduced-motion: reduce` get the static page.

| Layer | How | Where |
|---|---|---|
| Page transitions | Native cross-document View Transitions (`@view-transition`), still a static MPA. Page cross-fades and rises 16px; the header (`site-header`) stays put | Every navigation |
| Shared-photo morph | `view-transition-name: p-<project>` / `s-<service>` + `view-transition-class: photo` (keeps the crop) | Project card → project cover; service tile → service hero |
| Hero load-in | Headline words rise out of a mask, 45ms apart (`.split-word`, descender room kept); then text and buttons | Home |
| Hero recede | Scroll-driven: copy to opacity 0.35 / scale 0.96, photo drifts 18vh slower than the page | Home |
| Section reveal | `data-reveal`: rise 32px + fade, done by 30% of the journey | Section blocks |
| Grid stagger | `data-reveal-item` + `--i`: each item's scroll range starts a little later (position, not time) | Bento cells, project cards |
| Photo settle | `.settle`: image `scale` 1.12 → 1 across the viewport. Uses the `scale` property so hover zoom (`transform`) still works | Bento, cards, spread, project photo story |
| Filter | Same-document `startViewTransition`: cards glide to new places | /projects chips |
| Lightbox | `@starting-style` + `allow-discrete`: fade and scale in and out; photos fade up on next/previous | Project photo story |
| FAQ | Answer fades in when opened | /faq |
| Buttons | Icon cell lifts and grows (translate + scale 1.06), arrow nudges inside it | All CTAs |

Rules kept: only `opacity` and `transform`/`scale`; navigation and forms never animate; one moving thing per moment; `view-transition-name` unique per page (checked on every page).

## Logo

Real client logo (`public/brand/me-projects-logo.png`, from `client-images/ME-Projects_logo.png`), rendered by `Logo.astro` as a CSS mask so it takes the text colour: navy in the header, white on the site board and in dark mode. Edges look upscaled; ask Mark for a vector (SVG/PDF) before large print use.

## Pre-flight (last run 2026-09-29, after the photo and type update)

- Zero em/en dashes in rendered text; no uppercase eyebrows; one accent; one radius system.
- Hero headline 3 balanced lines (client's original copy), CTAs inside a 1440x900 viewport; nav one line, 64px.
- Hit-test on every link/button/input at 1440px and 375px: all reachable.
- No horizontal overflow at 320px and 375px on any page.
- Motion curves sampled with `getComputedStyle` (rAF confirmed live): monotonic, no snap-back.
- View Transitions: `pagereveal` reports a running transition that finishes without error (card → project, service → page); none under reduced motion; no duplicate `view-transition-name` on any page.
- Reduced motion: every animated element reads `opacity 1, transform none`.
