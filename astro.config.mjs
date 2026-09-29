// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

export default defineConfig({
  site: "https://www.me-projects.com.au",
  trailingSlash: "never",
  integrations: [sitemap(), icon()],
  // Redirects from the current Squarespace URLs (PLANNING.md section 7).
  redirects: {
    "/what-we-do": "/services",
    "/gallery": "/projects",
  },
});
