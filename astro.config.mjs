// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.sidhah.com',
  // Pages render on request because courses, placements, photos and the blog
  // are edited from the dashboard. Middleware sets a short CDN cache on public
  // pages, so an edit shows within a minute without a redeploy.
  output: 'server',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
