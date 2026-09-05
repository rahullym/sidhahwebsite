import { neon, neonConfig } from '@neondatabase/serverless';
import { requiredSecret } from './env';

type NeonClient = ReturnType<typeof neon>;

/**
 * Neon over HTTP rather than a pooled TCP client: every dashboard request is a
 * short-lived serverless invocation, so there is no connection to keep warm and
 * nothing to exhaust the Postgres connection limit.
 */
let client: NeonClient | null = null;

export function neonClient(): NeonClient {
  if (!client) {
    const url = requiredSecret(
      'DATABASE_URL',
      'Copy .env.example to .env and paste the Neon connection string.',
    );
    configureLocalProxy(url);
    client = neon(url);
  }
  return client;
}

/**
 * Local development runs Postgres and Neon's HTTP proxy in Docker (see
 * `docker/compose.yml`), which speaks the same wire protocol over plain HTTP on
 * a non-standard port. Production connection strings never match this, so the
 * override cannot leak into a deployed build.
 */
function configureLocalProxy(url: string): void {
  const { hostname } = new URL(url);
  if (hostname !== 'db.localtest.me' && hostname !== 'localhost') return;
  neonConfig.fetchEndpoint = (host, port) => `http://${host}:${port}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

/**
 * Tagged-template query: db`select * from users where id = ${id}`.
 * Interpolated values are always sent as bound parameters, never spliced into SQL.
 */
export function db<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  return neonClient()(strings, ...values) as unknown as Promise<T[]>;
}

/** First row, or null. For lookups that are expected to match at most one row. */
export async function one<T = Record<string, unknown>>(rows: Promise<T[]>): Promise<T | null> {
  return (await rows)[0] ?? null;
}
