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

> ⚠️ **Testimonials are invented.** Publishing fake reviews is misleading conduct under Australian Consumer Law. Replace them with Mark's real Google reviews (with permission) or remove the section — never ship them.

## What's still mock

| File | Mock | Waiting on |
|---|---|---|
| `settings/site.yaml` | tagline, QBCC class, working days, consultation price, social links, Google Business Profile URL | Q5, Q18, Q3, Q9, Q26, Q36 |
| `settings/about.yaml` | headline, story, team photos | Call with Mark / photos |
| `settings/contact-form.yaml` | budget ranges | Mark to confirm ranges |
| `services/*.md` | summaries and copy (Home Renovations body is real copy from the current site — mentions kitchens, review) | Copy approval |
| `projects/*.md` (6) | Titles, locations, years, copy: invented jobs matched to the real photos | Q12-16 |
| `testimonials/*.yaml` (5) | **Everything** — never publish | Google reviews (Q22) |
| `faq/faq.yaml` | consultation, timeframes, staying home | Mark to confirm |
| Images | Real client photos (`src/assets/photos/`), but **which photo belongs to which project is invented**. Logo is a typographic placeholder | Photos per job (Q12-17), logo (Q27) |

## Already real (from the briefing)

ABN · QBCC 15139741 · NSW 473008C · fully insured · warranty per QBCC · team (Mark Nelson, Brad Fleischfresser) · differentiator copy · service list & priority · service areas · hours 7:00–4:00 · enquiry email · contact form fields · navy as brand colour · show suburb only.
