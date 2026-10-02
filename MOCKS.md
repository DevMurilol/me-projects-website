# Content status

**Launch-safe since 2026-10-02.** The site went live early so M.E Projects stays online after the Squarespace subscription ends. Everything on the site is either confirmed by the client or a neutral description of what the photos show. Anything not yet confirmed is **left out, not invented**.

Sources: the original Squarespace site, the client briefing of 2026-09-29 ([docs/02-briefing-answers.md](docs/02-briefing-answers.md)), client photos, the logo file and the Google reviews supplied on 2026-10-01.

## The mock guard

`npm run build` runs `scripts/check-mocks.mjs` after `astro build`. It fails the build if it finds:

- a value tagged `[mock]` or an entry with `mock: true` in `/content`;
- a mock marker in any built page in `dist/` (catches `[mock]` typed straight into a template).

On Cloudflare **preview branches** (`CF_PAGES_BRANCH` is not `main`) it only warns, so placeholders can be reviewed on a preview URL. On **main** (production) the deploy fails instead of publishing placeholder content.

To try new content before it's confirmed: work on a branch, tag the value with `[mock]` (it shows highlighted on the preview), and remove the tag before merging.

## Left out until confirmed

| What | Where it goes | Waiting on |
|---|---|---|
| Working days (only "7:00am - 4:00pm" is shown) | `settings/site.yaml` → `hours[].days` | Q3 |
| QBCC licence class | `settings/site.yaml` → `licences[0].class` | Q18 |
| Consultation price | `settings/site.yaml` → `consultation.price` | Q9 |
| Facebook / Instagram links | `settings/site.yaml` → `social` | Q26 |
| Mark's own story for the About page | `settings/about.yaml` → `story` | Call with Mark |
| Team photos | `settings/about.yaml` → `team[].photo` | Photos |
| Project suburbs and years | `projects/*.md` → `location`, `date` | Q12-16. The courtyard house may be outside the Gold Coast (sandstone walls, 2016 photos) |
| More projects and photos per job | `projects/` | Photos (Q12-17) |
| FAQ: typical timeframes, staying home during works | `faq/faq.yaml` | Mark to confirm |
| Online enquiry form | `settings/contact-form.yaml` → `enabled: true` once the endpoint (Cloudflare + Resend + Turnstile) is connected. Until then /contact shows phone + a pre-filled email | Dev work |

## Written by us, to review with Mark

These are not invented facts, but they are our wording and should get his OK:

- **Service descriptions** (`services/*.md`): kept modest, no capabilities he hasn't confirmed. Home Renovations is the original site copy with "kitchen revamp" and "outdoor living area" swapped for "a new bathroom, an extension" (he no longer wants kitchen or outdoor-living work, Q8).
- **Project descriptions** (`projects/*.md`): describe only what the photos show. No client story, suburb or year.
- **Service photos** are illustrative (e.g. New Builds uses the main bedroom from the courtyard renovation; Decks uses the courtyard).
- **About values** are condensed from his own answer to Q5.
- **Privacy policy**: standard wording for enquiries by phone and email; update when the form goes live.

## Already real

Logo (PNG) · home intro and tagline (original site) · 8 Google reviews (verbatim; first name + initial) + Google Maps listing · ABN · QBCC 15139741 · NSW 473008C · fully insured · warranty per QBCC · team (Mark Nelson, Brad Fleischfresser) · differentiator copy (Q5) · service list and priority · service areas · hours 7:00-4:00 · enquiry email · enquiry fields · navy as brand colour · suburb only (no street address shown).
