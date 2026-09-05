import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import interRegular from '../../assets/fonts/Inter-Regular.subset.ttf?inline';
import interBold from '../../assets/fonts/Inter-Bold.subset.ttf?inline';
import logoPng from '../../assets/logos/sidhah-logo-pdf.png?inline';
import { contact, site } from '../../data/site';
import { amountInWords, formatAmount, formatDate, formatPhone, printable } from '../format';
import type { Invoice } from './invoices';

/**
 * Assets are inlined as data URIs at build time rather than read from disk at
 * request time: a serverless function has no reliable working directory, and
 * this way dev and production load byte-identical files.
 */
function bytes(dataUri: string): Uint8Array {
  return Uint8Array.from(Buffer.from(dataUri.slice(dataUri.indexOf(',') + 1), 'base64'));
}

/* A4 in points, and the brand palette lifted from src/styles/global.css. */
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INDIGO = rgb(0x20 / 255, 0x20 / 255, 0xb0 / 255); // brand-800
const AZURE = rgb(0x0d / 255, 0x4c / 255, 0xeb / 255); // brand-600
const INK = rgb(0x1f / 255, 0x24 / 255, 0x50 / 255); // ink-800
const INK_SOFT = rgb(0x63 / 255, 0x6d / 255, 0x9c / 255); // ink-400
const RULE = rgb(0xcb / 255, 0xd0 / 255, 0xea / 255); // ink-200
const TINT = rgb(0xef / 255, 0xf2 / 255, 1); // brand-50
const WHITE = rgb(1, 1, 1);

interface Ctx {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; align?: 'left' | 'right' } = {},
) {
  const size = opts.size ?? 9.5;
  const font = opts.bold ? ctx.bold : ctx.regular;
  const width = font.widthOfTextAtSize(value, size);
  ctx.page.drawText(value, {
    x: opts.align === 'right' ? x - width : x,
    y,
    size,
    font,
    color: opts.color ?? INK,
  });
  return width;
}

/** Greedy wrap. Returns the y position below the last line drawn. */
function wrapped(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; leading?: number } = {},
): number {
  const size = opts.size ?? 9.5;
  const leading = opts.leading ?? size * 1.45;
  const font = opts.bold ? ctx.bold : ctx.regular;
  let line = '';
  let cursor = y;

  const flush = () => {
    if (!line) return;
    text(ctx, line, x, cursor, opts);
    cursor -= leading;
    line = '';
  };

  for (const word of value.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      flush();
      line = word;
    } else {
      line = candidate;
    }
  }
  flush();
  return cursor;
}

/**
 * Last-ditch guard. `validateInvoice` already rejects unprintable characters at
 * the form, so this only catches rows written before that rule existed — better
 * a slightly shortened name than a page of tofu boxes.
 */
function drawable(value: string): string {
  return [...value].filter((ch) => printable(ch)).join('').replace(/\s+/g, ' ').trim();
}

export async function renderInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const regular = await doc.embedFont(bytes(interRegular), { subset: false });
  const bold = await doc.embedFont(bytes(interBold), { subset: false });
  const logo = await doc.embedPng(bytes(logoPng));

  const page = doc.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = { page, regular, bold };
  const clean = (v: string | null | undefined) => drawable(v ?? '');

  doc.setTitle(`Invoice ${invoice.invoice_no} — ${site.legalName}`);
  doc.setAuthor(site.legalName);
  doc.setSubject(`${invoice.course_name} — ${invoice.student_name}`);
  doc.setCreator(site.legalName);
  doc.setProducer(site.legalName);

  /* ---------------------------------------------------------- header band */
  // A full-bleed indigo band anchors the page and keeps the logo off white
  // paper, which is what separates this from a printed web page.
  page.drawRectangle({ x: 0, y: PAGE_H - 132, width: PAGE_W, height: 132, color: INDIGO });
  page.drawRectangle({ x: 0, y: PAGE_H - 136, width: PAGE_W, height: 4, color: rgb(0xf0 / 255, 0xb3 / 255, 0x23 / 255) });

  // The logo artwork is indigo-on-transparent, so it needs a white plate to sit on.
  const logoW = 150;
  const logoH = (logo.height / logo.width) * logoW;
  page.drawRectangle({
    x: MARGIN - 10,
    y: PAGE_H - 68 - logoH / 2 - 10,
    width: logoW + 20,
    height: logoH + 20,
    color: WHITE,
    opacity: 0.97,
  });
  page.drawImage(logo, { x: MARGIN, y: PAGE_H - 68 - logoH / 2, width: logoW, height: logoH });

  const right = PAGE_W - MARGIN;
  text(ctx, 'INVOICE', right, PAGE_H - 56, { size: 26, bold: true, color: WHITE, align: 'right' });
  text(ctx, invoice.invoice_no, right, PAGE_H - 76, { size: 11, bold: true, color: rgb(0.85, 0.88, 1), align: 'right' });
  text(ctx, formatDate(invoice.invoice_date), right, PAGE_H - 92, { size: 9.5, color: rgb(0.78, 0.82, 0.98), align: 'right' });

  /* --------------------------------------------------------- issuer block */
  let y = PAGE_H - 168;
  text(ctx, site.legalName, MARGIN, y, { size: 13, bold: true, color: INDIGO });
  y -= 15;
  text(ctx, 'Hospital administration training — classroom only', MARGIN, y, { size: 8.5, color: INK_SOFT });
  y -= 16;
  text(ctx, contact.campus.full, MARGIN, y, { size: 9 });
  y -= 13;
  text(ctx, `${formatPhone(contact.whatsappNumber)}  ·  ${contact.email}`, MARGIN, y, { size: 9 });
  y -= 13;
  text(ctx, site.url.replace(/^https?:\/\//, ''), MARGIN, y, { size: 9, color: AZURE });

  /* --------------------------------------------------------- billed-to box */
  const boxTop = PAGE_H - 160;
  const boxW = 250;
  const boxX = PAGE_W - MARGIN - boxW;
  const boxH = 104;
  page.drawRectangle({ x: boxX, y: boxTop - boxH, width: boxW, height: boxH, color: TINT });
  page.drawRectangle({ x: boxX, y: boxTop - boxH, width: 3, height: boxH, color: AZURE });

  let by = boxTop - 20;
  text(ctx, 'INVOICE TO', boxX + 16, by, { size: 8, bold: true, color: AZURE });
  by -= 16;
  by = wrapped(ctx, clean(invoice.student_name), boxX + 16, by, boxW - 32, { size: 11, bold: true }) + 2;
  if (invoice.student_address) {
    by = wrapped(ctx, clean(invoice.student_address), boxX + 16, by, boxW - 32, { size: 8.5, color: INK_SOFT, leading: 11 });
  }
  by -= 2;
  text(ctx, formatPhone(invoice.student_phone), boxX + 16, by, { size: 8.5 });
  if (invoice.student_email) {
    by -= 12;
    text(ctx, clean(invoice.student_email), boxX + 16, by, { size: 8.5 });
  }

  /* -------------------------------------------------------------- line table */
  y = Math.min(y, boxTop - boxH) - 42;

  const descX = MARGIN + 14;
  const amountX = PAGE_W - MARGIN - 14;
  const rowH = 40;

  page.drawRectangle({ x: MARGIN, y: y - 24, width: CONTENT_W, height: 24, color: INDIGO });
  text(ctx, 'DESCRIPTION', descX, y - 16, { size: 8, bold: true, color: WHITE });
  text(ctx, 'AMOUNT (INR)', amountX, y - 16, { size: 8, bold: true, color: WHITE, align: 'right' });
  y -= 24;

  page.drawRectangle({ x: MARGIN, y: y - rowH, width: CONTENT_W, height: rowH, borderColor: RULE, borderWidth: 0.75 });
  text(ctx, clean(invoice.course_name), descX, y - 18, { size: 10.5, bold: true });
  text(ctx, 'Course fee', descX, y - 31, { size: 8.5, color: INK_SOFT });
  text(ctx, formatAmount(invoice.amount), amountX, y - 24, { size: 11, bold: true, align: 'right' });
  y -= rowH;

  /* ------------------------------------------------------------- totals */
  const totalsW = 230;
  const totalsX = PAGE_W - MARGIN - totalsW;

  page.drawLine({
    start: { x: totalsX, y: y - 18 },
    end: { x: PAGE_W - MARGIN, y: y - 18 },
    thickness: 0.75,
    color: RULE,
  });
  text(ctx, 'Subtotal', totalsX + 14, y - 34, { size: 9.5, color: INK_SOFT });
  text(ctx, formatAmount(invoice.amount), amountX, y - 34, { size: 9.5, align: 'right' });

  page.drawRectangle({ x: totalsX, y: y - 74, width: totalsW, height: 30, color: INDIGO });
  text(ctx, 'TOTAL', totalsX + 14, y - 64, { size: 10, bold: true, color: WHITE });
  text(ctx, `₹${formatAmount(invoice.amount)}`, amountX, y - 65, { size: 13, bold: true, color: WHITE, align: 'right' });

  /* Amount in words sits on the left, level with the total. */
  text(ctx, 'AMOUNT IN WORDS', MARGIN, y - 34, { size: 8, bold: true, color: AZURE });
  wrapped(ctx, amountInWords(invoice.amount), MARGIN, y - 48, totalsX - MARGIN - 24, {
    size: 9,
    bold: true,
    leading: 12,
  });

  y -= 74;

  /* ---------------------------------------------------------------- notes */
  if (invoice.notes) {
    y -= 30;
    text(ctx, 'NOTE', MARGIN, y, { size: 8, bold: true, color: AZURE });
    y = wrapped(ctx, clean(invoice.notes), MARGIN, y - 14, CONTENT_W, { size: 9, color: INK_SOFT, leading: 12 });
  }

  /* ------------------------------------------------------- terms + footer */
  const termsY = 196;
  page.drawLine({
    start: { x: MARGIN, y: termsY + 26 },
    end: { x: PAGE_W - MARGIN, y: termsY + 26 },
    thickness: 0.75,
    color: RULE,
  });
  text(ctx, 'PAYMENT & TERMS', MARGIN, termsY + 8, { size: 8, bold: true, color: AZURE });
  wrapped(
    ctx,
    'This invoice is issued against admission to the programme named above. Course fees once paid are ' +
      'non-refundable and non-transferable. Please quote the invoice number in all correspondence. ' +
      'This is a computer-generated invoice and is valid without a signature.',
    MARGIN,
    termsY - 6,
    CONTENT_W - 170,
    { size: 8.5, color: INK_SOFT, leading: 11.5 },
  );

  text(ctx, 'For ' + site.legalName, PAGE_W - MARGIN, termsY + 8, { size: 9, bold: true, align: 'right' });
  page.drawLine({
    start: { x: PAGE_W - MARGIN - 150, y: termsY - 34 },
    end: { x: PAGE_W - MARGIN, y: termsY - 34 },
    thickness: 0.75,
    color: RULE,
  });
  text(ctx, 'Authorised signatory', PAGE_W - MARGIN, termsY - 46, { size: 8, color: INK_SOFT, align: 'right' });

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 56, color: TINT });
  page.drawRectangle({ x: 0, y: 53, width: PAGE_W, height: 3, color: INDIGO });
  text(ctx, `Thank you for choosing ${site.legalName}.`, MARGIN, 32, { size: 9.5, bold: true, color: INDIGO });
  text(ctx, `${site.tagline}  ·  ${contact.campus.full}`, MARGIN, 19, { size: 8, color: INK_SOFT });
  text(ctx, `Issued by ${clean(invoice.created_by_name)}`, PAGE_W - MARGIN, 32, {
    size: 8.5,
    color: INK_SOFT,
    align: 'right',
  });
  text(ctx, invoice.invoice_no, PAGE_W - MARGIN, 19, { size: 8.5, bold: true, color: INDIGO, align: 'right' });

  return doc.save();
}

/** `Sidhah-Invoice-SID-2026-00001-Anna-Jacob.pdf` */
export function pdfFilename(invoice: Invoice): string {
  const student = invoice.student_name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `Sidhah-Invoice-${invoice.invoice_no}${student ? `-${student}` : ''}.pdf`;
}
