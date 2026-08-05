import type { ImageMetadata } from 'astro';

type GlobResult = Record<string, { default: ImageMetadata }>;

/**
 * Photos are looked up by filename rather than imported directly, so the site
 * builds and renders correctly before any image files exist. Drop a file in and
 * it appears; leave it out and the component falls back. Nothing breaks either way.
 */
const placementPhotos = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/placements/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
) as GlobResult;

const galleryPhotos = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/gallery/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
) as GlobResult;

const logoImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/logos/*.{png,svg,jpg,jpeg,webp}',
  { eager: true },
) as GlobResult;

/** Editorial photography used across the layout — see the <Photo> component. */
const photos = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/photos/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
) as GlobResult;

function basename(path: string): string {
  return path.split('/').pop()!.replace(/\.[^.]+$/, '');
}

function findByName(glob: GlobResult, name: string): ImageMetadata | undefined {
  const match = Object.entries(glob).find(([path]) => basename(path) === name);
  return match?.[1].default;
}

export function placementPhoto(slug: string): ImageMetadata | undefined {
  return findByName(placementPhotos, slug);
}

export function logo(slug: string): ImageMetadata | undefined {
  return findByName(logoImages, slug);
}

export function galleryPhoto(name: string): ImageMetadata | undefined {
  return findByName(galleryPhotos, name);
}

export function photo(name: string): ImageMetadata | undefined {
  return findByName(photos, name);
}

/** True once any editorial photo exists, for sections that only earn their space with one. */
export function hasPhoto(name: string): boolean {
  return photo(name) !== undefined;
}

/** All gallery images, ordered by filename so `01-*.jpg`, `02-*.jpg` control the sequence. */
export function galleryImages(): { src: ImageMetadata; name: string }[] {
  return Object.entries(galleryPhotos)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, mod]) => ({ src: mod.default, name: basename(path) }));
}

/** "Farha Mol" -> "FM". Used for the avatar shown until a photo is supplied. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}
