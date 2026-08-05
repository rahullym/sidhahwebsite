# Sidhah — website

Redesign of [sidhah.com](https://www.sidhah.com) as a static Astro site, positioned around
**classroom-only** training. The old site's LMS/dashboard login is deliberately gone: there are
no online batches, no student portal and no recorded content anywhere in this build.

## Commands

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # type-check + build static output to dist/
npm run preview  # serve the built dist/ locally
```

`npm run build` runs `astro check` first, so a type error fails the build.

## Where the content lives

Almost all copy that changes over time is data, not markup:

| What | File |
| --- | --- |
| Phone, WhatsApp, email, address, hours, nav | `src/data/site.ts` |
| Both programs, all modules and chapters, add-ons | `src/data/courses.ts` |
| Placements, video testimonials, accreditations | `src/data/placements.ts` |
| Student photos, graduation gallery, logos | `src/assets/` — see `src/assets/README.md` |
| Brand colours, fonts, hexagon pattern | `src/styles/global.css` |

Editing `src/data/courses.ts` updates the cards, the comparison table, the syllabus accordion,
the footer, the JSON-LD and the prefilled WhatsApp messages together. Chapter numbers are
derived from array position — never hardcode them.

Adding a third program is just another entry in the `courses` array; `src/pages/courses/[slug].astro`
generates its page from `getStaticPaths()`.

## Pages

- `/` — offline-first positioning, why-offline case, both programs, add-ons, day in the classroom, FAQ
- `/courses/` — both programs plus a side-by-side comparison
- `/courses/pg-diploma-hospital-administration/` — 7 modules, 60 chapters
- `/courses/diploma-hospital-administration/` — 4 modules, 38 chapters
- `/placements/` — placed students, trainees, hiring hospitals, video testimonials, graduation gallery
- `/campus/` — address, embedded map, facilities, how to reach Infopark
- `/about/` — why the institute stayed offline, values, how enrolment works
- `/contact/` — WhatsApp / phone / email / Instagram, per-program enquiry links
- `/404`

## Enquiries

There is no form backend. Every call-to-action opens WhatsApp with a message already written
for that specific program, or dials the number directly. `whatsappHref()` in `src/data/site.ts`
builds those links — change the number in one place and every link follows.

## Deploying

`npm run build` produces a fully static `dist/`. Drop it on Netlify, Vercel, Cloudflare Pages or
any static host — no Node runtime needed.

Before going live, set the real domain in `astro.config.mjs` (`site:`). It feeds the canonical
URLs, the sitemap and the JSON-LD.

## Images and video

Every image is resolved by **filename** through `src/lib/images.ts`, never imported directly.
A missing file is not an error — placement cards fall back to the student's initials, the
graduation gallery hides itself, accreditation chips show a text badge. Drop the file in with
the right name and it appears. `src/assets/README.md` lists every expected filename.

The layout is built photo-first. `src/components/Photo.astro` owns every editorial image slot:
supply `src/assets/photos/<name>.jpg` and it renders an optimised, responsive `<Image>`;
leave it out and it draws a gradient panel with an icon and caption. The panel gradient is
picked from a hash of the slot name so adjacent placeholders don't read as one flat slab.

**The site is designed around photography it does not yet have.** The placeholders are
deliberate, not decoration — filling `src/assets/photos/` is what turns this from a tidy layout
into a finished site. No stock photography is used anywhere: a stock classroom on a training
institute's site implies facilities that may not be yours.

Testimonial videos are YouTube IDs in `videoTestimonials`, played through a facade: the
thumbnail is a plain image and no YouTube iframe, script or cookie loads until the visitor
presses play.

## Notes

- Both diploma syllabi are transcribed from the official Sidhah brochures. Modules 1–4 are shared
  between the two programs and defined once in `src/data/courses.ts`.
- No fee figures or placement statistics appear anywhere on the site — those are handled on the
  call or the campus visit. Add them only when you have numbers you can stand behind.
- Structured data: `EducationalOrganization` on every page, `FAQPage` on the homepage, and
  `Course` with `courseMode: "Onsite"` on each program page.
