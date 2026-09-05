import { UnsafeRawSql } from '@neondatabase/serverless';
import { db, one } from './db';
import { normalisePhone, printable, todayInIndia } from '../format';

/**
 * `invoice_date` is cast to text on the way out. The driver otherwise hands back
 * a Date at local midnight, which shifts the printed date by a day whenever the
 * server's timezone is behind UTC — the invoice would say the 4th when the
 * record says the 5th. A plain 'YYYY-MM-DD' string cannot drift.
 */
const INVOICE_COLUMNS = new UnsafeRawSql(`
  id, invoice_no, year, seq, student_id, course_id,
  student_name, student_phone, student_email, student_address,
  course_name, amount, notes, invoice_date::text as invoice_date,
  created_by, created_by_name, created_at
`);

export interface Course {
  id: number;
  name: string;
  default_amount: string | null;
  active: boolean;
}

export interface Invoice {
  id: number;
  invoice_no: string;
  student_name: string;
  student_phone: string;
  student_email: string | null;
  student_address: string | null;
  course_name: string;
  amount: string;
  notes: string | null;
  invoice_date: string;
  created_by_name: string;
  created_at: string;
}

/* ----------------------------------------------------------------- courses */

export function listCourses(includeInactive = false): Promise<Course[]> {
  return includeInactive
    ? db<Course>`select id, name, default_amount, active from courses order by active desc, name`
    : db<Course>`select id, name, default_amount, active from courses where active = true order by name`;
}

/* -------------------------------------------------------------- validation */

export interface InvoiceInput {
  studentName: string;
  phone: string;
  email: string;
  address: string;
  courseId: string;
  amount: string;
  invoiceDate: string;
  notes: string;
}

export type Errors = Partial<Record<keyof InvoiceInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// The invoice font covers Latin and the rupee sign. Anything else would print
// as an empty box, so it is caught here rather than discovered in the PDF.
const UNPRINTABLE = 'This contains characters the invoice cannot print. Please use English letters.';

export function readInvoiceForm(form: FormData): InvoiceInput {
  const get = (key: string) => String(form.get(key) ?? '').trim();
  return {
    studentName: get('studentName'),
    phone: get('phone'),
    email: get('email'),
    address: get('address'),
    courseId: get('courseId'),
    amount: get('amount'),
    invoiceDate: get('invoiceDate'),
    notes: get('notes'),
  };
}

export function validateInvoice(input: InvoiceInput, courses: Course[]): Errors {
  const errors: Errors = {};

  if (!input.studentName) errors.studentName = 'Student name is required.';
  else if (input.studentName.length > 120) errors.studentName = 'Keep the name under 120 characters.';
  else if (!printable(input.studentName)) errors.studentName = UNPRINTABLE;

  if (!input.phone) errors.phone = 'Phone number is required.';
  else if (!normalisePhone(input.phone)) errors.phone = 'Enter a valid mobile number, e.g. 70126 44182.';

  if (input.email && !EMAIL.test(input.email)) errors.email = 'Enter a valid email address.';
  if (input.address.length > 400) errors.address = 'Keep the address under 400 characters.';
  else if (!printable(input.address)) errors.address = UNPRINTABLE;

  if (!input.courseId) errors.courseId = 'Select a course.';
  else if (!courses.some((c) => String(c.id) === input.courseId)) errors.courseId = 'That course is no longer available.';

  const amount = Number(input.amount);
  if (!input.amount) errors.amount = 'Amount is required.';
  else if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount greater than zero.';
  else if (amount > 10_000_000) errors.amount = 'That amount looks wrong — check before saving.';
  else if (Math.round(amount * 100) !== amount * 100) errors.amount = 'Use at most two decimal places.';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.invoiceDate)) errors.invoiceDate = 'Enter a valid date.';
  if (input.notes.length > 300) errors.notes = 'Keep the note under 300 characters.';
  else if (!printable(input.notes)) errors.notes = UNPRINTABLE;

  return errors;
}

/* --------------------------------------------------------------- creation */

/**
 * Upsert on phone: the same student enrolling in a second course reuses their
 * record instead of creating a duplicate, and the newest details win.
 */
async function upsertStudent(input: InvoiceInput, phone: string): Promise<number> {
  const row = await one<{ id: number }>(db`
    insert into students (name, phone, email, address)
    values (${input.studentName}, ${phone}, ${input.email || null}, ${input.address || null})
    on conflict (phone) do update set
      name = excluded.name,
      email = coalesce(excluded.email, students.email),
      address = coalesce(excluded.address, students.address),
      updated_at = now()
    returning id
  `);
  return row!.id;
}

/**
 * Allocates the next number and writes the invoice in one statement, so two
 * staff members saving at the same instant cannot be handed the same sequence.
 * The unique index on (year, seq) is the backstop; a loser simply retries.
 */
export async function createInvoice(
  input: InvoiceInput,
  user: { id: number; fullName: string },
): Promise<Invoice> {
  const phone = normalisePhone(input.phone)!;
  const studentId = await upsertStudent(input, phone);
  const courseId = Number(input.courseId);
  const course = await one<{ name: string }>(db`select name from courses where id = ${courseId}`);
  if (!course) throw new Error('Course not found');

  const year = Number(input.invoiceDate.slice(0, 4));
  const amount = Number(input.amount).toFixed(2);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await one<Invoice>(db`
        with next as (
          select coalesce(max(seq), 0) + 1 as seq from invoices where year = ${year}
        )
        insert into invoices (
          invoice_no, year, seq, student_id, course_id,
          student_name, student_phone, student_email, student_address,
          course_name, amount, notes, invoice_date, created_by, created_by_name
        )
        select
          'SID-' || ${year} || '-' || lpad(next.seq::text, 5, '0'),
          ${year}, next.seq, ${studentId}, ${courseId},
          ${input.studentName}, ${phone}, ${input.email || null}, ${input.address || null},
          ${course.name}, ${amount}, ${input.notes || null}, ${input.invoiceDate},
          ${user.id}, ${user.fullName}
        from next
        returning ${INVOICE_COLUMNS}
      `);
      return row!;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRace = message.includes('invoices_year_seq_key') || message.includes('invoices_no_key');
      if (!isRace || attempt === 4) throw error;
    }
  }
  throw new Error('Could not allocate an invoice number. Please try again.');
}

/* ----------------------------------------------------------------- reading */

export function getInvoice(id: number): Promise<Invoice | null> {
  return one<Invoice>(db`select ${INVOICE_COLUMNS} from invoices where id = ${id}`);
}

export interface SearchParams {
  q?: string;
  from?: string;
  to?: string;
  page?: number;
}

const PAGE_SIZE = 25;

/**
 * One search box over name, phone and invoice number — staff should not have to
 * pick which field they are searching before they can type.
 */
export async function searchInvoices(params: SearchParams): Promise<{
  invoices: Invoice[];
  total: number;
  page: number;
  pages: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const q = params.q?.trim() || null;
  const like = q ? `%${q.toLowerCase()}%` : null;
  // A query of "abc" has no digits, and `%%` would match every phone number.
  const digits = q ? q.replace(/\D/g, '') : '';
  const phoneLike = digits.length >= 4 ? `%${digits}%` : null;
  const from = params.from || null;
  const to = params.to || null;
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db<Invoice & { total: string }>`
    select ${INVOICE_COLUMNS}, count(*) over () as total
    from invoices
    where (${like}::text is null
        or lower(student_name) like ${like}
        or lower(invoice_no) like ${like}
        or (${phoneLike}::text is not null and student_phone like ${phoneLike}))
      and (${from}::date is null or invoice_date >= ${from}::date)
      and (${to}::date is null or invoice_date <= ${to}::date)
    order by id desc
    limit ${PAGE_SIZE} offset ${offset}
  `;

  const total = rows.length ? Number(rows[0].total) : 0;
  return { invoices: rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function dashboardStats(): Promise<{
  totalInvoices: number;
  thisMonth: number;
  thisMonthValue: string;
  recent: Invoice[];
}> {
  const monthStart = `${todayInIndia().slice(0, 7)}-01`;
  const [stats] = await db<{ total: string; month_count: string; month_value: string }>`
    select
      count(*) as total,
      count(*) filter (where invoice_date >= ${monthStart}::date) as month_count,
      coalesce(sum(amount) filter (where invoice_date >= ${monthStart}::date), 0) as month_value
    from invoices
  `;
  const recent = await db<Invoice>`select ${INVOICE_COLUMNS} from invoices order by id desc limit 8`;
  return {
    totalInvoices: Number(stats?.total ?? 0),
    thisMonth: Number(stats?.month_count ?? 0),
    thisMonthValue: stats?.month_value ?? '0',
    recent,
  };
}
