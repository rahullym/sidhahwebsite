// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * The GitHub Pages build is a preview only. It is served from a sub-path and
 * must never outrank the real domain, so it gets its own site/base and a
 * noindex flag. Production builds are untouched and still target the root.
 */
const isPreview = process.env.DEPLOY_TARGET === 'gh-pages';

export default defineConfig({
  site: isPreview ? 'https://rahullym.github.io' : 'https://www.sidhah.com',
  base: isPreview ? '/sidhahwebsite' : undefined,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
