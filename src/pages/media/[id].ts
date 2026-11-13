export const prerender = false;

import type { APIRoute } from 'astro';
import { db, one } from '../../lib/server/db';

/**
 * Serves photos uploaded from the dashboard. A media row is never edited —
 * replacing a photo creates a new id — so the response can be cached forever
 * and the database is only read once per photo per CDN region.
 */
export const GET: APIRoute = async ({ params }) => {
  if (!/^\d{1,9}$/.test(params.id ?? '')) return new Response('Not found', { status: 404 });
  const row = await one<{ content_type: string; data: string }>(db`
    select content_type, encode(data, 'base64') as data from media where id = ${Number(params.id)}
  `);
  if (!row) return new Response('Not found', { status: 404 });

  const bytes = Buffer.from(row.data, 'base64');
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': row.content_type,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
