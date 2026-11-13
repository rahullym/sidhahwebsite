import type { APIRoute } from 'astro';
import { getCourses, getPosts } from '../lib/server/content';

/** Built on request so new course pages and blog posts are listed as soon as they are published. */
export const GET: APIRoute = async ({ site }) => {
  const [courses, posts] = await Promise.all([getCourses(), getPosts()]);
  const paths = [
    '/', '/courses/', '/placements/', '/campus/', '/about/', '/contact/', '/blog/',
    ...courses.map((c) => `/courses/${c.slug}/`),
    ...posts.map((p) => `/blog/${p.slug}/`),
  ];
  const urls = paths.map((p) => `<url><loc>${new URL(p, site)}</loc></url>`).join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
