/** Formatting shared by the dashboard screens and the generated PDF. */

/** Indian digit grouping: 12,34,567.00 — not the 1,234,567.00 the Western locale gives. */
export function formatAmount(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatRupees(value: number | string): string {
  return `₹${formatAmount(value)}`;
}

/**
 * Reduces anything staff might type to the bare international form WhatsApp
 * needs — 917012644182 — assuming +91 when no country code is given.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  // Any other country code: accept as-is if it is a plausible international number.
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

/** 917012644182 -> +91 70126 44182 */
export function formatPhone(stored: string): string {
  if (stored.length === 12 && stored.startsWith('91')) {
    const n = stored.slice(2);
    return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
  }
  return `+${stored}`;
}

/** 2026-09-05 -> 05 September 2026. Dates are stored as plain dates, so parse as UTC. */
export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Reads a rupee amount the way staff type it — "25000", "25,000", "₹ 19,999.99" —
 * and returns it as a plain "19999.99" string, or null if it is not a valid
 * amount with at most two decimal places. Checked as text, not as a float:
 * 19999.99 * 100 is 1999998.9999999998 in floating point.
 */
export function parseAmount(input: string): string | null {
  const cleaned = input.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned).toFixed(2);
}

/** True only for a real calendar date in yyyy-mm-dd form (rejects 2026-02-30). */
export function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  if (year < 2000 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Today in IST, as yyyy-mm-dd. The server runs in UTC; the institute does not. */
export function todayInIndia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function underThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${underThousand(n % 100)}` : ''}`;
}

/**
 * Indian numbering — crore, lakh, thousand — because that is what an invoice
 * issued in Kochi is read against.
 */
export function amountInWords(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n) || n < 0) return 'Zero Rupees Only';

  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);

  const groups: [number, string][] = [
    [Math.floor(rupees / 10000000), 'Crore'],
    [Math.floor((rupees % 10000000) / 100000), 'Lakh'],
    [Math.floor((rupees % 100000) / 1000), 'Thousand'],
    [rupees % 1000, ''],
  ];

  const words = groups
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${underThousand(count)}${label ? ` ${label}` : ''}`)
    .join(' ');

  const rupeeWords = words || 'Zero';
  const rupeeUnit = rupees === 1 ? 'Rupee' : 'Rupees';
  const paiseWords = paise > 0 ? ` and ${underThousand(paise)} ${paise === 1 ? 'Paisa' : 'Paise'}` : '';
  return `${rupeeWords} ${rupeeUnit}${paiseWords} Only`;
}

/**
 * The characters the invoice font can actually draw. Inter is subsetted to
 * Latin-1 plus the rupee sign, so anything outside this set would print as an
 * empty box — the form rejects it rather than letting a mangled PDF go out.
 */
const PRINTABLE = /^[ -~ -ÿ‐-‧₹™−\s]*$/;

export function printable(value: string): boolean {
  return PRINTABLE.test(value);
}
