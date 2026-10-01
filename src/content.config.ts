import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Content lives in /content (see MOCKS.md). Values ending in "[mock]" are placeholders.

const services = defineCollection({
  loader: glob({ pattern: "*.md", base: "./content/services" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      image: image(),
      order: z.number(),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      service: reference("services"),
      location: z.string(),
      date: z.coerce.date(),
      summary: z.string(),
      coverImage: image(),
      // Room captions describe what each photo shows (real); the project details may be [mock].
      gallery: z.array(z.object({ image: image(), caption: z.string().optional() })).default([]),
      beforeImage: image().optional(),
      afterImage: image().optional(),
      featured: z.boolean().default(false),
      mock: z.boolean().default(false),
    }),
});

// Real Google reviews. `text` is verbatim; `excerpt` is a verbatim sentence from it for tight spaces.
// Linked to a service (never to a specific project) only when the review names that kind of work.
const testimonials = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./content/testimonials" }),
  schema: z.object({
    name: z.string(),
    rating: z.number().min(1).max(5).default(5),
    source: z.enum(["google"]).default("google"),
    year: z.string().optional(),
    service: reference("services").optional(),
    featured: z.boolean().default(true),
    order: z.number().default(99),
    excerpt: z.string(),
    text: z.string(),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./content/faq" }),
  schema: z.object({
    items: z.array(z.object({ question: z.string(), answer: z.string() })),
  }),
});

// settings/site.yaml, settings/about.yaml, settings/contact-form.yaml -> one entry each.
const settings = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./content/settings" }),
  schema: z.looseObject({}),
});

export const collections = { services, projects, testimonials, faq, settings };
