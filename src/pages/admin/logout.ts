export const prerender = false;

import type { APIRoute } from 'astro';
import { checkCsrf, clearSessionCookie } from '../../lib/server/auth';

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  // Even logout is CSRF-checked: being signed out mid-invoice by a hostile page
  // is a real annoyance, and the check costs nothing.
  if (checkCsrf(context, form.get('csrf'))) clearSessionCookie(context);
  return context.redirect('/admin/login', 303);
};

export const GET: APIRoute = (context) => context.redirect('/admin/login', 303);
