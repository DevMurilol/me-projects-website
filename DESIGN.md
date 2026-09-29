# M.E Projects: design system

**Design read:** multi-page business site for homeowners on the southern Gold Coast and Northern NSW planning extensions and new builds (plus small commercial clients). Craft-led, calm, solid. Goal from the briefing: *bigger jobs, look more professional*.

Competitors (lovebuildhomes.au, burleighconstructions.com.au) use text-only heroes and neutral templates. M.E Projects leads with its own photography and one ownable device: the **site board**.

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

One family: **Archivo** variable (self-hosted via `@fontsource-variable/archivo`, width axis 62-125%).

| Role | Setting |
|---|---|
| Display (h1-h3, phone, numbers) | width 125%, weight ~680, tracking -0.018em, sentence case |
| Labels, buttons, nav | width 112%, weight 600 |
| Body | width 100%, weight 400, 17px / 1.6 |

Scale: 14 / 17 / 21 / 30 / 46 / 68px (fluid with `clamp`). No uppercase labels or eyebrows; the only caps are in the wordmark.

## Shape and layout

- Radius **2px** on anything interactive or boxed; **0** on photographs.
- Photos sit in a `.frame` (mat + hairline + tinted shadow), like a mounted print.
- Container 80rem, gutter `clamp(1rem, 4vw, 2.5rem)`, section spacing `clamp(5rem, 9vw, 8.5rem)`.
- Floating sticky header (64px), blur only there.
- Home uses a different layout family per section: split hero, credentials row, 6-cell bento, before/after feature, offset project trio, statement, numbered process (a real sequence), scroll-snap reviews, site board.

## Motion (`src/styles/motion.css`)

CSS scroll-driven animations only (no JS library). One easing: `cubic-bezier(0.22, 1, 0.36, 1)`.

- Hero: one load-in moment, then recedes over the first 90vh of scroll (opacity to 0.35, scale to 0.96).
- Section blocks with `data-reveal`: rise 32px and fade in by 30% of their journey.
- Only `opacity` and `transform`. Navigation and forms never animate.
- `prefers-reduced-motion: reduce` renders fully static; unsupported browsers just show content.

## Logo

`Wordmark.astro` is a typographic placeholder (M.E with a square full stop, like a set-out peg). Replace with Mark's real logo from the work shirt when supplied (Briefing Q27).

## Pre-flight (last run 2026-09-29)

- Zero em/en dashes in rendered text; no uppercase eyebrows; one accent; one radius system.
- Hero headline 2 lines, CTAs and photo inside a 1440x900 viewport; nav one line, 64px.
- Hit-test on every link/button/input at 1440px and 375px: all reachable.
- No horizontal overflow at 320px and 375px on any page.
- Motion curves sampled with `getComputedStyle` (rAF confirmed live): monotonic, no snap-back.
- Reduced motion: every animated element reads `opacity 1, transform none`.
