import { db, one } from './db';
import type { Course, Module } from '../../data/courses';

/**
 * Website content edited from the dashboard. Each reader returns the same shape
 * the page templates used when this lived in src/data, so templates barely change.
 */

export type WebCourse = Course & { id: number; image: string | null };

export interface WebPlacement {
  id: number;
  name: string;
  from?: string;
  position: string;
  hospital: string;
  location: string;
  kind: 'placed' | 'training';
  program: string;
  photo: string | null;
}

export interface GalleryPhoto {
  id: number;
  src: string;
  caption: string | null;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover: string | null;
  published: boolean;
  published_at: string | null;
  updated_at: string;
}

export const mediaUrl = (id: number | null): string | null => (id ? `/media/${id}` : null);

/* ----------------------------------------------------------------- courses */

interface CourseRow {
  id: number;
  name: string;
  slug: string;
  short_title: string | null;
  duration: string | null;
  level: string | null;
  summary: string | null;
  intro: string | null;
  featured: boolean;
  eligibility: string[];
  outcomes: string[];
  careers: string[];
  highlights: { label: string; value: string }[];
  modules: Module[];
  image_id: number | null;
}

function toCourse(row: CourseRow): WebCourse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.name,
    shortTitle: row.short_title || row.name,
    duration: row.duration ?? '',
    level: row.level ?? '',
    summary: row.summary ?? '',
    intro: row.intro ?? '',
    featured: row.featured,
    eligibility: row.eligibility,
    outcomes: row.outcomes,
    careers: row.careers,
    highlights: row.highlights,
    modules: row.modules,
    image: mediaUrl(row.image_id),
  };
}

/** Published courses only, in the order staff set. */
export async function getCourses(): Promise<WebCourse[]> {
  const rows = await db<CourseRow>`
    select * from courses where published and active and slug is not null order by sort_order, name
  `;
  return rows.map(toCourse);
}

export async function getCourse(slug: string): Promise<WebCourse | null> {
  const row = await one<CourseRow>(db`
    select * from courses where slug = ${slug} and published and active
  `);
  return row ? toCourse(row) : null;
}

/* -------------------------------------------------------------- placements */

export async function getPlacements(): Promise<WebPlacement[]> {
  const rows = await db<{
    id: number; name: string; from_field: string | null; position: string; hospital: string;
    location: string; kind: 'placed' | 'training'; program: string; photo_id: number | null;
  }>`select * from placements order by sort_order, id`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    from: r.from_field ?? undefined,
    position: r.position,
    hospital: r.hospital,
    location: r.location,
    kind: r.kind,
    program: r.program,
    photo: mediaUrl(r.photo_id),
  }));
}

/* ----------------------------------------------------------------- gallery */

export async function getGallery(): Promise<GalleryPhoto[]> {
  const rows = await db<{ id: number; photo_id: number; caption: string | null }>`
    select id, photo_id, caption from gallery order by sort_order, id
  `;
  return rows.map((r) => ({ id: r.id, src: mediaUrl(r.photo_id)!, caption: r.caption }));
}

/* -------------------------------------------------------------------- blog */

type PostRow = Omit<Post, 'cover'> & { cover_id: number | null };
const toPost = ({ cover_id, ...row }: PostRow): Post => ({ ...row, cover: mediaUrl(cover_id) });

export async function getPosts(): Promise<Post[]> {
  const rows = await db<PostRow>`
    select * from posts where published order by published_at desc nulls last, id desc
  `;
  return rows.map(toPost);
}

export async function getPost(slug: string): Promise<Post | null> {
  const row = await one<PostRow>(db`select * from posts where slug = ${slug} and published`);
  return row ? toPost(row) : null;
}

/* ------------------------------------------------------------------- media */

/** After browser-side resizing a photo is a few hundred KB; this only stops accidents. */
export const MAX_UPLOAD = 4 * 1024 * 1024;

/** The type is read from the file's first bytes, never trusted from the upload. */
function sniff(bytes: Uint8Array): string | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (starts(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

/** A problem with the uploaded file itself; its message is safe to show staff. */
export class PhotoError extends Error {}

/**
 * Stores an uploaded photo and returns its id, null when no file was chosen, or
 * throws with a message staff can act on.
 */
export async function saveUpload(value: FormDataEntryValue | null): Promise<number | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_UPLOAD) throw new PhotoError('That photo is too large. Use one under 4 MB.');
  const bytes = new Uint8Array(await value.arrayBuffer());
  const type = sniff(bytes);
  if (!type) throw new PhotoError('Upload a JPG, PNG or WebP photo.');
  const row = await one<{ id: number }>(db`
    insert into media (content_type, data)
    values (${type}, decode(${Buffer.from(bytes).toString('base64')}, 'base64'))
    returning id
  `);
  return row!.id;
}

export async function deleteMedia(id: number | null | undefined): Promise<void> {
  if (id) await db`delete from media where id = ${id}`;
}

/* ------------------------------------------------- text-area editing helpers */

/** One item per line, blanks dropped. */
export const lines = (text: string): string[] =>
  text.split('\n').map((l) => l.trim()).filter(Boolean);

/** "Duration: 1 Year" per line. */
export function parseHighlights(text: string): { label: string; value: string }[] {
  return lines(text).map((line) => {
    const at = line.indexOf(':');
    return at === -1
      ? { label: line, value: '' }
      : { label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() };
  });
}

export const formatHighlights = (items: { label: string; value: string }[]): string =>
  items.map((h) => `${h.label}: ${h.value}`).join('\n');

/**
 * "# Module title" starts a module; the lines under it are its chapters.
 * Throws if chapters appear before the first module heading.
 */
export function parseModules(text: string): Module[] {
  const modules: Module[] = [];
  for (const line of lines(text)) {
    if (line.startsWith('#')) modules.push({ title: line.replace(/^#+\s*/, ''), chapters: [] });
    else if (modules.length) modules.at(-1)!.chapters.push(line);
    else throw new Error('Start the syllabus with a module title line beginning with #.');
  }
  return modules;
}

export const formatModules = (modules: Module[]): string =>
  modules.map((m) => [`# ${m.title}`, ...m.chapters].join('\n')).join('\n\n');

/** "PG Diploma in Hospital Administration" -> "pg-diploma-in-hospital-administration" */
export const slugify = (text: string): string =>
  text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
