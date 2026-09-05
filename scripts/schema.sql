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
