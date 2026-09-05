/// <reference types="astro/client" />

/** Vite inlines these as base64 data URIs so the PDF renderer needs no filesystem. */
declare module '*.ttf?inline' {
  const dataUri: string;
  export default dataUri;
}
declare module '*.png?inline' {
  const dataUri: string;
  export default dataUri;
}

declare namespace App {
  interface Locals {
    user: import('./lib/server/auth').SessionUser | null;
  }
}
