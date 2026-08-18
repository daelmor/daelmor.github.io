#!/usr/bin/env node
/**
 * Imports the Goodreads shelves into the `books` collection.
 *
 *   node scripts/import-books.mjs           dry run
 *   node scripts/import-books.mjs --apply   fetch covers and write
 *
 * Reads the three public shelf RSS feeds rather than scraping HTML, so the data
 * is structured and stable. Covers are downloaded into src/assets/books/ because
 * the site makes no external requests; hotlinking i.gr-assets.com would break
 * that and lean on Goodreads' bandwidth.
 *
 * The synopses are the publisher's copy, not David's. Every one is written with
 * `synopsisSource` beside it so the page can attribute it, and the schema makes
 * that pairing explicit rather than optional-by-accident.
 */

import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.cache', 'books');
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'books');
const ASSET_DIR = path.join(ROOT, 'src', 'assets', 'books');

const USER_ID = '35915255';
const SHELVES = ['read', 'currently-reading', 'to-read'];

const APPLY = process.argv.includes('--apply');
const REFRESH = process.argv.includes('--refresh');
const SHOW = (() => {
	const i = process.argv.indexOf('--show');
	return i === -1 ? null : process.argv[i + 1];
})();

const USER_AGENT = 'daelmor.github.io books-importer (one-off shelf import)';

// ---------------------------------------------------------------------------
// fetching
// ---------------------------------------------------------------------------

function curl(url, dest) {
	const res = spawnSync(
		'curl',
		['-sL', '--fail', '--max-time', '60', '-A', USER_AGENT, '-o', dest, url],
		{ encoding: 'utf8' },
	);
	return res.status === 0;
}

async function fetchShelf(shelf) {
	const file = path.join(CACHE, `${shelf}.xml`);
	if (existsSync(file) && !REFRESH) return readFile(file, 'utf8');
	await mkdir(CACHE, { recursive: true });
	const url = `https://www.goodreads.com/review/list_rss/${USER_ID}?shelf=${shelf}`;
	if (!curl(url, file)) throw new Error(`could not fetch the "${shelf}" shelf feed`);
	return readFile(file, 'utf8');
}

/** Covers are only fetched on --apply; a dry run should not hit the network. */
async function fetchCover(url, slug) {
	const ext = (path.extname(new URL(url).pathname) || '.jpg').toLowerCase();
	const file = path.join(CACHE, 'covers', `${slug}${ext}`);
	if (existsSync(file)) return { file, ext };

	await mkdir(path.dirname(file), { recursive: true });
	const tmp = `${file}.part`;
	for (let attempt = 0; attempt < 3; attempt += 1) {
		if (curl(url, tmp)) {
			const buf = await readFile(tmp);
			// Goodreads serves a "no cover" placeholder for editions without art.
			if (isImage(buf) && buf.length > 1500) {
				await rename(tmp, file);
				return { file, ext };
			}
			await rm(tmp, { force: true });
			return null;
		}
		await rm(tmp, { force: true });
		await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
	}
	return null;
}

function isImage(buf) {
	if (buf.length < 500) return false;
	const jpeg = buf[0] === 0xff && buf[1] === 0xd8;
	const png = buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG';
	return jpeg || png;
}

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------

function decode(s) {
	return s
		.replace(/<!\[CDATA\[/g, '')
		.replace(/\]\]>/g, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
		.trim();
}

function field(item, tag) {
	const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
	return m ? decode(m[1]) : '';
}

/** Kebab-case ASCII slug; accents stripped because these become URLs. */
function slugify(title, author) {
	const base = `${title} ${author}`
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	// Long titles make unreadable URLs; trim at a word boundary.
	return base.length <= 70 ? base : base.slice(0, 70).replace(/-[^-]*$/, '');
}

/**
 * Goodreads titles carry series and edition noise: "Sophie's World", "Morning
 * Star (Red Rising Saga, #3)", "Las 7 cuerdas de la lira (Spanish Edition)".
 * The parenthetical is kept as `series` where it is a series, and dropped where
 * it is only an edition note.
 */
function splitTitle(raw) {
	const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(raw);
	if (!m) return { title: raw, series: undefined };
	const [, title, paren] = m;
	if (/edition|spanish|english|paperback|hardcover|illustrated|annotated/i.test(paren)) {
		return { title: title.trim(), series: undefined };
	}
	return { title: title.trim(), series: paren.trim() };
}

/** Goodreads dates are RFC 822; keep the day only. */
function isoDate(value) {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.valueOf()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Which language a blurb is in, by counting function words.
 *
 * Roughly half these editions are Spanish and carry Spanish synopses. Marking
 * them lets assistive tech switch pronunciation instead of reading Spanish with
 * English phonetics.
 */
function detectLanguage(text) {
	const words = text.toLowerCase().match(/[a-záéíóúñü]+/g) ?? [];
	const ES = new Set(['de','la','el','que','y','en','los','las','un','una','por','con','del','su','al','como','para','es','se','lo','sus','este','esta']);
	const EN = new Set(['the','of','and','to','in','a','is','that','it','for','as','with','his','her','this','from','by','an','on','are','was','which']);
	let es = 0;
	let en = 0;
	for (const w of words) {
		if (ES.has(w)) es += 1;
		if (EN.has(w)) en += 1;
	}
	return es > en ? 'es' : 'en';
}

const yamlString = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Block scalar, so a multi-paragraph synopsis needs no escaping at all. */
function yamlBlock(key, value, indent = '  ') {
	const lines = String(value)
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	return [`${key}: |-`, ...lines.map((l) => `${indent}${l}`)].join('\n');
}

// ---------------------------------------------------------------------------
// planning
// ---------------------------------------------------------------------------

async function plan() {
	const books = [];
	const seen = new Map();

	for (const shelf of SHELVES) {
		const xml = await fetchShelf(shelf);
		const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
		if (!items.length) throw new Error(`the "${shelf}" feed returned no items`);

		for (const item of items) {
			const rawTitle = field(item, 'title');
			const author = field(item, 'author_name');
			if (!rawTitle) throw new Error(`an item on the "${shelf}" shelf has no title`);
			if (!author) throw new Error(`"${rawTitle}" has no author`);

			const { title, series } = splitTitle(rawTitle);
			let slug = slugify(title, author);

			// Two editions of the same book on different shelves would collide.
			if (seen.has(slug)) {
				const first = seen.get(slug);
				console.warn(`  ! "${title}" collides with "${first}" on slug ${slug}; suffixing`);
				slug = `${slug}-${field(item, 'book_id')}`;
			}
			seen.set(slug, title);

			const publishedRaw = field(item, 'book_published');
			const published = /^-?\d+$/.test(publishedRaw) ? Number(publishedRaw) : undefined;

			const ratingRaw = Number(field(item, 'user_rating'));
			// 0 on Goodreads means "not rated", which is not a rating of zero.
			const rating = Number.isInteger(ratingRaw) && ratingRaw > 0 ? ratingRaw : undefined;

			const pagesRaw = Number(field(item, 'num_pages'));
			const pages = Number.isInteger(pagesRaw) && pagesRaw > 0 ? pagesRaw : undefined;

			// The date the entry is sorted by: when it was read where that is
			// known, otherwise when it was added to the shelf.
			const readAt = isoDate(field(item, 'user_read_at'));
			const added = isoDate(field(item, 'user_date_added'));
			const date = readAt ?? added;
			if (!date) throw new Error(`"${title}" has neither a read date nor an added date`);

			books.push({
				shelf,
				slug,
				title,
				series,
				author,
				published,
				pages,
				rating,
				isbn: field(item, 'isbn') || undefined,
				readAt,
				added,
				date,
				synopsis: field(item, 'book_description') || undefined,
				review: field(item, 'user_review') || undefined,
				coverUrl: field(item, 'book_large_image_url') || field(item, 'book_image_url') || undefined,
				goodreads: (field(item, 'link') || '').split('?')[0] || undefined,
			});
		}
	}

	return books;
}

function frontMatter(book, coverExt) {
	const lines = [
		'---',
		`title: ${yamlString(book.title)}`,
		`bookAuthor: ${yamlString(book.author)}`,
		...(book.series ? [`tags:\n  - ${yamlString(book.series)}`] : []),
		`shelf: ${yamlString(book.shelf)}`,
		`date: ${book.date}`,
		...(book.published !== undefined ? [`published: ${book.published}`] : []),
		...(book.pages !== undefined ? [`pages: ${book.pages}`] : []),
		...(book.rating !== undefined ? [`rating: ${book.rating}`] : []),
		...(book.isbn ? [`isbn: ${yamlString(book.isbn)}`] : []),
		...(book.goodreads ? [`goodreads: ${yamlString(book.goodreads)}`] : []),
		...(coverExt
			? [
					`cover: ${yamlString(`../../assets/books/${book.slug}${coverExt}`)}`,
					`coverAlt: ${yamlString(`Cover of ${book.title} by ${book.author}`)}`,
				]
			: []),
		yamlBlock('summary', summaryFor(book)),
		...(book.synopsis
			? [
					yamlBlock('synopsis', book.synopsis),
					'synopsisSource: "Goodreads"',
					`synopsisLang: ${yamlString(detectLanguage(book.synopsis))}`,
				]
			: []),
		'---',
		'',
	];
	return lines.join('\n');
}

/**
 * The one-line description used in listings and the feed.
 *
 * Deliberately factual rather than a slice of the publisher's blurb: the
 * synopsis is credited separately on the page, and passing it off as the site's
 * own summary is exactly the confusion to avoid.
 */
function summaryFor(book) {
	const bits = [book.author];
	if (book.published !== undefined) {
		bits.push(book.published < 0 ? `${Math.abs(book.published)} BC` : String(book.published));
	}
	const shelfLabel = {
		read: 'Read',
		'currently-reading': 'Currently reading',
		'to-read': 'On the reading list',
	}[book.shelf];
	return `${shelfLabel} · ${bits.join(' · ')}`;
}

/** The body: David's own review if there is one, and nothing invented if not. */
function body(book) {
	if (book.review) return `${book.review}\n`;
	return '';
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function table(rows, headers) {
	const w = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)));
	const line = (c) => c.map((v, i) => String(v ?? '').padEnd(w[i])).join('  ');
	return [line(headers), line(w.map((n) => '-'.repeat(n))), ...rows.map(line)].join('\n');
}

async function main() {
	const books = await plan();

	if (SHOW) {
		const book = books.find((b) => b.slug === SHOW);
		if (!book) throw new Error(`unknown book "${SHOW}"`);
		console.log(frontMatter(book, '.jpg') + body(book));
		return;
	}

	console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — ${books.length} books\n`);

	const byShelf = SHELVES.map((s) => [s, books.filter((b) => b.shelf === s).length]);
	console.log('SHELVES');
	console.log(table(byShelf.map(([s, n]) => [s, String(n)]), ['shelf', 'books']));
	console.log();

	const noYear = books.filter((b) => b.published === undefined);
	const noSynopsis = books.filter((b) => !b.synopsis);
	const noCover = books.filter((b) => !b.coverUrl);
	const rated = books.filter((b) => b.rating !== undefined);
	const reviewed = books.filter((b) => b.review);

	console.log('COMPLETENESS');
	console.log(`  with a publication year : ${books.length - noYear.length}/${books.length}`);
	console.log(`  with a synopsis         : ${books.length - noSynopsis.length}/${books.length}`);
	console.log(`  with a cover image      : ${books.length - noCover.length}/${books.length}`);
	console.log(`  rated by David          : ${rated.length}/${books.length}`);
	console.log(`  reviewed by David       : ${reviewed.length}/${books.length}`);
	console.log();

	if (noYear.length) {
		console.log(`no publication year (rendered without one):`);
		for (const b of noYear) console.log(`  - ${b.title}`);
		console.log();
	}

	console.log('ATTRIBUTION');
	console.log(
		`  ${books.length - noSynopsis.length} synopses come from Goodreads, not from David.`,
	);
	console.log(`  Each is written with synopsisSource so the page credits it.`);
	console.log(
		`  ${reviewed.length} books carry a note of his own — the rest have an empty body.`,
	);
	console.log();

	if (!APPLY) {
		console.log('Re-run with --apply to fetch covers and write.\n');
		return;
	}

	await mkdir(CONTENT_DIR, { recursive: true });
	await mkdir(ASSET_DIR, { recursive: true });

	let covers = 0;
	for (const book of books) {
		let ext = null;
		if (book.coverUrl) {
			const got = await fetchCover(book.coverUrl, book.slug);
			if (got) {
				await writeFile(path.join(ASSET_DIR, `${book.slug}${got.ext}`), await readFile(got.file));
				ext = got.ext;
				covers += 1;
			}
		}
		await writeFile(
			path.join(CONTENT_DIR, `${book.slug}.md`),
			Buffer.from(frontMatter(book, ext) + body(book), 'utf8'),
		);
		process.stdout.write(ext ? '.' : 'o');
	}

	console.log(`\n\nwrote ${books.length} files, ${covers} covers.\n`);
}

main().catch((error) => {
	console.error(`\nimport failed: ${error.message}\n`);
	process.exitCode = 1;
});
