# Images — where to put what

Nothing here is required for the site to build. Every image is looked up by
**filename**, and each component falls back gracefully when a file is missing:
placement cards show the student's initials, the graduation gallery hides itself,
accreditation chips show a text badge. Drop a file in with the right name and it
appears automatically — no code change.

Astro compresses these and emits `webp` at several widths, so upload the largest
original you have rather than something pre-shrunk.

## `photos/` — editorial photography (the big one)

These drive the layout. **Every slot below currently renders a designed gradient
panel** with an icon and a caption — it looks deliberate rather than broken, but
the site only becomes properly photographic once you fill these in. Drop a file
named exactly as below and it takes over instantly.

| File | Where it appears | Shape |
| --- | --- | --- |
| `hero-classroom` | Homepage hero, top right | landscape 4:3 |
| `why-offline` | Homepage, "Why we stay offline" | portrait 4:5 |
| `campus-1` | Full-width band, tile 1 — classroom | square |
| `campus-2` | Full-width band, tile 2 — computer lab | square |
| `campus-3` | Full-width band, tile 3 — hospital visit | square |
| `campus-4` | Full-width band, tile 4 — interview practice | square |
| `course-pg-diploma-hospital-administration` | PG Diploma card header | wide 21:9 |
| `course-diploma-hospital-administration` | Diploma card header | wide 21:9 |
| `facility-classroom` | Campus page, facilities | 16:9 |
| `facility-lab` | Campus page, facilities | 16:9 |
| `facility-practical` | Campus page, facilities | 16:9 |
| `facility-interview` | Campus page, facilities | 16:9 |

Extension can be `.jpg`, `.png`, `.webp` or `.avif` — the name before the dot is
what matters. Upload the largest version you have; Astro generates the resized
WebP variants.

**The card headers crop hard.** For the 21:9 course headers and the hero, keep
faces near the centre and leave room at the bottom — a dark gradient sits there
so the title stays readable.

Shoot these on a phone if needed. A real photo of your actual classroom beats a
polished stock image, and it is the honest thing to show.

## `placements/` — student photos

One file per student, named exactly after the `slug` in `src/data/placements.ts`:

| File | Student |
| --- | --- |
| `farha-mol.jpg` | Farha Mol |
| `anna-jacob.jpg` | Anna Jacob |
| `sajishna-ps.jpg` | Sajishna P.S |
| `anupriya-k.jpg` | Anupriya K |
| `mohammed-naife.jpg` | Mohammed Naife |
| `rinshitha-ks.jpg` | Rinshitha KS |

`.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` all work.

**Cut the student out of the square Instagram creative** — just the person, not
the text and badges. Cards are portrait (4:5) and crop from the top, so leave
headroom above the head and don't put anything important at the bottom of the
frame. Roughly 800×1000 or larger is ideal.

## `gallery/` — graduation ceremony photos

Any number of files. They are sorted **by filename**, and the first one renders
as a large 2×2 feature tile, so name them in the order you want:

```
01-certificate-handover.jpg
02-graduate-portrait.jpg
03-graduate-portrait.jpg
04-group.jpg
```

The whole section disappears if this folder is empty.

## `logos/` — accreditation marks

Named after the `slug` in the `accreditations` array. Chips are logo-first: a
mark renders if the file exists, otherwise the chip falls back to the name and
full title as text.

| File | Status | Source |
| --- | --- | --- |
| `msme.png` | ✅ present | Official ministry lockup from `udyamregistration.gov.in` |
| `tssr-council.svg` | ✅ present | Official logo from `tssrcouncil.com` |
| `learn-curve.*` | ⬜ needed | Ask Learn Curve for their logo file |
| `iso-9001.*` | ⬜ see below | — |

Marks render at 48–56px tall on a **white** background and are dark-on-transparent,
so don't place this component on a dark section without light variants.

**On the ISO 9001 badge:** ISO does not license its logo to certified
organisations — the gold "ISO 9001 CERTIFIED" badge circulating online is a
stock graphic, not an official mark. The correct logo is the one issued by
whichever certification body audited you (BSI, TÜV, Bureau Veritas, etc.), and
it usually carries your certificate number. Get that file from them and save it
as `iso-9001.png`. Until then the chip shows clean text, which is safer than an
unlicensed badge.

## Testimonial videos

Videos are **not** files — they are YouTube IDs. Add entries to
`videoTestimonials` in `src/data/placements.ts`:

```ts
export const videoTestimonials: VideoTestimonial[] = [
  {
    youtubeId: 'dQw4w9WgXcQ',   // the part after ?v= in the YouTube URL
    name: 'Farha Mol',
    role: 'Corporate Department, Lakeshore Hospital',
    quote: 'One line in their own words.',
  },
];
```

The player is a facade: the thumbnail comes from YouTube, but no YouTube script,
iframe or cookie loads until the visitor actually presses play. The testimonials
section stays hidden while the array is empty.
