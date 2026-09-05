export const prerender = false;

import type { APIRoute } from 'astro';
import { getInvoice } from '../../../lib/server/invoices';
import { pdfFilename, renderInvoicePdf } from '../../../lib/server/pdf';

/**
 * The PDF is rebuilt from the stored record on every request rather than saved
 * to a bucket: there is no file to lose, no storage bill, and re-downloading an
 * invoice from 2024 works exactly like downloading one from this morning.
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  // Belt and braces — middleware already gated /admin, but this route hands out
  // student contact details, so it re-checks rather than assuming.
  if (!locals.user) return new Response('Unauthorised', { status: 401 });

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return new Response('Not found', { status: 404 });

  const invoice = await getInvoice(id);
  if (!invoice) return new Response('Not found', { status: 404 });

  const pdf = await renderInvoicePdf(invoice);
  const download = url.searchParams.has('download');

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.byteLength),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${pdfFilename(invoice)}"`,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
};
