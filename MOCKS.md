# Mock content register

`/content` mixes **real data** (current site + client briefing of 2026-09-29, see [docs/02-briefing-answers.md](docs/02-briefing-answers.md)) with **placeholders** for what the client hasn't sent yet.

## Convention

| Case | Flag |
|---|---|
| A value is invented | Ends with **`[mock]`** — shows up on the page on purpose, so nobody mistakes it for real |
| A whole entry is invented (project, testimonial) | `mock: true` **and** `[mock]` on its title/text |

When real data arrives: replace the value and delete the `[mock]` tag (and `mock: true`).

```bash
node scripts/check-mocks.mjs   # exits 1 while any [mock] / mock: true remains — must pass before launch (Phase 6 QA)
```

> **Testimonials are real** Google reviews (supplied 2026-10-01). Text is verbatim; the home page shows a verbatim sentence (`excerpt`). Names are shown as first name + surname initial. Reviews are linked to a service only when the review names that kind of work, never to a specific project.

## What's still mock

| File | Mock | Waiting on |
|---|---|---|
| `settings/site.yaml` | tagline, QBCC class, working days, consultation price, social links | Q5, Q18, Q3, Q9, Q26 |
| `settings/about.yaml` | headline, story, team photos | Call with Mark / photos |
| `settings/contact-form.yaml` | budget ranges | Mark to confirm ranges |
| `services/*.md` | summaries and copy (Home Renovations body is real copy from the current site — mentions kitchens, review) | Copy approval |
| `projects/*.md` (3) | One per real photo set. Titles, **locations**, years and copy are invented; photo captions describe what each photo shows. The courtyard house may be outside the Gold Coast (sandstone, 2016): confirm before giving it a suburb | Q12-16 |
| `faq/faq.yaml` | consultation, timeframes, staying home | Mark to confirm |
| Images | Real client photos, grouped by job from what they show. Service images are illustrative (e.g. New Builds uses a bedroom from the courtyard renovation) | Confirm with Mark |

## Already real (from the briefing)

Logo (PNG) · home intro copy (original site) · 8 Google reviews + Google Maps listing · ABN · QBCC 15139741 · NSW 473008C · fully insured · warranty per QBCC · team (Mark Nelson, Brad Fleischfresser) · differentiator copy · service list & priority · service areas · hours 7:00–4:00 · enquiry email · contact form fields · navy as brand colour · show suburb only.
