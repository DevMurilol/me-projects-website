// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

export default defineConfig({
  site: "https://www.me-projects.com.au",
  trailingSlash: "never",
  integrations: [sitemap(), icon()],
  // 301s from the old Squarespace URLs live in public/_redirects (served by Cloudflare).
});
