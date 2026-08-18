#!/usr/bin/env node
/**
 * Converts the philosophy and music essays in `projects/philosophy-writings/`
 * into the `philosophy` and `music` collections.
 *
 *   node scripts/import-essays.mjs               dry run
 *   node scripts/import-essays.mjs --apply       write the Spanish originals
 *   node scripts/import-essays.mjs --show <work> print one converted file
 *
 * The sources are PDF and Word documents, so extraction is lossy by nature:
 * `pdftotext -layout` gives lines, not paragraphs, and Word's XML gives runs.
 * Everything this script does to repair that is listed in ESSAYS and reported
 * on each run, so nothing is silently reflowed.
 *
 * Translations are written by `scripts/translate-essays.mjs`, not here.
 */

import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'projects', 'philosophy-writings');
const CONTENT = {
	philosophy: path.join(ROOT, 'src', 'content', 'philosophy'),
	music: path.join(ROOT, 'src', 'content', 'music'),
};

const APPLY = process.argv.includes('--apply');
const SHOW = (() => {
	const i = process.argv.indexOf('--show');
	return i === -1 ? null : process.argv[i + 1];
})();

/**
 * One entry per source document.
 *
 * `title` is transcribed from inside the document, not from the filename —
 * every filename here disagrees with the document's own heading, sometimes
 * badly. `BethoveenYLaIndia.docx` is titled "Del Rhin al Ganges", and
 * "HPB y la Musica.pdf" is titled "Blavatsky y la Música".
 *
 * `section` is where the file lives and is canonical for its URL. `alsoIn`
 * cross-lists it elsewhere without serving the text from a second address.
 */
const ESSAYS = [
	{
		work: 'del-rhin-al-ganges',
		file: 'BethoveenYLaIndia.docx',
		section: 'music',
		alsoIn: ['philosophy'],
		title: 'Del Rhin al Ganges: la resonancia de la filosofía india en la música de Beethoven',
		slug: 'del-rhin-al-ganges',
		date: '2024-02-25',
		composer: 'Ludwig van Beethoven',
		// The document opens with a Word field-code table of contents that
		// extraction renders as "TOC \o 1-3 \h \z \u Introducción PAGEREF ..."
		dropTableOfContents: true,
	},
	{
		work: 'blavatsky-y-la-musica',
		file: 'HPB y la Musica.pdf',
		section: 'music',
		alsoIn: ['philosophy'],
		title: 'Blavatsky y la música',
		slug: 'blavatsky-y-la-musica',
		date: '2017-02-26',
		composer: 'Helena Petrovna Blavatsky',
	},
	{
		work: 'el-dialogo-socratico',
		file: 'El diálogo socrático un despertar interior - David Elizondo.pdf',
		section: 'philosophy',
		alsoIn: [],
		title: 'El diálogo socrático: un despertar interior',
		slug: 'el-dialogo-socratico',
		date: '2020-04-05',
		venue: 'Organización Internacional Nueva Acrópolis — Guatemala',
	},
	{
		work: 'filosofia-practica',
		file: 'FILOSOFÍA PRÁCTICA, EJERCICIOS DE AYER, HOY Y MAÑANA - David Elizondo.pdf',
		section: 'philosophy',
		alsoIn: [],
		title: 'Filosofía práctica: ejercicios de ayer, hoy y mañana',
		slug: 'filosofia-practica',
		date: '2019-01-27',
		venue: 'Organización Internacional Nueva Acrópolis — Guatemala',
	},
	{
		work: 'budismo-aplicado',
		file: 'Monografia_DavidElizondo_BudismoAplicado.docx',
		section: 'philosophy',
		alsoIn: [],
		title: 'Budismo aplicado para entender la vida',
		slug: 'budismo-aplicado',
		date: '2018-01-28',
	},
	{
		work: 'plotino-y-la-politica',
		file: 'Plotino y la Politica - David Elizondo.pdf',
		section: 'philosophy',
		alsoIn: [],
		title: 'Plotino y la política',
		slug: 'plotino-y-la-politica',
		// The only document with no date anywhere in it. Left null so the run
		// stops here rather than a date being guessed from the file mtime.
		date: null,
		note: 'No date appears anywhere in the source document.',
	},
];

/**
 * Headings whose sentence-cased form needs a proper noun put back, keyed by the
 * sentence-cased result. Written out rather than inferred — see sentenceCase.
 *
 * Source typos are preserved deliberately: "Bigliografía" is how David wrote it,
 * and quietly correcting an author's text is not this script's job.
 */
const HEADING_OVERRIDES = {
	'blavatsky-y-la-musica': {
		'Madame laura': 'Madame Laura',
	},
	'el-dialogo-socratico': {
		'¿por qué el diálogo socrático como ejercicio filosófico?':
			'¿Por qué el diálogo socrático como ejercicio filosófico?',
	},
};

/** Headings these documents use, so they can be promoted from prose to `##`. */
const HEADING_WORDS = [
	'INTRODUCCIÓN',
	'INTRODUCCION',
	'Introducción',
	'CONCLUSIÓN',
	'CONCLUSION',
	'Conclusión',
	'CONCLUSIONES',
	'Conclusiones',
	'BIBLIOGRAFÍA',
	'BIBLIOGRAFIA',
	'Bibliografía',
	'DESARROLLO',
	'Desarrollo',
	'RESUMEN',
	'Resumen',
];

// ---------------------------------------------------------------------------
// extraction
// ---------------------------------------------------------------------------

function extractPdf(file) {
	const res = spawnSync('pdftotext', ['-enc', 'UTF-8', '-layout', file, '-'], {
		encoding: 'utf8',
		maxBuffer: 32 * 1024 * 1024,
	});
	if (res.status !== 0) throw new Error(`pdftotext failed for ${path.basename(file)}`);
	return res.stdout;
}

async function extractDocx(file) {
	// A .docx is a zip; word/document.xml holds the text. Reading it directly
	// avoids a dependency, at the cost of handling the markup by hand below.
	const buf = await readFile(file);
	const xml = readDocxEntry(buf, 'word/document.xml');
	if (!xml) throw new Error(`${path.basename(file)}: no word/document.xml inside`);

	return xml
		.replace(/<w:tab[^>]*\/>/g, ' ')
		.replace(/<w:br[^>]*\/>/g, '\n')
		.replace(/<\/w:p>/g, '\n\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'");
}

/** Minimal zip reader: finds one stored/deflated entry by name. */
function readDocxEntry(buf, name) {
	const target = Buffer.from(name, 'utf8');
	let offset = 0;
	while (offset < buf.length - 4) {
		if (buf.readUInt32LE(offset) !== 0x04034b50) {
			offset += 1;
			continue;
		}
		const method = buf.readUInt16LE(offset + 8);
		const compressed = buf.readUInt32LE(offset + 18);
		const nameLen = buf.readUInt16LE(offset + 26);
		const extraLen = buf.readUInt16LE(offset + 28);
		const nameStart = offset + 30;
		const entryName = buf.subarray(nameStart, nameStart + nameLen);
		const dataStart = nameStart + nameLen + extraLen;

		if (entryName.equals(target)) {
			const data = buf.subarray(dataStart, dataStart + compressed);
			// 8 = deflate, 0 = stored.
			// Zip stores raw deflate streams with no zlib header, so inflateRaw.
			return method === 8 ? inflateRawSync(data).toString('utf8') : data.toString('utf8');
		}
		offset = dataStart + compressed;
	}
	return null;
}

// ---------------------------------------------------------------------------
// text → markdown
// ---------------------------------------------------------------------------

/**
 * Rebuilds paragraphs from extracted lines.
 *
 * `pdftotext -layout` breaks at the width of the page, so a single paragraph
 * arrives as a dozen short lines. Joining every non-blank run of lines restores
 * the paragraph; the heuristics below decide what is a heading, a list item or
 * a page number rather than prose.
 */
function toMarkdown(raw, essay, report) {
	let text = raw.replace(/\r\n?/g, '\n').replace(/ /g, ' ');

	// Word field codes from an auto table of contents.
	if (essay.dropTableOfContents) {
		const before = text.length;
		text = text.replace(/TOC\s+\\o[\s\S]*?(?=\n\s*\n)/, '');
		text = text
			.split('\n')
			.filter((l) => !/PAGEREF|_Toc\d+|\\h\s*$|^\s*HYPERLINK/.test(l))
			.join('\n');
		if (text.length !== before) report.push('removed the Word table-of-contents field codes');
	}

	const lines = text.split('\n');
	const out = [];
	let buffer = [];
	/**
	 * Words the document itself capitalises mid-sentence — names, places, works.
	 * Used to sentence-case ALL-CAPS headings without flattening "MADAME LAURA"
	 * into "Madame laura". Spanish headings take sentence case, so blanket
	 * title-casing would be wrong in the other direction.
	 */
	let droppedPageNumbers = 0;
	let droppedTitleHeadings = 0;
	let overridden = 0;
	let headings = 0;
	let bullets = 0;

	const flush = () => {
		if (!buffer.length) return;
		out.push(buffer.join(' ').replace(/\s+/g, ' ').trim());
		buffer = [];
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line) {
			flush();
			continue;
		}

		// A bare number on its own line is a page number.
		if (/^\d{1,3}$/.test(line)) {
			droppedPageNumbers += 1;
			continue;
		}

		// Footnote separators and stray form feeds.
		if (/^[_—\-]{3,}$/.test(line) || line === '\f') {
			flush();
			continue;
		}

		// Section headings: a known word, or a short all-caps line.
		const isKnown = HEADING_WORDS.includes(line.replace(/[.:]$/, ''));
		const isShoutedShort =
			line.length <= 70 &&
			line === line.toUpperCase() &&
			/[A-ZÁÉÍÓÚÑ]/.test(line) &&
			!/[.;]$/.test(line) &&
			line.split(' ').length <= 9 &&
			// No digits: the Blavatsky essay has an all-caps solfège table whose
			// rows ("FA  4") otherwise read as headings.
			!/\d/.test(line) &&
			// At least four letters, for the same reason.
			(line.match(/\p{L}/gu) ?? []).length >= 4;

		if (isKnown || isShoutedShort) {
			flush();
			const label = line.replace(/[:]$/, '');

			// A heading that merely restates the article title adds nothing: the
			// page already carries it as the h1.
			if (isTitleish(label, essay.title)) {
				droppedTitleHeadings += 1;
				continue;
			}

			const cased = sentenceCase(label);
			const override = HEADING_OVERRIDES[essay.work]?.[cased];
			if (override) overridden += 1;
			out.push(`## ${override ?? cased}`);
			headings += 1;
			continue;
		}

		// Bullets, in the several forms these documents use.
		const bullet = /^[•▪·o]\s+(.*)$/.exec(line) ?? /^[-–]\s+(.*)$/.exec(line);
		if (bullet) {
			flush();
			out.push(`- ${bullet[1].trim()}`);
			bullets += 1;
			continue;
		}

		buffer.push(line);
	}
	flush();

	if (droppedPageNumbers) report.push(`dropped ${droppedPageNumbers} page number line(s)`);
	if (droppedTitleHeadings) {
		report.push(`dropped ${droppedTitleHeadings} heading(s) that restated the title`);
	}
	if (headings) report.push(`promoted ${headings} line(s) to headings`);
	if (bullets) report.push(`recognised ${bullets} bullet(s)`);
	if (overridden) report.push(`applied ${overridden} heading casing override(s)`);

	// Drop the byline block: the author's name, place and date sit at the top of
	// every document and are front matter here.
	const cleaned = [];
	for (const block of out) {
		if (/^David Elizondo$/i.test(block)) continue;
		// Name, place and date frequently join into a single line during reflow,
		// e.g. "David Elizondo Guatemala, 26-Feb-17".
		if (/^David Elizondo\b.{0,60}\d{2,4}\.?$/i.test(block)) continue;
		if (/^David Elizondo\s+Guatemala\b/i.test(block)) continue;
		if (/^Guatemala[,.]?\s*\d{0,2}[-\s]?\w*[-\s]?\d{2,4}\.?$/i.test(block)) continue;
		if (/^Guatemala[.,]\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\.?$/i.test(block)) continue;
		if (/^Organización Internacional Nueva Acrópolis/i.test(block)) continue;
		if (/^Tabla de contenido$/i.test(block)) continue;
		cleaned.push(block);
	}
	if (cleaned.length !== out.length) {
		report.push(`removed ${out.length - cleaned.length} byline/front-matter line(s)`);
	}

	// The title itself is front matter; drop it if it leads the body.
	while (cleaned.length && isTitleish(cleaned[0], essay.title)) {
		cleaned.shift();
		report.push('removed the repeated title line');
	}

	return `${cleaned.join('\n\n')}\n`;
}

/**
 * Sentence case for an ALL-CAPS heading: Spanish takes sentence case, not title
 * case, in headings.
 *
 * Proper nouns are handled by HEADING_OVERRIDES rather than inferred. An earlier
 * version harvested mid-sentence capitals from the body to guess at names, and
 * produced "Armonías en el Aire", "El esoterismo en la Música" and
 * "¿Por Qué el diálogo socrático Como ejercicio filosófico?" — because Spanish
 * capitalises mid-sentence for plenty of reasons that have nothing to do with
 * names. Guessing at another language's orthography is not worth the errors it
 * introduces, so the exceptions are written down instead.
 */
function sentenceCase(label) {
	if (label !== label.toUpperCase()) return label; // already mixed case: trust it
	const lower = label.toLowerCase();
	// Capitalise the first actual letter, skipping any leading ¿ or ¡.
	return lower.replace(/\p{L}/u, (c) => c.toUpperCase());
}

/** Loose match so "BLAVATSKY Y LA MÚSICA" matches "Blavatsky y la música". */
function isTitleish(block, title) {
	const norm = (s) =>
		s
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, ' ')
			.trim();
	const b = norm(block.replace(/^##\s*/, ''));
	const t = norm(title);
	if (!b) return false;
	return b === t || t.startsWith(b) || b.startsWith(norm(title.split(':')[0]));
}

/** First sentences of the body, as the summary. */
function deriveSummary(markdown, work) {
	const para = markdown
		.split('\n\n')
		.map((p) => p.trim())
		.find((p) => p && !p.startsWith('#') && !p.startsWith('-') && p.split(' ').length > 12);
	if (!para) throw new Error(`${work}: cannot derive a summary — no substantial paragraph`);

	let out = '';
	for (const sentence of para.split(/(?<=\.)\s+/)) {
		if (out && (out + ' ' + sentence).length > 240) break;
		out = out ? `${out} ${sentence}` : sentence;
	}
	out = out.trim();
	if (!/[.!?]$/.test(out)) out += '.';
	return out;
}

const yamlString = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function planEssay(essay) {
	const file = path.join(SRC_DIR, essay.file);
	if (!existsSync(file)) throw new Error(`${essay.work}: source file not found: ${essay.file}`);

	const raw = essay.file.toLowerCase().endsWith('.pdf')
		? extractPdf(file)
		: await extractDocx(file);

	const report = [];
	const markdown = toMarkdown(raw, essay, report);
	const words = markdown.split(/\s+/).filter(Boolean).length;
	if (words < 500) throw new Error(`${essay.work}: only ${words} words extracted — check the source`);

	const summary = deriveSummary(markdown, essay.work);

	const blockers = [];
	if (!essay.date) blockers.push(`${essay.file}: ${essay.note ?? 'no date'}`);

	const frontMatter = [
		'---',
		`title: ${yamlString(essay.title)}`,
		`summary: ${yamlString(summary)}`,
		`date: ${essay.date ?? 'MISSING'}`,
		'lang: es',
		`work: ${yamlString(essay.work)}`,
		...(essay.alsoIn.length
			? ['alsoIn:', ...essay.alsoIn.map((s) => `  - ${yamlString(s)}`)]
			: []),
		...(essay.composer ? [`composer: ${yamlString(essay.composer)}`] : []),
		...(essay.venue ? [`venue: ${yamlString(essay.venue)}`] : []),
		...(essay.prize ? [`prize: ${yamlString(essay.prize)}`] : []),
		`sourceFile: ${yamlString(essay.file)}`,
		'---',
		'',
	].join('\n');

	return { ...essay, markdown, summary, words, frontMatter, report, blockers };
}

function table(rows, headers) {
	const w = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)));
	const line = (c) => c.map((v, i) => String(v ?? '').padEnd(w[i])).join('  ');
	return [line(headers), line(w.map((n) => '-'.repeat(n))), ...rows.map(line)].join('\n');
}

async function main() {
	const files = await readdir(SRC_DIR);
	const known = new Set(ESSAYS.map((e) => e.file));
	const unknown = files.filter((f) => !known.has(f) && !f.startsWith('.'));

	const plans = [];
	for (const essay of ESSAYS) plans.push(await planEssay(essay));

	if (SHOW) {
		const plan = plans.find((p) => p.work === SHOW || p.slug === SHOW);
		if (!plan) throw new Error(`unknown essay "${SHOW}"`);
		console.log(plan.frontMatter + plan.markdown);
		return;
	}

	console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — ${plans.length} essays\n`);

	console.log('ESSAYS');
	console.log(
		table(
			plans.map((p) => [
				p.section,
				p.slug,
				p.date ?? '** MISSING **',
				String(p.words),
				p.alsoIn.join(',') || '-',
			]),
			['section', 'slug', 'date', 'words', 'alsoIn'],
		),
	);
	console.log();

	console.log('TITLES — taken from inside each document, not the filename');
	console.log(table(plans.map((p) => [p.file, p.title]), ['source file', 'title']));
	console.log();

	console.log('EXTRACTION REPAIRS');
	for (const p of plans) {
		console.log(`  ${p.slug}`);
		for (const r of p.report) console.log(`    - ${r}`);
	}
	console.log();

	if (unknown.length) {
		console.log('NOT IMPORTED — in the folder but not in ESSAYS:');
		for (const f of unknown) console.log(`  - ${f}`);
		console.log();
	}

	// A blocked essay is held back by name; the rest still go. Withholding five
	// finished essays because a sixth lacks a date would help nobody.
	const held = plans.filter((p) => p.blockers.length);
	const ready = plans.filter((p) => !p.blockers.length);

	if (held.length) {
		console.error(`HELD BACK — ${held.length} essay(s) will not be written:\n`);
		for (const p of held) for (const b of p.blockers) console.error(`  x ${b}`);
		console.error('\nSupply the missing value in ESSAYS and re-run.\n');
		process.exitCode = 1;
	}

	if (!APPLY) {
		console.log(`${ready.length} essay(s) ready. Re-run with --apply to write them.\n`);
		return;
	}

	for (const plan of ready) {
		const dir = CONTENT[plan.section];
		await mkdir(dir, { recursive: true });
		await writeFile(
			path.join(dir, `${plan.slug}.md`),
			Buffer.from(plan.frontMatter + plan.markdown, 'utf8'),
		);
		console.log(`  wrote src/content/${plan.section}/${plan.slug}.md`);
	}
	console.log('\nDone. The source documents were not modified.\n');
}

main().catch((error) => {
	console.error(`\nimport failed: ${error.message}\n`);
	process.exitCode = 1;
});
