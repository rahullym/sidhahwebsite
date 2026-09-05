#!/usr/bin/env node
/**
 * One-shot setup for the staff dashboard:
 *   node scripts/setup-db.mjs                 # tables + seed courses
 *   node scripts/setup-db.mjs --admin         # also create the first admin login
 *
 * Safe to re-run. Reads DATABASE_URL from the environment or .env.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { neon, neonConfig } from '@neondatabase/serverless';

const scrypt = promisify(scryptCb);
const root = new URL('..', import.meta.url).pathname;

// Minimal .env reader so setup works before any bundler is involved.
for (const file of ['.env', '.env.local']) {
  const path = `${root}${file}`;
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and paste your Neon string.');
  process.exit(1);
}

// Matches src/lib/server/db.ts: point at the local Docker proxy when the
// connection string is a local one, so setup works without a cloud database.
const { hostname } = new URL(process.env.DATABASE_URL);
if (hostname === 'db.localtest.me' || hostname === 'localhost') {
  neonConfig.fetchEndpoint = (host, port) => `http://${host}:${port}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
}

console.log('→ Applying schema…');
// The Neon HTTP driver sends one statement per request, so split the file.
const schema = readFileSync(`${root}scripts/schema.sql`, 'utf8');
const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
  .filter(Boolean);
for (const statement of statements) await sql.query(statement);
console.log(`  ${statements.length} statements applied.`);

console.log('→ Seeding courses…');
const seed = [
  ['PG Diploma in Hospital Administration', null],
  ['Diploma in Hospital Administration', null],
  ['Interview Training', null],
  ['Spoken English', null],
  ['Tally & GST', null],
];
let added = 0;
for (const [name, amount] of seed) {
  const rows = await sql.query(
    'insert into courses (name, default_amount) values ($1, $2) on conflict do nothing returning id',
    [name, amount],
  );
  if (rows.length) added++;
}
console.log(`  ${added} new, ${seed.length - added} already present.`);

if (process.argv.includes('--admin')) {
  // Flags let this run unattended (a seed step, a fresh laptop); without them it
  // prompts, so nobody has to put a password in their shell history.
  const flag = (name) => {
    const index = process.argv.indexOf(`--${name}`);
    return index !== -1 ? process.argv[index + 1] : undefined;
  };

  let fullName = flag('name');
  let username = flag('username');
  let password = flag('password');

  if (!fullName || !username || !password) {
    const rl = createInterface({ input: stdin, output: stdout });
    fullName ??= await rl.question('Full name: ');
    username ??= await rl.question('Username: ');
    password ??= await rl.question('Password (min 10 chars): ');
    rl.close();
  }

  fullName = fullName.trim();
  username = username.trim();
  password = password.trim();

  if (!fullName || !/^[a-z0-9._-]{3,32}$/i.test(username) || password.length < 10) {
    console.error('✗ Need a full name, a 3–32 character username and a 10+ character password.');
    process.exit(1);
  }

  const rows = await sql.query(
    `insert into users (username, full_name, password_hash, role) values ($1, $2, $3, 'admin')
     on conflict do nothing returning id`,
    [username, fullName, await hashPassword(password)],
  );
  console.log(rows.length ? `✓ Admin "${username}" created.` : `✗ Username "${username}" is already taken.`);
}

const [{ count }] = await sql.query('select count(*)::int as count from users');
console.log(
  count === 0
    ? '\n⚠ No logins exist yet. Run: node scripts/setup-db.mjs --admin'
    : `\n✓ Done. ${count} login${count === 1 ? '' : 's'} can access /admin.`,
);
