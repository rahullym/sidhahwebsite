import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import type { APIContext } from 'astro';
import { db, one } from './db';
import { requiredSecret } from './env';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// Deliberately slow. These are the OWASP-recommended scrypt parameters; a login
// costs ~100ms of CPU, which is invisible to staff and expensive to brute-force.
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 32;

export const SESSION_COOKIE = 'sidhah_session';
const SESSION_HOURS = 12;
const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MINUTES = 15;

export interface SessionUser {
  id: number;
  username: string;
  fullName: string;
  role: 'admin' | 'staff';
}

let cachedSecret: string | null = null;

function secret(): string {
  if (cachedSecret) return cachedSecret;
  const value = requiredSecret(
    'SESSION_SECRET',
    'Generate one with:\n  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"',
  );
  if (value.length < 16) {
    throw new Error('SESSION_SECRET is too short — use at least 16 characters of random data.');
  }
  cachedSecret = value;
  return cachedSecret;
}

/* ---------------------------------------------------------------- passwords */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ----------------------------------------------------------------- sessions */

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Stateless signed cookie: `{userId}.{expiresAt}.{hmac}`. There is no session
 * table to read on every request, which keeps each page to a single query.
 */
export function createSessionToken(userId: number): { token: string; expires: Date } {
  const expires = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const payload = `${userId}.${expires.getTime()}`;
  return { token: `${payload}.${sign(payload)}`, expires };
}

function readSessionToken(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAt, mac] = parts;
  if (!safeEqual(mac, sign(`${userId}.${expiresAt}`))) return null;
  if (Number(expiresAt) < Date.now()) return null;
  const id = Number(userId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function setSessionCookie(context: APIContext, userId: number): void {
  const { token, expires } = createSessionToken(userId);
  context.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    expires,
  });
}

export function clearSessionCookie(context: APIContext): void {
  context.cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** Resolves the signed cookie to a live, still-active user row. */
export async function getSessionUser(context: APIContext): Promise<SessionUser | null> {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = readSessionToken(token);
  if (!userId) return null;

  const row = await one<{ id: number; username: string; full_name: string; role: 'admin' | 'staff' }>(
    db`select id, username, full_name, role from users where id = ${userId} and active = true`,
  );
  if (!row) return null;
  return { id: row.id, username: row.username, fullName: row.full_name, role: row.role };
}

/* ------------------------------------------------------------------- login */

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export async function attemptLogin(username: string, password: string): Promise<LoginResult> {
  const generic = 'Incorrect username or password.';
  const row = await one<{
    id: number;
    username: string;
    full_name: string;
    role: 'admin' | 'staff';
    password_hash: string;
    active: boolean;
    failed_attempts: number;
    locked_until: string | null;
  }>(db`
    select id, username, full_name, role, password_hash, active, failed_attempts, locked_until
    from users where lower(username) = lower(${username})
  `);

  // Spend the same ~100ms on an unknown username as on a real one, so response
  // time does not reveal which accounts exist.
  if (!row) {
    await hashPassword(password);
    return { ok: false, error: generic };
  }
  if (!row.active) return { ok: false, error: 'This account has been disabled.' };

  if (row.locked_until && new Date(row.locked_until) > new Date()) {
    const mins = Math.max(1, Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 60000));
    return { ok: false, error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` };
  }

  if (!(await verifyPassword(password, row.password_hash))) {
    const attempts = row.failed_attempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    await db`
      update users set
        failed_attempts = ${lock ? 0 : attempts},
        locked_until = ${lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString() : null}
      where id = ${row.id}
    `;
    return {
      ok: false,
      error: lock
        ? `Too many failed attempts. This account is locked for ${LOCKOUT_MINUTES} minutes.`
        : generic,
    };
  }

  await db`
    update users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = ${row.id}
  `;
  return {
    ok: true,
    user: { id: row.id, username: row.username, fullName: row.full_name, role: row.role },
  };
}

/* -------------------------------------------------------------------- csrf */

/**
 * Token derived from the session cookie itself, so there is no second cookie to
 * keep in sync and a stolen token is useless without the session it is tied to.
 */
export function csrfToken(context: APIContext): string {
  const session = context.cookies.get(SESSION_COOKIE)?.value ?? 'anonymous';
  return createHmac('sha256', secret()).update(`csrf:${session}`).digest('base64url');
}

export function checkCsrf(context: APIContext, submitted: FormDataEntryValue | null): boolean {
  // Same-origin check first: catches cross-site posts before any token compare.
  const origin = context.request.headers.get('origin');
  if (origin && new URL(origin).host !== context.url.host) return false;
  return typeof submitted === 'string' && safeEqual(submitted, csrfToken(context));
}
