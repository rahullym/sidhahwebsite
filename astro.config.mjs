// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

/**
 * The GitHub Pages build is a preview only. It is served from a sub-path and
 * must never outrank the real domain, so it gets its own site/base and a
 * noindex flag. Production builds are untouched and still target the root.
 *
 * GitHub Pages is static hosting, so it cannot run the staff dashboard. The
 * preview workflow deletes `src/pages/admin` and the adapter is dropped here,
 * which keeps the preview a pure marketing build with no server routes.
 */
const isPreview = process.env.DEPLOY_TARGET === 'gh-pages';

export default defineConfig({
  site: isPreview ? 'https://rahullym.github.io' : 'https://www.sidhah.com',
  base: isPreview ? '/sidhahwebsite' : undefined,
  // Every marketing page stays prerendered. Only the routes that opt out with
  // `export const prerender = false` — the whole of /admin — run on a server.
  adapter: isPreview ? undefined : vercel(),
  integrations: [sitemap({ filter: (page) => !page.includes("/admin") })],
  vite: {
    plugins: [tailwindcss()],
  },
});
