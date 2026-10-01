import { getCollection, getEntry, type CollectionEntry } from "astro:content";

export interface SiteSettings {
  businessName: string;
  shortName: string;
  tagline: string;
  experience: string;
  intro: { heading: string; text: string };
  abn: string;
  licences: { authority: string; number: string; class?: string }[];
  insurance: string;
  warranty: string;
  contactName: string;
  phone: string;
  phoneHref: string;
  email: string;
  enquiryEmail: string;
  preferredContact: string[];
  address: { street: string; suburb: string; state: string; postcode: string; showStreet: boolean };
  hours: { days: string; time: string }[];
  serviceAreas: string[];
  consultation: { paid: boolean; summary: string; price: string };
  social: Record<string, string>;
  googleBusinessProfile: string;
}

export interface AboutSettings {
  headline: string;
  intro: string;
  approach: string;
  story: string;
  values: { title: string; text: string }[];
  team: { name: string; role: string; photo: string }[];
  credentials: { label: string; value: string }[];
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "tel" | "email" | "select" | "file" | "textarea";
  required: boolean;
  options?: string[];
  optionsFrom?: "services";
  accept?: string;
  maxFiles?: number;
}

async function settings<T>(id: string): Promise<T> {
  const entry = await getEntry("settings", id);
  if (!entry) throw new Error(`Missing content/settings/${id}.yaml`);
  return entry.data as T;
}

export const getSite = () => settings<SiteSettings>("site");
export const getAbout = () => settings<AboutSettings>("about");
export const getContactForm = () => settings<{ fields: FormField[] }>("contact-form");

export async function getServices() {
  const all = await getCollection("services");
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getProjects() {
  const all = await getCollection("projects");
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getFaq() {
  const entry = await getEntry("faq", "faq");
  return entry?.data.items ?? [];
}

export async function getTestimonials() {
  const all = await getCollection("testimonials");
  return all.sort((a, b) => a.data.order - b.data.order);
}

export type Service = CollectionEntry<"services">;
export type Project = CollectionEntry<"projects">;

/** True when a value is still a placeholder. */
export const isMock = (value?: string) => !value || /\[mock\]/i.test(value);

/** Strip the [mock] tag, for places where markup is not allowed (meta tags, alt text). */
export const plain = (value = "") => value.replace(/\s*\[mock\]/gi, "").trim();

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escape text and highlight [mock] tags so placeholders are obvious on the page. */
export const mock = (value = "") =>
  escape(value).replace(/\[mock\]/gi, '<mark class="mock" title="Placeholder - see MOCKS.md">mock</mark>');

export const year = (d: Date) => d.getFullYear();

export const serviceAreaSentence = (areas: string[]) =>
  areas.length > 1 ? `${areas.slice(0, -1).join(", ")} and ${areas.at(-1)}` : (areas[0] ?? "");
