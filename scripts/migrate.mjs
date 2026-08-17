#!/usr/bin/env node
/**
 * Migrates the archived theseusthread.com showcase in `projects/` into Astro
 * content collections.
 *
 *   node scripts/migrate.mjs          dry run: print every change, write nothing
 *   node scripts/migrate.mjs --apply  perform the migration
 *
 * Re-runnable and idempotent: `--apply` overwrites its own output and never
 * touches `projects/`, so the original archive stays intact in git for as long
 * as you want it there.
 *
 * It refuses to invent data. Anything it cannot derive from the source files is
 * collected as a blocker, listed by file, and aborts the run.
 */

import { Buffer } from 'node:buffer';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'projects');
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'projects');
const ASSET_DIR = path.join(ROOT, 'src', 'assets', 'projects');
const PUBLIC_DIR = path.join(ROOT, 'public');

const APPLY = process.argv.includes('--apply');
/** `--show <slug>` prints one fully transformed file to stdout and exits. */
const SHOW = (() => {
	const i = process.argv.indexOf('--show');
	return i === -1 ? null : process.argv[i + 1];
})();

/**
 * Facts about each project, transcribed here so they are reviewable in one place
 * instead of buried in regexes.
 *
 *   start  becomes the `date` field — the sort key, when the engagement began.
 *   end    becomes the `end` field — null means ongoing.
 *
 * `start` is never guessed: a null aborts the run naming the file.
 *
 * Where these disagree with the archived body prose, the values below win and
 * the script rewrites the prose to match. The archive's own duration lines were
 * demonstrably unreliable — one ran backwards, one was an unfilled placeholder,
 * and two described engagements as finished that are in fact ongoing.
 */
const PROJECT_META = {
	'n1co-fintech-app': {
		company: 'n1co',
		title: 'FinTech App',
		role: 'Senior Software Architect',
		// Confirmed: "2023 - present". Supersedes the archive's
		// "October 2022 – November 2023", which was both stale and closed.
		start: '2023-01-01',
		end: null,
		note: 'Start year confirmed as 2023 but no month given; using January. The archive said October 2022.',
	},
	'hugo-delivery-service': {
		company: 'Hugo',
		title: 'Delivery Service',
		role: 'Senior Backend Engineer, Delivery Services',
		// "August 2021 – September 2022"
		start: '2021-08-01',
		end: '2022-09-30',
	},
	'hugo-fintech-wallet-app': {
		company: 'Hugo',
		title: 'FinTech Wallet App',
		role: 'Senior Backend Engineer',
		// "March 2020 – August 2021"
		start: '2020-03-01',
		end: '2021-08-31',
	},
	'hugo-payments-service': {
		company: 'Hugo',
		title: 'Payments Service',
		role: 'Senior Backend Engineer, Payments Service',
		// "March 2020 – August 2021"
		start: '2020-03-01',
		end: '2021-08-31',
	},
	'fegora-digital-invoicing': {
		company: 'Fegora',
		title: 'Digital Invoicing',
		role: 'Co-Founder & Software Architect',
		// Confirmed: "2011 aug - present". Supersedes the archive's
		// "August 2011 – 2019". Consistent with the body's claim of 15 years
		// of technical support.
		start: '2011-08-01',
		end: null,
	},
	'nicetech-heyy-fintech-ecosystem': {
		company: 'Nicetech',
		title: 'Heyy FinTech ecosystem',
		role: 'Senior Software Architect',
		// Confirmed: "2019 march - 2022 nov". Replaces the archive's reversed
		// "August 2021 – December 2019".
		start: '2019-03-01',
		end: '2022-11-30',
	},
	'tigo-selfservice-web-portal': {
		company: 'Tigo',
		title: 'SelfService Web Portal',
		role: 'Lead Developer',
		// Confirmed: "2017 june - present (the project is in use)". Replaces the
		// archive's "[Specify Duration]" placeholder.
		start: '2017-06-01',
		end: null,
		note: 'Marked ongoing because the system is still in use — confirm whether that describes the deployment or your engagement.',
	},
};

/**
 * Animated GIFs cannot go through `src/assets/`: sharp flattens them to their
 * first frame. This one file is served unoptimised from `public/` instead.
 */
const ANIMATED_PASSTHROUGH = new Set(['m1nt-animation-es.gif']);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Minimal, strict front-matter reader. Throws on anything it does not expect. */
function parseFrontMatter(raw, file) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) throw new Error(`${file}: no YAML front matter`);

	const data = {};
	for (const line of match[1].split(/\r?\n/)) {
		if (!line.trim()) continue;
		const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
		if (!kv) throw new Error(`${file}: cannot parse front-matter line: ${line}`);
		let value = kv[2].trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		data[kv[1]] = value;
	}
	return { data, body: raw.slice(match[0].length) };
}

/** Kebab-case ASCII. Accents are stripped even though the corpus has none. */
function normaliseFilename(name) {
	const ext = path.extname(name).toLowerCase();
	const stem = name
		.slice(0, name.length - path.extname(name).length)
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // combining accents
		.replace(/[^\w.-]+/g, '-')
		.replace(/_/g, '-')
		.toLowerCase()
		.replace(/-{2,}/g, '-')
		.replace(/^[-.]+|[-.]+$/g, '');
	return `${stem}${ext}`;
}

/** Split on a delimiter, ignoring delimiters nested inside parentheses. */
function splitTopLevel(input, delimiter = ',') {
	const out = [];
	let depth = 0;
	let current = '';
	for (const char of input) {
		if (char === '(') depth += 1;
		else if (char === ')') depth = Math.max(0, depth - 1);
		if (char === delimiter && depth === 0) {
			out.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	out.push(current);
	return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * Pull the "Technologies Used" bullets into a flat, de-duplicated list.
 * Handles both heading styles present in the archive and is parenthesis-aware,
 * so "AWS (S3, EC2, RDS)" survives as one entry.
 */
function extractTech(body, file) {
	const heading = /^(?:#{2,4}\s*)?\*\*Technologies Used:?\*\*:?\s*$/m.exec(body);
	if (!heading) throw new Error(`${file}: no "Technologies Used" section`);

	const rest = body.slice(heading.index + heading[0].length);
	const items = [];
	for (const line of rest.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed) {
			if (items.length) break;
			continue;
		}
		if (!trimmed.startsWith('-')) break;
		const withoutCategory = trimmed
			.replace(/^-\s*/, '')
			.replace(/^\*\*[^*]+:?\*\*:?\s*/, '');
		items.push(...splitTopLevel(withoutCategory).map((s) => s.replace(/\.$/, '')));
	}

	const seen = new Set();
	const unique = [];
	for (const item of items) {
		const key = item.toLowerCase();
		if (!seen.has(key)) {
			seen.add(key);
			unique.push(item);
		}
	}
	if (!unique.length) throw new Error(`${file}: "Technologies Used" section is empty`);
	return unique;
}

/** Double-quoted YAML scalar. */
function yamlString(value) {
	return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// ---------------------------------------------------------------------------
// per-project transform
// ---------------------------------------------------------------------------

async function planProject(slug) {
	const dir = path.join(SRC_DIR, slug);
	const file = path.join(dir, 'index.md');
	const rel = path.relative(ROOT, file).replace(/\\/g, '/');

	const meta = PROJECT_META[slug];
	if (!meta) throw new Error(`${rel}: no entry in PROJECT_META`);

	const raw = await readFile(file, 'utf8');
	const { data, body } = parseFrontMatter(raw, rel);

	for (const field of ['title', 'summary', 'hero']) {
		if (!data[field]) throw new Error(`${rel}: required front-matter field "${field}" is missing`);
	}

	// --- images -------------------------------------------------------------
	const files = (await readdir(dir)).filter((f) => f !== 'index.md');
	const renames = [];
	const taken = new Map();
	for (const original of files.sort()) {
		const next = normaliseFilename(original);
		if (taken.has(next)) {
			throw new Error(`${rel}: "${original}" and "${taken.get(next)}" both normalise to "${next}"`);
		}
		taken.set(next, original);
		renames.push({
			original,
			next,
			passthrough: ANIMATED_PASSTHROUGH.has(original),
			changed: original !== next,
		});
	}
	const renameOf = new Map(renames.map((r) => [r.original, r]));

	/** Where a given source image ends up, as referenced from the .md file. */
	function referenceFor(original) {
		const entry = renameOf.get(original);
		if (!entry) throw new Error(`${rel}: references missing image "${original}"`);
		// public/ assets are absolute-rooted and bypass the image pipeline.
		return entry.passthrough
			? `/${entry.next}`
			: `../../assets/projects/${slug}/${entry.next}`;
	}

	// --- body ---------------------------------------------------------------
	let out = body;

	// The archive opens every article with an H1, a blockquote restating the
	// summary, and the hero image — all three of which the layout now renders
	// from front matter. Strip them so they are not shown twice.
	out = out.replace(/^\s*#\s+.+\r?\n+/, '');
	out = out.replace(/^>\s.+(?:\r?\n>.*)*\r?\n+/, '');
	out = out.replace(/^!\[[^\]]*\]\(\.\/[^)]+\)\r?\n+/, '');

	// Every body heading starts at level 3, which skips a level under the page
	// H1. Promote the whole tree one step so the outline is valid.
	out = out.replace(/^#{3}(#*)\s/gm, '##$1 ');

	// The archive states the role twice more, in two different shapes:
	//
	//   style A   ## **Senior Software Architect**        (heading)
	//             October 2022 – November 2023            (bare date line)
	//
	//   style B   **Role:** Senior Backend Engineer
	//             **Duration:** March 2020 – August 2021
	//
	// `role` is now a front-matter field the layout renders, so both restatements
	// are redundant. Drop them and leave a single, consistently formatted
	// duration line — the period deliberately stays prose rather than becoming a
	// typed field.
	const edits = [];
	const DATE_RANGE = /^[A-Z][a-z]+ \d{4}\s*[–—-]\s*\S.*$/;

	// style A — a role heading followed by a bare date range, at the very top of
	// what is left of the body. Both are now front-matter fields, so both go.
	// Guarded on the date range so no ordinary section heading can match.
	const styleA = /^##\s+\*\*(.+?)\*\*\s*\r?\n+([^\n]+)\r?\n/.exec(out);
	if (styleA && styleA.index === 0 && DATE_RANGE.test(styleA[2].trim())) {
		out = out.slice(styleA[0].length);
		edits.push(`removed role heading "${styleA[1]}" and its date line "${styleA[2].trim()}"`);
	}

	// style B — exact line matches, no ambiguity.
	if (/^\*\*Role:\*\*[^\n]*\r?\n/m.test(out)) {
		out = out.replace(/^\*\*Role:\*\*[^\n]*\r?\n/m, '');
		edits.push('removed duplicated "**Role:**" line');
	}
	const durationLine = /^\*\*Duration:\*\*[^\n]*\r?\n/m.exec(out);
	if (durationLine) {
		out = out.replace(durationLine[0], '');
		edits.push(`removed "${durationLine[0].trim()}" — superseded by the date fields`);
	}

	// The "Technologies Used" section is now the `tech` field, rendered as the
	// STACK row at the top of the page. Left in place it appears twice.
	//
	// Only the heading and its own bullet list go: several articles place images
	// immediately after the list, and those must survive.
	const techHeading = /^(?:#{2,4}\s*)?\*\*Technologies Used:?\*\*:?\s*$/m.exec(out);
	if (techHeading) {
		const after = out.slice(techHeading.index + techHeading[0].length);
		let consumed = 0;
		for (const line of after.split('\n')) {
			const trimmed = line.trim();
			// Stop at the first line that is neither blank nor a list item, but
			// only once at least one list item has been taken.
			if (!trimmed) {
				if (consumed > 0 && !/^\s*-/.test(after.slice(consumed).split('\n')[1] ?? '')) {
					break;
				}
				consumed += line.length + 1;
				continue;
			}
			if (!trimmed.startsWith('-')) break;
			consumed += line.length + 1;
		}
		out = out.slice(0, techHeading.index) + after.slice(consumed).replace(/^\s*\n/, '');
		edits.push('removed the "Technologies Used" section — now the `tech` field');
	}

	// Rewrite image references to their new homes.
	const referenced = new Set();
	out = out.replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, (_full, alt, target) => {
		const name = decodeURIComponent(target);
		referenced.add(name);
		return `![${alt}](${referenceFor(name)})`;
	});

	// Drop the analytics parameter the Ghost export appended to outbound links.
	out = out.replace(/([?&])ref=theseusthread\.com(&|(?=[)\s]))/g, (_m, lead, tail) =>
		lead === '?' && !tail ? '' : lead,
	);

	out = `${out.trim()}\n`;

	// --- front matter -------------------------------------------------------
	const heroOriginal = data.hero.replace(/^\.\//, '');
	if (!renameOf.has(heroOriginal)) throw new Error(`${rel}: hero "${heroOriginal}" not on disk`);
	referenced.add(heroOriginal);

	// The archive's hero alt text is the article title. Carried over verbatim
	// rather than invented, and flagged in the report for a human rewrite.
	const heroAlt = data.title;

	const tech = extractTech(body, rel);

	const frontMatter = [
		'---',
		`title: ${yamlString(meta.title)}`,
		`company: ${yamlString(meta.company)}`,
		`role: ${yamlString(meta.role)}`,
		`summary: ${yamlString(data.summary)}`,
		`date: ${meta.start ?? 'MISSING'}`,
		`end: ${meta.end ?? 'null'}`,
		`hero: ${yamlString(`../../assets/projects/${slug}/${renameOf.get(heroOriginal).next}`)}`,
		`heroAlt: ${yamlString(heroAlt)}`,
		'tech:',
		...tech.map((t) => `  - ${yamlString(t)}`),
		...(data.source ? [`source: ${yamlString(data.source)}`] : []),
		'---',
		'',
	].join('\n');

	const orphans = renames.filter((r) => !referenced.has(r.original)).map((r) => r.original);

	const blockers = [];
	if (!meta.start) blockers.push(`${rel}: ${meta.blocked ?? 'no start date in PROJECT_META'}`);
	// The archive escapes the brackets, so match both `[...]` and `\[...\]`.
	if (/\\?\[Specify Duration\\?\]/.test(out)) {
		blockers.push(`${rel}: body still contains the "[Specify Duration]" placeholder`);
	}
	if (orphans.length) {
		blockers.push(`${rel}: image(s) on disk but never referenced: ${orphans.join(', ')}`);
	}

	return { slug, rel, dir, meta, renames, tech, heroAlt, frontMatter, body: out, blockers, edits };
}

// ---------------------------------------------------------------------------
// report + write
// ---------------------------------------------------------------------------

function table(rows, headers) {
	const widths = headers.map((h, i) =>
		Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)),
	);
	const line = (cells) => cells.map((c, i) => String(c ?? '').padEnd(widths[i])).join('  ');
	return [line(headers), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}

async function main() {
	if (!existsSync(SRC_DIR)) throw new Error(`source directory not found: ${SRC_DIR}`);

	const slugs = (await readdir(SRC_DIR, { withFileTypes: true }))
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.sort();

	if (SHOW) {
		if (!slugs.includes(SHOW)) throw new Error(`unknown project "${SHOW}"; expected one of ${slugs.join(', ')}`);
		const plan = await planProject(SHOW);
		console.log(plan.frontMatter + plan.body);
		return;
	}

	const plans = [];
	for (const slug of slugs) plans.push(await planProject(slug));

	console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — ${plans.length} projects\n`);

	// 1. renames
	const renameRows = [];
	for (const plan of plans) {
		for (const r of plan.renames) {
			renameRows.push([
				plan.slug,
				r.original,
				r.changed ? r.next : '(unchanged)',
				r.passthrough ? 'public/  [animated]' : 'src/assets/',
			]);
		}
	}
	console.log('IMAGE FILENAMES');
	console.log(table(renameRows, ['project', 'from', 'to', 'destination']));
	const changed = renameRows.filter((r) => r[2] !== '(unchanged)').length;
	console.log(`\n${changed} of ${renameRows.length} renamed.\n`);

	// 2. derived front matter
	console.log('DERIVED FRONT MATTER — listed in the order the site will show them');
	console.log(
		table(
			[...plans]
				.sort((a, b) => String(b.meta.start).localeCompare(String(a.meta.start)))
				.map((p, i) => [
					String(i + 1),
					p.slug,
					p.meta.company,
					p.meta.title,
					p.meta.start ?? '** MISSING **',
					p.meta.end ?? 'ongoing',
					`${p.tech.length} tech`,
				]),
			['#', 'project', 'company', 'title', 'date (start)', 'end', 'tech'],
		),
	);
	console.log();

	// 3. notes worth a human eye
	const notes = plans.filter((p) => p.meta.note);
	if (notes.length) {
		console.log('ASSUMPTIONS');
		for (const p of notes) console.log(`  - ${p.slug}: ${p.meta.note}`);
		console.log();
	}

	console.log('BODY EDITS — beyond image paths and heading levels');
	for (const p of plans) {
		console.log(`  ${p.slug}`);
		console.log('    - stripped the H1, the blockquote restating the summary, and the hero image');
		console.log('    - promoted every heading one level (### was skipping H2 under the page H1)');
		for (const e of p.edits) console.log(`    - ${e}`);
	}
	console.log();

	console.log('HERO ALT TEXT — carried over from the archive, all need rewriting');
	console.log(table(plans.map((p) => [p.slug, p.heroAlt]), ['project', 'heroAlt']));
	console.log();

	// 4. blockers
	const blockers = plans.flatMap((p) => p.blockers);
	if (blockers.length) {
		console.error(`BLOCKED — ${blockers.length} issue(s), nothing was written:\n`);
		for (const b of blockers) console.error(`  ✗ ${b}`);
		console.error('\nResolve these in projects/ (or in PROJECT_META) and re-run.\n');
		process.exitCode = 1;
		return;
	}

	if (!APPLY) {
		console.log('No blockers. Re-run with --apply to write.\n');
		return;
	}

	for (const plan of plans) {
		const assetDir = path.join(ASSET_DIR, plan.slug);
		await mkdir(assetDir, { recursive: true });
		for (const r of plan.renames) {
			const from = path.join(plan.dir, r.original);
			const to = r.passthrough
				? path.join(PUBLIC_DIR, r.next)
				: path.join(assetDir, r.next);
			await copyFile(from, to);
		}
		await mkdir(CONTENT_DIR, { recursive: true });
		await writeFile(
			path.join(CONTENT_DIR, `${plan.slug}.md`),
			Buffer.from(plan.frontMatter + plan.body, 'utf8'),
		);
		console.log(`  wrote src/content/projects/${plan.slug}.md`);
	}
	console.log('\nDone. `projects/` was not modified.\n');
}

main().catch((error) => {
	console.error(`\nmigration failed: ${error.message}\n`);
	process.exitCode = 1;
});
