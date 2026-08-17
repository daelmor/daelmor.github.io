# daelmor.github.io

Personal site of David Elizondo — engineering write-ups on payments, invoicing
and ledger infrastructure.

Built with [Astro](https://astro.build) 7, TypeScript in strict mode, and no
client-side JavaScript. Deployed to GitHub Pages by GitHub Actions.

## Running locally

Requires Node 22.12 or newer.

```bash
npm install
npm run dev        # dev server, http://localhost:4321
```

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload. Drafts are visible here. |
| `npm run build` | Production build into `dist/`. Drafts are excluded. |
| `npm run preview` | Serves the built `dist/` locally. |
| `npm run check` | Type-checks every `.astro` and `.ts` file. |
| `npm run migrate` | Dry run of the archive migration (see [Provenance](#provenance)). |

`npm run build` is the gate. It fails loudly, naming the file, if any entry is
missing a required field — a missing `date` or `title` is never defaulted to
something plausible.

## Adding a note

Every collection lives in `src/content/<collection>/`. Drop in a `.md` or
`.mdx` file; the filename becomes the URL slug, so keep it kebab-case ASCII.
The route, the RSS entry and the sitemap URL all appear automatically.

Four of the five collections are currently empty. **A section stays hidden from
the nav until it has at least one entry**, so adding your first file is what
makes it appear.

Fields shared by all five: `title`, `summary`, `date` (the sort key, newest
first), plus optional `tags` and `draft`.

### `projects` — engineering write-ups

```yaml
---
title: 'Payments Service' # without the company
company: 'Hugo'
role: 'Senior Backend Engineer'
summary: 'One or two sentences. Shown on cards and in the feed.'
date: 2020-03-01 # when the engagement BEGAN — this is the sort key
end: 2021-08-31 # or `null` if it is ongoing. Required either way.
hero: '../../assets/projects/hugo-payments-service/hero.png'
heroAlt: 'Describe what the image shows, not the project title.'
tech:
  - '.NET'
  - 'AWS (S3, EC2, RDS)'
source: 'https://example.com/original' # optional, kept for provenance, not rendered
---
```

`date` is the **start** of the engagement, not the end. Sorting on the end date
collapses every ongoing project into a tie at today's date, which ranked a 2017
engagement above current work.

`end: null` has to be written out explicitly. It is required but nullable, so a
project cannot acquire "Present" by having the field omitted.

### `tech` — technical writing

```yaml
---
title: 'Reconciling a ledger without locks'
summary: 'One or two sentences.'
date: 2026-08-17
hero: '../../assets/tech/some-post/diagram.png' # optional
heroAlt: 'Required if hero is set.'
tags: ['postgres', 'concurrency']
---
```

### `philosophy` — essays

```yaml
---
title: 'On tools that outlive their makers'
summary: 'One or two sentences.'
date: 2026-08-17
---
```

### `books` — reading notes

```yaml
---
title: 'Seeing Like a State'
bookAuthor: 'James C. Scott' # required — the book's author, not yours
published: 1998 # optional, the book's publication year
summary: 'One or two sentences.'
date: 2026-08-17 # when you read it
cover: '../../assets/books/seeing-like-a-state/cover.jpg' # optional
coverAlt: 'Required if cover is set.'
---
```

### `music` — analysis and theory

```yaml
---
title: 'The Ring leitmotifs as a call graph'
work: 'Der Ring des Nibelungen' # optional
composer: 'Richard Wagner' # optional
summary: 'One or two sentences.'
date: 2026-08-17
---
```

## Images

Images go in `src/assets/<collection>/<slug>/` and are referenced by **relative
path** from the Markdown file, so Astro can optimise them:

```markdown
![A filtered invoice list](../../assets/projects/my-project/invoices.png)
```

That gives you responsive `srcset`, WebP conversion and content-hashed
filenames for free. In this repo it takes 9.7 MB of source images down to a few
hundred kB of delivered variants — one 1098 kB PNG becomes 87 kB.

**Do not put images in `public/`.** Files there are copied verbatim, with no
optimisation. There is exactly one deliberate exception:
`public/m1nt-animation-es.gif`, because sharp flattens animated GIFs to their
first frame, and routing it through the pipeline would silently kill the
animation. Reference that one with an absolute path (`/m1nt-animation-es.gif`).

Always write real `alt` text. **24 of the 31 migrated images currently have
`alt=""`**, inherited from the original export — that is a known gap, not a
pattern to copy.

## Deployment

`.github/workflows/deploy.yml` builds and publishes on every push to `main`,
and can be run manually from the Actions tab.

One-time repository setup:

1. Rename the repository to **`daelmor.github.io`**. It is a GitHub *user*
   site, served from the domain root, which is why `astro.config.mjs` sets
   `site` but deliberately **does not set `base`**.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
   Not "Deploy from a branch".

## Attaching a custom domain

Configure the domain in **Settings → Pages → Custom domain**. Do not add a
`CNAME` file to the repository — when publishing from a custom Actions
workflow, GitHub ignores it and does not need it.

Then update `site` in `astro.config.mjs` to the new origin, so canonical URLs,
Open Graph tags, the sitemap and the RSS feed all point at the right host.
Nothing else needs changing.

### DNS records

For an **apex domain** (`example.com`) — four A records:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

And, for IPv6, four AAAA records:

| Type | Name | Value |
| --- | --- | --- |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

For a **subdomain** (`www.example.com`, `blog.example.com`) — one record
instead of all of the above:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `daelmor.github.io` |

If your DNS provider supports `ALIAS` or `ANAME` at the apex, a single
`ALIAS @ → daelmor.github.io` can replace the eight A/AAAA records and will
keep working if GitHub ever changes those IPs.

After DNS propagates, tick **Enforce HTTPS** in Settings → Pages.

## Provenance

The seven project write-ups were archived from `theseusthread.com/showcase`
before that site was retired. The original export is still in `projects/` and
`manifest.json`, untouched, and `scripts/migrate.mjs` regenerates
`src/content/projects/` from it:

```bash
npm run migrate                              # dry run: prints every change
npm run migrate:apply                        # writes
node scripts/migrate.mjs --show <slug>        # print one transformed file
```

The script never edits `projects/`, so it stays re-runnable, and it refuses to
invent data — anything it cannot derive aborts the run naming the file.

Beyond moving images and rewriting paths, it strips content the layout now
renders from front matter: the H1, the blockquote restating the summary, the
hero image, the role, the duration and the "Technologies Used" list. It also
promotes every heading one level, because the bodies started at `###` and
skipped `H2` under the page title.

Once you are happy with `src/content/`, `projects/`, `manifest.json` and
`scripts/migrate.mjs` can all be deleted — the history keeps the originals.

### Known content gaps

Carried over from the archive, none of which block the build:

- 24 of 31 images have empty `alt` attributes, and all seven `heroAlt` values
  just repeat the project title.
- Hugo FinTech Wallet App's three "Key Achievements" are word-for-word
  identical to n1co's.
- The n1co `summary` is truncated mid-sentence (`…that supported key
  functionalities`) with no full stop.
- The Fegora article ends with three flattened Ghost bookmark cards, one of
  which presents GitHub's own repository description as prose. It also contains
  one Spanish paragraph inside an otherwise English page, which should carry
  `lang="es"`.
