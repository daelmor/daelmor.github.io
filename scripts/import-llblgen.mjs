#!/usr/bin/env node
/**
 * Recovers the LLBLGening blog (2009–2011) from the Internet Archive into the
 * `tech` collection.
 *
 *   node scripts/import-llblgen.mjs           dry run: report only
 *   node scripts/import-llblgen.mjs --apply   fetch, convert and write
 *
 * llblgening.com is gone; these posts survive only as Wayback snapshots. The
 * fetch is therefore the slow part, and everything is cached under
 * `.cache/llblgen/` so a re-run is cheap and offline.
 *
 * Like the showcase migration, this refuses to invent anything: a post whose
 * title, date or body cannot be parsed aborts the run by name.
 */

import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.cache', 'llblgen');
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'tech');
const ASSET_DIR = path.join(ROOT, 'src', 'assets', 'tech');

/** Identifies this importer to the archive rather than posing as a browser. */
const USER_AGENT = 'daelmor.github.io llblgening-importer (one-off archive recovery)';

const APPLY = process.argv.includes('--apply');
const SHOW = (() => {
	const i = process.argv.indexOf('--show');
	return i === -1 ? null : process.argv[i + 1];
})();

/**
 * The posts worth recovering, with the Wayback snapshot that has the fullest
 * capture of each.
 *
 * Deliberately excluded:
 *  - `2011/04/new-exciting-content-is-coming-soon` — 134 words announcing
 *    posts that never arrived. Nothing to read.
 *  - the 2008 `/blogs/llblgening/*.aspx` posts — `aaaaa`, `this-is-a-test`
 *    and two `some-code-test` entries are scratch posts from setting the blog
 *    up, plus an earlier draft of the auditing article that the 2009 series
 *    supersedes.
 */
const POSTS = [
	{ slug: 'prefetchpaths-in-depth', archive: '2009/10/prefetchpaths-in-depth', ts: '20100301190843' },
	{
		slug: 'auditing-in-llblgen-pro-text-file',
		archive: '2009/08/auditing-in-llblgen-pro-text-file',
		ts: '20090915173527',
	},
	{
		slug: 'auditing-in-llblgen-pro-introduction',
		archive: '2009/08/auditing-in-llblgen-pro-introduction',
		ts: '20100117180819',
	},
	{
		slug: 'llblgen-pro-expressions-and-scalar-queries',
		archive: '2009/09/llblgen-pro-expressions-and-scalar-queries',
		ts: '20100227024558',
	},
	{
		slug: 'add-custom-calculated-fields-to-llblgen-objects',
		archive: '2009/09/add-custom-calculated-fields-to-llblgen-objects',
		ts: '20100101105508',
	},
	{
		slug: 'updateentitiesdirectly-with-order-by-and-limit',
		archive: '2009/08/updateentitiesdirectly-with-order-by-and-limit-mysql-specific',
		ts: '20100131042338',
	},
	{
		slug: 'change-catalog-name-in-llblgen-designer',
		archive: '2009/09/change-catalog-name-llblgen-designer',
		ts: '20090923143956',
	},
	{
		slug: 'llblgen-angte-released-on-codeplex',
		archive: '2011/06/llblgen-angte-released-on-codeplex',
		ts: '20150818022402',
	},
];

/** SyntaxHighlighter brush names → fence languages Shiki understands. */
const BRUSH = {
	csharp: 'csharp',
	'c#': 'csharp',
	sql: 'sql',
	xml: 'xml',
	vb: 'vb',
	vbnet: 'vb',
	js: 'javascript',
	jscript: 'javascript',
	javascript: 'javascript',
	plain: 'text',
	text: 'text',
	bash: 'bash',
};

/**
 * Pacing. The archive starts refusing connections after a few dozen rapid
 * requests, so this importer is deliberately slow and sequential rather than
 * parallel. Recovering thirty images takes minutes, and that is fine — it runs
 * once and caches everything.
 */
const PACE_MS = 700;
const THROTTLE_BACKOFF_MS = 4000;

// ---------------------------------------------------------------------------
// fetching, cached
// ---------------------------------------------------------------------------

async function cached(key, fetcher) {
	const file = path.join(CACHE, key);
	if (existsSync(file)) return readFile(file);
	await mkdir(path.dirname(file), { recursive: true });
	const data = await fetcher();
	if (data) await writeFile(file, data);
	return data;
}

async function fetchPost(post) {
	const buf = await cached(`${post.slug}.html`, async () => {
		const url = `https://web.archive.org/web/${post.ts}id_/http://www.llblgening.com/archive/${post.archive}/`;
		const tmp = path.join(CACHE, `${post.slug}.part`);
		await mkdir(CACHE, { recursive: true });
		for (let attempt = 0; attempt < 3; attempt += 1) {
			if (curlToFile(url, tmp)) {
				const data = await readFile(tmp);
				await rm(tmp, { force: true });
				if (data.includes('<div class="entry">')) return data;
			}
			await sleep(1200 * (attempt + 1));
		}
		throw new Error(`${post.slug}: could not retrieve a usable snapshot from the archive`);
	});
	return buf.toString('utf8');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Downloads a URL to a file with curl, returning true on success.
 *
 * curl rather than `fetch` on purpose. The archive answers requests for the
 * 2009 JPEGs with a redirect chain that undici rejects outright — `fetch`
 * throws "fetch failed" where `curl -L` retrieves the bytes without complaint.
 * Using fetch here silently reported 26 of 30 images as unarchived when only 9
 * were.
 */
function curlToFile(url, dest) {
	const res = spawnSync(
		'curl',
		['-sL', '--fail', '--max-time', '45', '-A', USER_AGENT, '-o', dest, url],
		{ encoding: 'utf8' },
	);
	if (res.status === 0) return 'ok';
	// 22 = HTTP >= 400 (a real answer: not archived at this snapshot).
	// 7 = could not connect, 28 = timed out, 52/56 = empty or broken reply.
	// Those mean the archive is throttling us, not that the file is missing.
	if ([7, 28, 52, 56, 35].includes(res.status ?? -1)) return 'throttled';
	return 'missing';
}

/** Identifies real image bytes, so an HTML error page is never saved as a JPEG. */
function isImage(buf) {
	if (buf.length < 500) return false;
	const b = buf;
	const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
	const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
	const gif = b.toString('ascii', 0, 3) === 'GIF';
	const webp = b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
	return jpeg || png || gif || webp;
}

/**
 * Asks the CDX index which captures of a URL exist, and what each one actually
 * contains.
 *
 * Returns an array of timestamps whose capture is a real image, or null if the
 * index itself could not be reached.
 *
 * This replaces guessing at snapshot years, which was worse than it looked.
 * llblgening.com lapsed and was parked, so Wayback's later captures of the 2009
 * image paths are GoDaddy parking pages served with HTTP 200 — a status-only
 * check counts those as recovered files. An early measurement reported 21 of 30
 * images recoverable on exactly that basis, and it was wrong. CDX reports the
 * mimetype of each capture, which settles it: a path whose only capture is
 * text/html was never archived as an image at all.
 */
async function imageCaptures(imgPath) {
	const key = `cdx/${path.basename(imgPath)}.txt`;
	const file = path.join(CACHE, key);

	if (!existsSync(file)) {
		await mkdir(path.dirname(file), { recursive: true });
		const url =
			'http://web.archive.org/cdx/search/cdx?url=' +
			encodeURIComponent(`llblgening.com${imgPath}`) +
			'&output=text&fl=timestamp,statuscode,mimetype&limit=40';
		const tmp = `${file}.part`;
		let ok = false;
		for (let attempt = 0; attempt < 3 && !ok; attempt += 1) {
			if (curlToFile(url, tmp) === 'ok') ok = true;
			else await sleep(THROTTLE_BACKOFF_MS * (attempt + 1));
		}
		if (!ok) {
			await rm(tmp, { force: true });
			return null;
		}
		await rename(tmp, file);
		await sleep(PACE_MS);
	}

	const text = await readFile(file, 'utf8');
	return text
		.split('\n')
		.map((line) => line.trim().split(/\s+/))
		.filter(([ts, status, mime]) => ts && status === '200' && mime?.startsWith('image/'))
		.map(([ts]) => ts);
}

/**
 * Fetches one image.
 *
 * Returns a Buffer, `'absent'` when CDX shows no capture that is actually an
 * image, or `'unverified'` when the archive would not answer at all — which
 * blocks `--apply`, because throttling must never be recorded as loss.
 */
async function fetchImage(imgPath) {
	const name = path.basename(imgPath);
	const file = path.join(CACHE, 'img', name);
	if (existsSync(file)) return readFile(file);

	const captures = await imageCaptures(imgPath);
	if (captures === null) return 'unverified';
	if (captures.length === 0) return 'absent';

	await mkdir(path.dirname(file), { recursive: true });
	const tmp = `${file}.part`;
	let sawRefusal = false;

	for (const ts of captures) {
		const url = `https://web.archive.org/web/${ts}id_/http://www.llblgening.com${imgPath}`;

		for (let attempt = 0; attempt < 3; attempt += 1) {
			const result = curlToFile(url, tmp);

			if (result === 'ok') {
				const buf = await readFile(tmp);
				if (isImage(buf)) {
					await rename(tmp, file);
					return buf;
				}
				await rm(tmp, { force: true });
				break;
			}

			await rm(tmp, { force: true });
			if (result === 'missing') break;

			sawRefusal = true;
			await sleep(THROTTLE_BACKOFF_MS * (attempt + 1));
		}
		await sleep(PACE_MS);
	}

	// CDX promised an image and the fetch never delivered one.
	return sawRefusal ? 'unverified' : 'absent';
}

// ---------------------------------------------------------------------------
// HTML → Markdown
// ---------------------------------------------------------------------------

const decode = (s) =>
	s
		.replace(/&nbsp;/g, ' ')
		.replace(/&raquo;/g, '»')
		.replace(/&laquo;/g, '«')
		.replace(/&#8217;|&rsquo;/g, '’')
		.replace(/&#8216;|&lsquo;/g, '‘')
		.replace(/&#8220;|&ldquo;/g, '“')
		.replace(/&#8221;|&rdquo;/g, '”')
		.replace(/&#8211;|&ndash;/g, '–')
		.replace(/&#8212;|&mdash;/g, '—')
		.replace(/&#039;|&#39;|&apos;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');

const textOf = (html) =>
	decode(html.replace(/<[^>]+>/g, ' '))
		.replace(/\s+/g, ' ')
		.trim();

/** Escapes the few characters that would otherwise be Markdown syntax. */
const escapeMd = (s) => s.replace(/([*_`[\]])/g, '\\$1');

function parseDate(html, slug) {
	// "This entry was posted on Thursday, October 1st, 2009 at 03:00" — the
	// theme puts newlines and tabs between "posted" and "on", so the whitespace
	// between every token has to be flexible.
	const m = /posted\s+on\s+\w+,\s+(\w+)\s+(\d{1,2})\w*,\s+(\d{4})/.exec(html);
	if (!m) throw new Error(`${slug}: cannot find the publication date`);
	const [, monthName, day, year] = m;
	const month = new Date(`${monthName} 1, 2000`).getMonth();
	if (Number.isNaN(month)) throw new Error(`${slug}: unrecognised month "${monthName}"`);
	return new Date(Date.UTC(Number(year), month, Number(day)))
		.toISOString()
		.slice(0, 10);
}

/**
 * The post's own categories and tags.
 *
 * Scoped to the postmetadata line, NOT the whole page. The sidebar carries a
 * tag cloud and a category list for the entire blog, so searching the document
 * gave every post the same thirteen tags.
 */
function parseTags(html) {
	const start = html.indexOf('postmetadata');
	if (start === -1) return [];
	// The metadata line ends at the closing paragraph.
	const end = html.indexOf('</p>', start);
	const meta = html.slice(start, end === -1 ? start + 1200 : end);

	const tags = new Set();
	for (const m of meta.matchAll(/\/archive\/(?:tag|category)\/([a-z0-9-]+)\//gi)) {
		tags.add(m[1].toLowerCase());
	}
	// Applied to everything; says nothing.
	tags.delete('uncategorized');
	return [...tags].sort();
}

/**
 * The post title.
 *
 * Taken from <title>, because the theme is inconsistent across snapshots: on
 * some captures <h1> is the post title, on others it is the site name with the
 * post title in an <h2>. The <title> tag is reliably
 * "LLBLGen'ing » Blog Archive » Real Title", so the last segment is the one.
 */
function parseTitle(html, slug) {
	const raw = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1];
	if (raw) {
		const parts = textOf(raw)
			.split('»')
			.map((p) => p.trim())
			.filter(Boolean);
		const last = parts.at(-1);
		if (last && !/^LLBLGen'?ing$/i.test(last)) return last;
	}

	for (const re of [/<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i, /<h1[^>]*>([\s\S]*?)<\/h1>/i]) {
		const t = textOf(re.exec(html)?.[1] ?? '');
		if (t && !/^LLBLGen'?ing$/i.test(t)) return t;
	}

	throw new Error(`${slug}: cannot determine the post title from the snapshot`);
}

/**
 * Converts one post body to Markdown.
 *
 * Handled in a deliberate order: code blocks and figures are pulled out into
 * placeholders first, so their contents can never be mangled by the inline
 * formatting passes that follow.
 */
function toMarkdown(body, ctx) {
	let s = body;
	const blocks = [];
	const stash = (text) => {
		blocks.push(text);
		return ` BLOCK${blocks.length - 1} `;
	};

	// --- code blocks --------------------------------------------------------
	s = s.replace(/<pre[^>]*class="[^"]*brush:\s*([a-z#]+)[^"]*"[^>]*>([\s\S]*?)<\/pre>/gi, (_m, brush, code) => {
		const lang = BRUSH[brush.toLowerCase()] ?? 'text';
		const text = decode(code.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(
			/^\n+|\n+$/g,
			'',
		);
		return stash(`\n\`\`\`${lang}\n${text}\n\`\`\`\n`);
	});
	s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, code) => {
		const text = decode(code.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(
			/^\n+|\n+$/g,
			'',
		);
		return stash(`\n\`\`\`text\n${text}\n\`\`\`\n`);
	});

	// --- figures (WordPress caption blocks) ---------------------------------
	s = s.replace(
		/<div[^>]*class="[^"]*wp-caption[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
		(_m, inner) => {
			const img = /<img[^>]*>/i.exec(inner);
			if (!img) return '';
			const caption = textOf(/<p[^>]*class="wp-caption-text"[^>]*>([\s\S]*?)<\/p>/i.exec(inner)?.[1] ?? '');
			return stash(imageMarkdown(img[0], ctx, caption));
		},
	);

	// --- bare images --------------------------------------------------------
	s = s.replace(/<a[^>]*>\s*(<img[^>]*>)\s*<\/a>/gi, (_m, img) => stash(imageMarkdown(img, ctx, '')));
	s = s.replace(/<img[^>]*>/gi, (img) => stash(imageMarkdown(img, ctx, '')));

	// --- block structure ----------------------------------------------------
	s = s.replace(/<div class="entry">/i, '');
	s = s.replace(/<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level, inner) => {
		// Bodies start at h2 under the page h1, so levels carry over unchanged.
		const hashes = '#'.repeat(Math.min(Number(level), 6));
		return `\n\n${hashes} ${inline(textOf(inner))}\n\n`;
	});

	s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner) => `LI${inline(collapse(inner))}\n`);
	s = s.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n\n');
	s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) =>
		`\n\n${textOf(inner)
			.split('\n')
			.map((l) => `> ${l}`)
			.join('\n')}\n\n`,
	);
	s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => `\n\n${inline(collapse(inner))}\n\n`);
	s = s.replace(/<br\s*\/?>/gi, '\n');
	s = s.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');

	// --- leftovers ----------------------------------------------------------
	s = inline(s);
	s = s.replace(/<[^>]+>/g, '');
	s = decode(s);

	// Restore list markers and stashed blocks.
	s = s.replace(/LI/g, '- ');
	s = s.replace(/ BLOCK(\d+) /g, (_m, i) => blocks[Number(i)]);

	return s
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/^\n+/, '')
		.trim();
}

const collapse = (s) => s.replace(/\s+/g, ' ').trim();

/** Inline formatting: emphasis, code, links. */
function inline(s) {
	return s
		.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `**${textOf(inner)}**`)
		.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `_${textOf(inner)}_`)
		.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner) => `\`${textOf(inner)}\``)
		.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
			const label = textOf(inner);
			if (!label) return '';
			const url = rewriteLink(href);
			// An in-page anchor to a table of contents we no longer render.
			if (url.startsWith('#')) return label;
			return `[${label}](${url})`;
		});
}

/** Points old links at something that still resolves. */
function rewriteLink(href) {
	let url = decode(href.trim());
	// Strip any Wayback prefix the snapshot introduced.
	url = url.replace(/^https?:\/\/web\.archive\.org\/web\/\d+\w*\//, '');

	const internal = /^https?:\/\/(?:www\.)?llblgening\.com\/archive\/\d{4}\/\d{2}\/([a-z0-9-]+)/i.exec(url);
	if (internal) {
		const match = POSTS.find((p) => p.archive.endsWith(internal[1]));
		// Recovered posts link to each other; the rest go to the archive.
		if (match) return `/tech/${match.slug}/`;
		return `https://web.archive.org/web/2012/http://www.llblgening.com/archive/${internal[1]}/`;
	}

	// Anything else on the dead domain can only be served by the archive.
	if (/^https?:\/\/(?:www\.)?llblgening\.com/i.test(url)) {
		return url.replace(/^https?:\/\/(?:www\.)?llblgening\.com/i, 'https://web.archive.org/web/2012/http://www.llblgening.com');
	}
	return url;
}

function imageMarkdown(imgTag, ctx, caption) {
	const src = /src="([^"]+)"/i.exec(imgTag)?.[1];
	if (!src) return '';
	const clean = decode(src)
		.replace(/^https?:\/\/web\.archive\.org\/web\/\d+\w*\//, '')
		.replace(/^https?:\/\/(?:www\.)?llblgening\.com/i, '');
	if (!clean.startsWith('/')) return '';

	// Alt text as written in 2009, falling back to the caption or title.
	const alt =
		textOf(/alt="([^"]*)"/i.exec(imgTag)?.[1] ?? '') ||
		caption ||
		textOf(/title="([^"]*)"/i.exec(imgTag)?.[1] ?? '');

	ctx.images.push({ path: clean, alt, caption });

	const name = path.basename(clean);
	const rel = `../../assets/tech/${ctx.slug}/${name}`;
	const fig = `\n\n![${escapeMd(alt)}](${rel})`;
	return caption && caption !== alt ? `${fig}\n\n_${escapeMd(caption)}_\n\n` : `${fig}\n\n`;
}

// ---------------------------------------------------------------------------
// per-post plan
// ---------------------------------------------------------------------------

function yamlString(v) {
	return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** First sentences of the lead paragraph, as the post's own summary. */
function deriveSummary(markdown, slug) {
	const para = markdown
		.split('\n\n')
		.map((p) => p.trim())
		.find((p) => p && !p.startsWith('#') && !p.startsWith('!') && !p.startsWith('```') && !p.startsWith('-'));
	if (!para) throw new Error(`${slug}: cannot derive a summary — no lead paragraph`);

	const plain = para.replace(/[*_`]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
	let out = '';
	for (const sentence of plain.split(/(?<=\.)\s+/)) {
		if (out && (out + ' ' + sentence).length > 220) break;
		out = out ? `${out} ${sentence}` : sentence;
	}
	out = out.trim();
	if (!/[.!?]$/.test(out)) out += '.';
	return out;
}

async function planPost(post) {
	const html = await fetchPost(post);

	const title = parseTitle(html, post.slug);

	const start = html.indexOf('<div class="entry">');
	if (start === -1) throw new Error(`${post.slug}: no entry body in the snapshot`);
	const end = html.indexOf('postmetadata', start);
	const body = html.slice(start, end === -1 ? undefined : end);

	const date = parseDate(html, post.slug);
	const tags = parseTags(html);

	const ctx = { slug: post.slug, images: [] };
	const markdown = toMarkdown(body, ctx);
	const summary = deriveSummary(markdown, post.slug);

	const words = markdown.split(/\s+/).filter(Boolean).length;
	if (words < 120) throw new Error(`${post.slug}: only ${words} words after conversion — check the snapshot`);

	const frontMatter = [
		'---',
		`title: ${yamlString(title)}`,
		`summary: ${yamlString(summary)}`,
		`date: ${date}`,
		...(tags.length ? ['tags:', ...tags.map((t) => `  - ${yamlString(t)}`)] : []),
		`source: ${yamlString(`http://www.llblgening.com/archive/${post.archive}/`)}`,
		`sourceArchive: ${yamlString(`https://web.archive.org/web/${post.ts}/http://www.llblgening.com/archive/${post.archive}/`)}`,
		'---',
		'',
	].join('\n');

	return { ...post, title, date, tags, summary, markdown, frontMatter, images: ctx.images, words };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function table(rows, headers) {
	const w = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)));
	const line = (cells) => cells.map((c, i) => String(c ?? '').padEnd(w[i])).join('  ');
	return [line(headers), line(w.map((n) => '-'.repeat(n))), ...rows.map(line)].join('\n');
}

async function main() {
	console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — recovering ${POSTS.length} posts from the Internet Archive\n`);

	const plans = [];
	for (const post of POSTS) {
		plans.push(await planPost(post));
		process.stdout.write('.');
	}
	console.log('\n');

	if (SHOW) {
		const plan = plans.find((p) => p.slug === SHOW);
		if (!plan) throw new Error(`unknown post "${SHOW}"`);
		console.log(plan.frontMatter + plan.markdown);
		return;
	}

	console.log('POSTS');
	console.log(
		table(
			plans.map((p) => [p.date, p.slug, String(p.words), String(p.images.length), p.tags.join(' ')]),
			['date', 'slug', 'words', 'imgs', 'tags'],
		),
	);
	console.log();

	// Images must be fetched to learn which ones the archive still holds.
	// Sequential and paced on purpose; see PACE_MS.
	console.log('IMAGES   . recovered   x absent   ? archive would not answer');
	const absent = [];
	const unverified = [];
	for (const plan of plans) {
		for (const img of plan.images) {
			const data = await fetchImage(img.path);
			if (data === 'absent') {
				absent.push({ slug: plan.slug, ...img });
				process.stdout.write('x');
			} else if (data === 'unverified') {
				unverified.push({ slug: plan.slug, ...img });
				process.stdout.write('?');
			} else {
				process.stdout.write('.');
			}
		}
	}
	console.log('\n');

	const total = plans.reduce((n, p) => n + p.images.length, 0);
	console.log(`recovered ${total - absent.length - unverified.length} of ${total} images.`);

	if (absent.length) {
		console.log(`\n${absent.length} confirmed absent from every snapshot tried:`);
		for (const m of absent) console.log(`  x ${m.slug}: ${path.basename(m.path)}`);
		console.log('  Their figures are dropped, and each post records how many are missing.');
	}

	if (unverified.length) {
		console.error(`\nBLOCKED — ${unverified.length} image(s) could not be checked at all:`);
		for (const m of unverified) console.error(`  ? ${m.slug}: ${path.basename(m.path)}`);
		console.error(
			'\nThe archive refused the connection rather than answering, which means it is\n' +
				'throttling us, not that the files are gone. Writing now would discard figures\n' +
				'that do survive. Wait a while and re-run — everything already fetched is\n' +
				'cached, so a re-run only retries these.\n',
		);
		process.exitCode = 1;
		return;
	}
	console.log();

	if (!APPLY) {
		console.log('Re-run with --apply to write.\n');
		return;
	}

	await mkdir(CONTENT_DIR, { recursive: true });
	for (const plan of plans) {
		const dir = path.join(ASSET_DIR, plan.slug);
		let kept = 0;
		let body = plan.markdown;

		for (const img of plan.images) {
			const data = await fetchImage(img.path);
			const name = path.basename(img.path);
			if (data !== 'absent' && data !== 'unverified') {
				await mkdir(dir, { recursive: true });
				await writeFile(path.join(dir, name), data);
				kept += 1;
			} else {
				// Drop the figure rather than ship a broken image reference.
				const rel = `../../assets/tech/${plan.slug}/${name}`;
				body = body
					.split('\n')
					.filter((line) => !line.includes(rel))
					.join('\n')
					.replace(/\n{3,}/g, '\n\n');
			}
		}

		const lostHere = plan.images.length - kept;
		const note = lostHere
			? `\n\n> ${lostHere} of this post's ${plan.images.length} figures were not preserved by the Internet Archive and are missing here.\n`
			: '';

		await writeFile(
			path.join(CONTENT_DIR, `${plan.slug}.md`),
			Buffer.from(plan.frontMatter + body + note + '\n', 'utf8'),
		);
		console.log(`  wrote src/content/tech/${plan.slug}.md  (${kept}/${plan.images.length} images)`);
	}
	console.log('\nDone.\n');
}

main().catch((error) => {
	console.error(`\nimport failed: ${error.message}\n`);
	process.exitCode = 1;
});
