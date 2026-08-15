/**
 * Internal links must survive being served from a sub-path. GitHub Pages hosts
 * this project under /sidhahwebsite/, while production serves it at the root,
 * so every internal href goes through here rather than being hardcoded.
 *
 * Astro sets BASE_URL from `base` in astro.config.mjs ('/' when unset).
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function href(path: string): string {
  return `${BASE}${path}`;
}

/** Strips the deploy base off a pathname so route matching stays base-agnostic. */
export function routePath(pathname: string): string {
  if (BASE && pathname.startsWith(BASE)) {
    return pathname.slice(BASE.length) || '/';
  }
  return pathname;
}
