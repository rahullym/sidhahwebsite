import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/server/auth';

const LOGIN = '/admin/login';

/**
 * Single gate in front of the whole dashboard. Every /admin route is protected
 * by default — a new page is safe unless it is explicitly added to PUBLIC.
 */
const PUBLIC = new Set([LOGIN, `${LOGIN}/`]);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  context.locals.user = null;

  if (!path.startsWith('/admin')) return next();

  const user = await getSessionUser(context);
  context.locals.user = user;

  if (!user && !PUBLIC.has(path)) {
    // Remember where they were headed so login can send them back.
    const target = `${context.url.pathname}${context.url.search}`;
    return context.redirect(`${LOGIN}?next=${encodeURIComponent(target)}`);
  }
  if (user && PUBLIC.has(path)) return context.redirect('/admin');

  const response = await next();
  // Staff data must never sit in a shared cache or a back-button snapshot.
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
});
