# Sidhah — website

Redesign of [sidhah.com](https://www.sidhah.com) as an Astro site, positioned around
**classroom-only** training. The old site's LMS/student login is deliberately gone: there are
no online batches, no student portal and no recorded content anywhere in this build.

Two things live here:

- **The public site** — every marketing page is prerendered to static HTML.
- **The staff dashboard** at `/admin` — a login-gated invoice generator, server-rendered and
  backed by Neon Postgres. It is for staff only; nothing on the public site links to it.

## Commands

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # type-check + build; static pages plus the /admin server routes
npm run preview  # serve the build locally
```

`npm run build` runs `astro check` first, so a type error fails the build.

The dashboard needs a database. For local work:

```bash
cp .env.example .env      # then fill in SESSION_SECRET (see the file)
npm run db:up             # Postgres + Neon's HTTP proxy in Docker
npm run db:setup          # create the tables, seed the course list
npm run db:admin          # create the first admin login (prompts)
```

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

The build is **hybrid**: marketing pages are prerendered to HTML, and only the routes that opt
out with `export const prerender = false` — all of `/admin` — run on a server. That means it
needs a host with a Node runtime.

**Vercel.** Connect the repo; the `@astrojs/vercel` adapter needs no extra config. Set two
environment variables in the project settings:

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Neon → your project → Connection Details → the **pooled** connection string |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

Then apply the schema against the production database once:

```bash
DATABASE_URL="<the Neon string>" npm run db:setup
DATABASE_URL="<the Neon string>" npm run db:admin
```

Changing `SESSION_SECRET` later logs every staff member out — that is the fastest way to revoke
all sessions at once.

**GitHub Pages** (`.github/workflows/deploy-preview.yml`) stays a marketing-only preview. It is
static hosting with no database, so the workflow deletes `src/pages/admin` and `src/middleware.ts`
before building — no admin route can ever be published to a host that cannot authenticate it.

Before going live, set the real domain in `astro.config.mjs` (`site:`). It feeds the canonical
URLs, the sitemap and the JSON-LD.

## Staff dashboard

`/admin` — the invoice generator. Not linked from anywhere public, `noindex` on every page,
disallowed in `robots.txt`, and gated by `src/middleware.ts`, which protects **everything** under
`/admin` by default. A new admin page is protected the moment it exists; only `/admin/login` is
listed as public.

| Screen | What it does |
| --- | --- |
| `/admin/login` | Username + password. Locks an account for 15 minutes after 8 failed attempts. |
| `/admin` | Totals, this month's billing, the last 8 invoices. |
| `/admin/invoices/new` | The form. Number and date fill in automatically. |
| `/admin/invoices/<id>` | Result page: download, share, create another, plus a live PDF preview. |
| `/admin/invoices` | History — search by name, phone or invoice number; filter by date. |
| `/admin/courses` | The dropdown's contents. Courses are hidden, never deleted. |
| `/admin/users` | Staff logins. Admin only. |

### How it is put together

- **Sessions** are a signed cookie (`userId.expiresAt.hmac`, HMAC-SHA256, 12 hours, httpOnly).
  There is no session table to read, so a page costs one query. Passwords are scrypt with the
  OWASP parameters; an unknown username is hashed anyway so response time cannot enumerate accounts.
- **Every form is CSRF-checked** with a token derived from the session cookie, plus an origin check.
- **Invoice numbers** are `SID-<year>-<00001>`, allocated inside the same `INSERT` that writes the
  row. A unique index on `(year, seq)` is the backstop and a loser retries — twelve simultaneous
  submissions produce twelve consecutive numbers with no gaps and no duplicates.
- **Invoices snapshot** the student and course details they were issued with. Renaming a course or
  correcting an address never rewrites a past invoice.
- **Students are keyed on phone number.** The same student enrolling again updates their record
  rather than creating a second one.

### The PDF

`src/lib/server/pdf.ts` draws it with `pdf-lib` — A4, the real logo, the palette from
`src/styles/global.css`, and Inter subsetted to Latin + `₹` (18 KB a weight, embedded as a data
URI so no filesystem is needed at request time). Amounts are grouped the Indian way and spelled
out in lakh/crore.

Nothing is stored: the PDF is redrawn from the invoice row on every request. There is no bucket,
no storage bill and no dead link — an invoice from three years ago downloads exactly like one from
this morning. The trade-off is that changing the template changes the look of past invoices too.

Because the font only covers Latin, the form rejects characters it cannot print rather than
letting a page of empty boxes go out.

### Sending it

**Download PDF** saves it. **Share on WhatsApp** uses the Web Share API where it exists — on a
phone that opens the native share sheet with the PDF already attached, which is the only way a web
page can hand WhatsApp a real file. On desktop there is no such API, so it opens `wa.me` with the
student's number and a prefilled message and the staff member attaches the file. Either way a
person confirms before anything sends; nothing goes out silently.

Sending the PDF automatically would mean the WhatsApp Business API — a Meta Business account, a
verified number, approved templates and a per-message cost.

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
