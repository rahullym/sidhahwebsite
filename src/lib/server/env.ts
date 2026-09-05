import { getSecret } from 'astro:env/server';

/**
 * `astro:env` is the only reader that covers both worlds: in dev it picks up
 * `.env`, and on Vercel it reads the runtime environment. `process.env` is kept
 * as a fallback for the setup script and any plain-Node context.
 */
export function requiredSecret(name: string, hint: string): string {
  const value = getSecret(name) ?? process.env[name];
  if (!value) throw new Error(`${name} is not set. ${hint}`);
  return value;
}
