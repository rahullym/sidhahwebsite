-- Sidhah staff dashboard — Neon Postgres schema.
-- Safe to re-run: every statement is idempotent.

create table if not exists users (
  id             serial primary key,
  username       text        not null,
  password_hash  text        not null,
  full_name      text        not null,
  role           text        not null default 'staff' check (role in ('admin', 'staff')),
  active         boolean     not null default true,
  failed_attempts integer    not null default 0,
  locked_until   timestamptz,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now()
);
-- Usernames are matched case-insensitively, so uniqueness has to be too.
create unique index if not exists users_username_key on users (lower(username));

create table if not exists courses (
  id             serial primary key,
  name           text        not null,
  default_amount numeric(12, 2),
  active         boolean     not null default true,
  created_at     timestamptz not null default now()
);
create unique index if not exists courses_name_key on courses (lower(name));

create table if not exists students (
  id         serial primary key,
  name       text        not null,
  phone      text        not null,
  email      text,
  address    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Phone is the natural key staff search by, and one student has one number.
create unique index if not exists students_phone_key on students (phone);
create index if not exists students_name_idx on students (lower(name));

create table if not exists invoices (
  id              serial primary key,
  invoice_no      text        not null,
  year            integer     not null,
  seq             integer     not null,
  student_id      integer     not null references students (id),
  course_id       integer     not null references courses (id),
  -- Snapshots. An invoice is a record of what was issued, so renaming a course
  -- or correcting a student's address later must never rewrite past invoices.
  student_name    text        not null,
  student_phone   text        not null,
  student_email   text,
  student_address text,
  course_name     text        not null,
  amount          numeric(12, 2) not null check (amount > 0),
  notes           text,
  invoice_date    date        not null,
  created_by      integer     not null references users (id),
  created_by_name text        not null,
  created_at      timestamptz not null default now()
);
create unique index if not exists invoices_no_key on invoices (invoice_no);
-- Guards the numbering race: two staff saving at once cannot land on one seq.
create unique index if not exists invoices_year_seq_key on invoices (year, seq);
create index if not exists invoices_created_at_idx on invoices (created_at desc);
create index if not exists invoices_date_idx on invoices (invoice_date desc);
create index if not exists invoices_student_name_idx on invoices (lower(student_name));
create index if not exists invoices_student_phone_idx on invoices (student_phone);

-- Student invoice v2: student ID, payment method and fee breakdown.
-- Older invoices keep these null and print as a plain one-line invoice.
alter table students add column if not exists student_code text;
create unique index if not exists students_code_key on students (lower(student_code));
alter table invoices add column if not exists student_code text;
alter table invoices add column if not exists payment_method text;
alter table invoices add column if not exists course_fee numeric(12, 2);
alter table invoices add column if not exists discount numeric(12, 2);
-- Sum of earlier invoices for the same student and course, frozen at issue time.
alter table invoices add column if not exists previous_paid numeric(12, 2);

-- Website content managed from the dashboard ------------------------------

-- Uploaded photos. Rows are never edited: replacing a photo inserts a new row,
-- so /media/<id> can be cached forever.
create table if not exists media (
  id           serial primary key,
  content_type text        not null,
  data         bytea       not null,
  created_at   timestamptz not null default now()
);

-- A course row is both the invoice dropdown entry and, once published, a page
-- on the website. The list fields are JSON arrays edited one item per line.
alter table courses add column if not exists slug text;
create unique index if not exists courses_slug_key on courses (slug);
alter table courses add column if not exists published boolean not null default false;
alter table courses add column if not exists sort_order integer not null default 0;
alter table courses add column if not exists short_title text;
alter table courses add column if not exists duration text;
alter table courses add column if not exists level text;
alter table courses add column if not exists summary text;
alter table courses add column if not exists intro text;
alter table courses add column if not exists featured boolean not null default false;
alter table courses add column if not exists eligibility jsonb not null default '[]';
alter table courses add column if not exists outcomes jsonb not null default '[]';
alter table courses add column if not exists careers jsonb not null default '[]';
alter table courses add column if not exists highlights jsonb not null default '[]';
alter table courses add column if not exists modules jsonb not null default '[]';
alter table courses add column if not exists image_id integer references media (id) on delete set null;

create table if not exists placements (
  id         serial primary key,
  name       text        not null,
  from_field text,
  position   text        not null,
  hospital   text        not null,
  location   text        not null default 'Kochi, Kerala',
  kind       text        not null default 'placed' check (kind in ('placed', 'training')),
  program    text        not null default 'Hospital Administration',
  photo_id   integer references media (id) on delete set null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists gallery (
  id         serial primary key,
  photo_id   integer     not null references media (id) on delete cascade,
  caption    text,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id           serial primary key,
  slug         text        not null,
  title        text        not null,
  excerpt      text,
  body         text        not null default '',
  cover_id     integer references media (id) on delete set null,
  published    boolean     not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists posts_slug_key on posts (slug);
