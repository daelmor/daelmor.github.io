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
 *   start         becomes `date` — the sort key, when the engagement began.
 *   end           becomes `end` — a date, 'present', or null meaning
 *                 "ended, no date on record". null never means ongoing;
 *                 that conflation is what made Tigo advertise itself as
 *                 current work for years after the engagement finished.
 *   inProduction  becomes `inProduction` — whether the SYSTEM still runs,
 *                 which is independent of whether the engagement does.
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
		// Confirmed: March 2023 to present. Supersedes the archive's
		// "October 2022 – November 2023", which was both stale and closed.
		start: '2023-03-01',
		end: 'present',
		inProduction: true,
	},
	'hugo-delivery-service': {
		company: 'Hugo',
		title: 'Delivery Service',
		role: 'Senior Backend Engineer, Delivery Services',
		// "August 2021 – September 2022"
		start: '2021-08-01',
		end: '2022-09-30',
		// Unknown whether Hugo still runs this. null, deliberately not false.
		inProduction: null,
	},
	'hugo-fintech-wallet-app': {
		company: 'Hugo',
		title: 'FinTech Wallet App',
		role: 'Senior Backend Engineer',
		// "March 2020 – August 2021"
		start: '2020-03-01',
		end: '2021-08-31',
		inProduction: null,
	},
	'hugo-payments-service': {
		company: 'Hugo',
		title: 'Payments Service',
		role: 'Senior Backend Engineer, Payments Service',
		// "March 2020 – August 2021"
		start: '2020-03-01',
		end: '2021-08-31',
		inProduction: null,
	},
	'fegora-digital-invoicing': {
		company: 'Fegora',
		title: 'Digital Invoicing',
		role: 'Co-Founder & Software Architect',
		// Confirmed: August 2011 to present. Supersedes the archive's
		// "August 2011 – 2019", and consistent with the body's claim of fifteen
		// years of technical support.
		start: '2011-08-01',
		end: 'present',
		inProduction: true,
	},
	'nicetech-heyy-fintech-ecosystem': {
		company: 'Nicetech',
		title: 'Heyy FinTech ecosystem',
		role: 'Senior Software Architect',
		// Confirmed: March 2019 to November 2022. Replaces the archive's
		// reversed "August 2021 – December 2019".
		start: '2019-03-01',
		end: '2022-11-30',
		inProduction: null,
	},
	'tigo-selfservice-web-portal': {
		company: 'Tigo',
		title: 'SelfService Web Portal',
		role: 'Lead Developer',
		// The engagement ended; the portal is still serving customers. No end
		// date is on record, so null records exactly that rather than inventing
		// one — and crucially not 'present', which is what previously made this
		// read as current work under David's name.
		start: '2017-06-01',
		end: null,
		inProduction: true,
		note: 'Engagement ended but no end date on record, so the span renders as indeterminate. Supply a date to close it.',
	},
};

/**
 * Summaries rewritten here rather than in the archive, so `projects/` stays a
 * faithful copy of what was published and every deviation is recorded in one
 * place. The script asserts each result ends in terminal punctuation.
 */
const SUMMARY_OVERRIDES = {
	// The archived summary stopped mid-sentence on "...that supported key
	// functionalities", with no full stop. Completed from the four functional
	// areas the article itself goes on to describe, with the archive's
	// "cutting-edge" and "seamless" filler dropped.
	'n1co-fintech-app':
		'I led the development of FinTech services from concept to deployment for the n1co app, building the backend systems behind KYC, digital wallets, card issuing, and cashback and loyalty programmes.',
};

/** A literal newline, spelled this way so no escaping can mangle it. */
const NEWLINE = String.fromCharCode(10);

/**
 * Targeted body repairs, applied after heading levels are promoted so the
 * anchors below match the transformed text.
 *
 * Each fix asserts its anchor is present and aborts the run if it is not, so a
 * change upstream in `projects/` can never silently skip a repair.
 */
const BODY_FIXES = {
	'hugo-fintech-wallet-app': [
		{
			// These three bullets are word-for-word identical to n1co's, and the
			// stack they cite gives it away: Logic Apps and Serverless Functions
			// are Azure, and n1co is the Azure project, while this one ran on GCP
			// and PubSub. They were pasted onto the wrong article, so they come
			// off rather than being rewritten with metrics nobody can verify.
			//
			// The article keeps its own "Key features" section, which is unique.
			why: 'removed Key Achievements — verbatim duplicate of n1co, citing the wrong cloud stack for this project',
			find: [
				'## **Key Achievements**',
				'',
				'-   Developed a **KYC (Know Your Customer) module** that reduced user onboarding time by **65%** through streamlined workflows and automated validation processes using Webhooks, Serverless Functions, Logic Apps, External AI KYC providers, and Kubernetes.',
				'-   Designed and deployed a **digital card issuance system** abstraction that increased card issuance capacity by **50%** using Clean Architecture principles, CQRS, async communication, and external bank gateway providers.',
				'-   Designed and Implemented the **physical card issuance workflow** that increased geographical coverage by **70%** of the national territory with SOLID principles, strong REST and GraphQL API design, integration with delivery providers, and defensive programming.',
				'',
				'',
			].join(NEWLINE),
			replace: '',
		},
	],

	'fegora-digital-invoicing': [
		{
			// Three Ghost bookmark cards, flattened by the export into heading +
			// bold link + orphaned description + italic caption.
			why: 'merged three flattened Ghost bookmark cards into one annotated link list',
			find: [
				'## Restful API',
				'',
				'**[Fegora](https://developer.fegora.com/)**',
			].join(NEWLINE),
			replace: [
				'## API and open-source connectors',
				'',
				'**[Fegora API reference](https://developer.fegora.com/)**',
			].join(NEWLINE),
		},
		{
			// One of these descriptions is GitHub's own repository blurb, which
			// the export left sitting in the article as if it were David's prose.
			why: "removed Ghost caption residue, including GitHub's own blurb presented as prose",
			find: [
				'',
				'_Fegora API Reference_',
				'',
				'## Json Structure',
				'',
				'**[Estructura DTE](https://github.com/fegora/fegora.github.io/wiki/Estructura-DTE)**',
				'',
				'Contribute to fegora/fegora.github.io development by creating an account on GitHub.',
				'',
				'_Fegora json structure repository_',
				'',
				'## Open source connectors',
				'',
				'**[GitHub - fegora/fegora-dotnet: Conector o librería para clientes .NET4.5+ del API de Fegora](https://github.com/fegora/fegora-dotnet)**',
				'',
				'Conector o librería para clientes .NET4.5+ del API de Fegora - fegora/fegora-dotnet',
				'',
				'_Fegora .NET connector repository_',
			].join(NEWLINE),
			replace: [
				'',
				'**[Estructura DTE](https://github.com/fegora/fegora.github.io/wiki/Estructura-DTE)** — the JSON document structure the API accepts.',
				'',
				'**[fegora-dotnet](https://github.com/fegora/fegora-dotnet)** — client library for .NET 4.5 and above.',
			].join(NEWLINE),
		},
	],
};

/**
 * Alt text for every image, keyed by its normalised filename.
 *
 * Written by looking at each image at full resolution, not inferred from
 * filenames — which would have gone wrong, because several filenames describe
 * the wrong screen. `n1co-loyalty.png` is the referral screen, and
 * `n1co-cashin-cash.png` is a barcode top-up voucher.
 *
 * These describe what is visible. They deliberately do not restate the project
 * title, which is already the page's H1, and they avoid "image of" / "screenshot
 * of" openings that screen readers announce redundantly.
 *
 * Every image must have an entry: the script blocks on any that does not, so a
 * new screenshot cannot ship with an empty alt attribute.
 */
const ALT_TEXT = {
	// --- n1co ---------------------------------------------------------------
	'n1co-app-card.png':
		'The n1co app home screen beside a black n1co Visa card, showing $155.21 available, buttons to request, top up and send money, and $5.50 of cashback.',
	'n1co-cashback.jpg':
		'A hand holding a phone running the n1co app, with a Cashback promotion filling the middle of the home screen.',
	'n1co-cashin-cash.png':
		'A cash top-up voucher in the app: a barcode above the number 47878590584, for a $5.00 top-up, to be presented at an agent.',
	'n1co-loyalty.png':
		'The referral screen, headed "Refiere y gana $5", explaining that a friend must redeem the code and spend at least $10, with the code T4QXE at the bottom.',
	'n1co-referral.png':
		'The referral-code entry screen, with five masked characters entered and the on-screen keyboard open.',
	'n1co-tap.png':
		'A contactless n1co Visa card held against the back of a phone, which reads "Iniciando Transacción" for USD 5.00.',
	'n1co-otp.png':
		'The sign-in screen asking for a phone number with El Salvador\'s +503 dialling code, offering to send a one-time code by SMS or by WhatsApp.',
	'n1co-qr.jpg':
		'Four people holding phones around an n1co QR stand reading "Aceptamos todas las tarjetas", each phone showing the same $12.54 payment page.',
	'n1co-kyc.png':
		'The identity-capture step of onboarding, photographing the front of an El Salvador national ID card. The card is a printed specimen, not a real identity document.',

	// --- Fegora -------------------------------------------------------------
	'fegora-showcase-cuadrado.png':
		'Overlapping Fegora screens: a list of issued invoices, one certified invoice, its signed XML, an emailed notification, and the REST API reference.',
	'api-1.jpg':
		'The Fegora API reference for authentication: endpoint list on the left, request headers and body in the middle, and example cURL requests with JSON responses on the right.',
	'fegora-create-invoice-postman-1.png':
		'API reference for creating a commercial invoice, with the document-type endpoints listed down the left and the JSON request body for the recipient on the right.',
	'fegora-single-invoice-xml2-1.png':
		'The signed XML of a Guatemalan electronic tax document, showing the SAT schema namespaces and the XML digital signature block.',
	'fegora-invoices-filter-1.png':
		'Fegora\'s electronic document list: date, status and establishment filters above a table of issued invoices with recipients and totals in quetzales.',
	'fegora-single-invoice-1.png':
		'A single certified invoice, showing issuer and recipient tax details, four line items and a total of 975 quetzales, with buttons to download the PDF or void it.',
	'fegora-single-invoice-mail-1.png':
		'An automated Fegora email notifying a customer that electronic documents have been issued, with a link to each one.',

	// --- Hugo: Delivery Service ---------------------------------------------
	'hugo-delivery-showcase-cuadrado.png':
		'Promotional cards for the Hugo app\'s verticals — hugoGroceries, hugoShop and hugoDelivery — arranged around a hand holding a phone on the app\'s home screen.',

	// --- Hugo: FinTech Wallet App -------------------------------------------
	'hugopayments7.jpg':
		'A hugoPay promotion: a phone showing a transaction list with two Visa cards floating above it, captioned "Realiza tus compras con hugoPay".',
	'hugopaydesing-1.webp':
		'Slides from the hugoPay product deck, covering user benefits, merchant costs, contactless QR payments and cashback.',
	'hugopayments6.png':
		'Five hugoPay screens for sending money: entering a recipient number and amount, confirming a $20.00 transfer twice, the sent confirmation, and a receipt with the transaction ID.',
	'hugopay8.webp':
		'A mockup of a purple hugoPay Visa card carrying a specimen cardholder name and number.',
	'hugopayments1.png':
		'A phone showing the hugoPay wallet with a $50.00 balance and a list of recent transactions, next to a purple hugo Visa card on a wooden desk.',
	'hugopayments2.png':
		'A payment-link checkout on a phone for a shop called Garden Store, listing two items and a total, beside marketing copy describing the payment-links feature.',

	// --- Hugo: Payments Service ---------------------------------------------
	'hugo-payments-showcase-cuadrado.png':
		'Overlapping views of the payments back office: a transaction JSON payload, a list of orders with amounts and Accepted status, a customer record, and the fraud-scoring timeline for one order.',

	// --- Nicetech: Heyy -----------------------------------------------------
	'heyy3-1.jpg':
		'A hand holding a heyy! card printed with a QR code and the address azulrosa.heyy.one, being scanned by a phone across a bar table.',
	'heyy2-1.jpg':
		'A heyy! illustration headed "Consolidated Wallet Systems", listing ticketing, cashless, prepaid event currency with tokenization, and loyalty programmes.',
	'heyy1-1.jpg':
		'The heyy! website home page, describing how it streamlines event organisation and customer-service workflows.',
	'm1nt.png':
		'A m1nt landing page in Spanish presenting m1nt as the currency of the 1001 Noches venue, with a button to top up a m1nt card online.',

	// --- Tigo ---------------------------------------------------------------
	'tigo-selfservice-showcase-cuadrado.png':
		'A fan of Tigo self-service app screens showing remaining data, a list of services on the account, invoice history, automatic debit setup and saved payment methods.',
	'tigoss1-1.png':
		'The Tigo en Línea sign-in page, offering login by password or by phone number, with quick actions to pay bills and buy packages.',

	// --- served from public/, animated ---------------------------------------
	'm1nt-animation-es.gif':
		'An animated Spanish-language promotion for the m1nt prepaid card.',
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
	out = out.replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, (_full, _alt, target) => {
		const name = decodeURIComponent(target);
		referenced.add(name);
		// The archive left 24 of 31 inline images with alt="". The alt text is
		// replaced wholesale from ALT_TEXT rather than preserved.
		const entry = renameOf.get(name);
		const alt = entry ? (ALT_TEXT[entry.next] ?? '') : '';
		return `![${alt}](${referenceFor(name)})`;
	});

	// Drop the analytics parameter the Ghost export appended to outbound links.
	out = out.replace(/([?&])ref=theseusthread\.com(&|(?=[)\s]))/g, (_m, lead, tail) =>
		lead === '?' && !tail ? '' : lead,
	);

	for (const fix of BODY_FIXES[slug] ?? []) {
		if (!out.includes(fix.find)) {
			throw new Error(
				`${rel}: a BODY_FIXES anchor no longer matches (${fix.why}). The source article changed; update the fix.`,
			);
		}
		out = out.replace(fix.find, () => fix.replace);
		edits.push(fix.why);
	}

	// Wrap the one Spanish paragraph so assistive tech switches pronunciation.
	// Located by line scan rather than a regex: the paragraph is a whole line,
	// and a line scan cannot be broken by escaping.
	const spanishLine = out.split(NEWLINE).find((line) => line.startsWith('Fegora hace accesible'));
	if (spanishLine) {
		out = out.replace(spanishLine, () => `<p lang="es">${spanishLine}</p>`);
		edits.push('wrapped the Spanish paragraph in <p lang="es">');
	}

	out = `${out.trim()}\n`;

	// --- front matter -------------------------------------------------------
	const heroOriginal = data.hero.replace(/^\.\//, '');
	if (!renameOf.has(heroOriginal)) throw new Error(`${rel}: hero "${heroOriginal}" not on disk`);
	referenced.add(heroOriginal);

	// The archive used the article title as hero alt text, which tells a screen
	// reader nothing the H1 has not already said. Replaced from ALT_TEXT.
	const heroAlt = ALT_TEXT[renameOf.get(heroOriginal).next] ?? '';

	const tech = extractTech(body, rel);

	const summary = SUMMARY_OVERRIDES[slug] ?? data.summary;
	if (SUMMARY_OVERRIDES[slug]) edits.push('replaced the summary (see SUMMARY_OVERRIDES)');
	// A summary that does not end in terminal punctuation is almost certainly
	// truncated, which is how n1co's shipped. Fail rather than publish it.
	if (!/["')\]]?[.!?]["')\]]?$/.test(summary)) {
		throw new Error(
			`${rel}: summary does not end in a full stop, so it is probably truncated. Add an entry to SUMMARY_OVERRIDES.`,
		);
	}

	const frontMatter = [
		'---',
		`title: ${yamlString(meta.title)}`,
		`company: ${yamlString(meta.company)}`,
		`role: ${yamlString(meta.role)}`,
		`summary: ${yamlString(summary)}`,
		`date: ${meta.start ?? 'MISSING'}`,
		// A bare `present` parses as that string and a bare `null` as YAML null,
		// which is exactly the three-state distinction the schema expects.
		`end: ${meta.end === null ? 'null' : meta.end}`,
		`inProduction: ${meta.inProduction === null ? 'null' : String(meta.inProduction)}`,
		`hero: ${yamlString(`../../assets/projects/${slug}/${renameOf.get(heroOriginal).next}`)}`,
		`heroAlt: ${yamlString(heroAlt)}`,
		'tech:',
		...tech.map((t) => `  - ${yamlString(t)}`),
		...(data.source ? [`source: ${yamlString(data.source)}`] : []),
		'---',
		'',
	].join('\n');

	const orphans = renames.filter((r) => !referenced.has(r.original)).map((r) => r.original);

	const missingAlt = renames.filter((r) => !ALT_TEXT[r.next]).map((r) => r.next);

	const blockers = [];
	if (missingAlt.length) {
		blockers.push(
			`${rel}: no ALT_TEXT entry for ${missingAlt.join(', ')} — look at the image and describe it`,
		);
	}
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

	const dirs = (await readdir(SRC_DIR, { withFileTypes: true }))
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.sort();

	// A directory without an index.md is not an archived article. Skipped rather
	// than crashed on, but always reported — silently ignoring a folder here
	// would be how a real project goes missing from the site.
	const slugs = [];
	const skipped = [];
	for (const dir of dirs) {
		if (existsSync(path.join(SRC_DIR, dir, 'index.md'))) slugs.push(dir);
		else skipped.push(dir);
	}

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
					p.meta.end === null ? 'ended, undated' : p.meta.end,
					p.meta.inProduction === true ? 'live' : p.meta.inProduction === false ? 'retired' : '?',
					`${p.tech.length} tech`,
				]),
			['#', 'project', 'company', 'title', 'date (start)', 'end', 'system', 'tech'],
		),
	);
	console.log();

	if (skipped.length) {
		console.log('NOT MIGRATED — no index.md, so not an archived article:');
		for (const dir of skipped) {
			const files = (await readdir(path.join(SRC_DIR, dir))).length;
			console.log(`  - projects/${dir}/ — ${files} file(s), left where they are`);
		}
		console.log();
	}

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

	console.log('HERO ALT TEXT');
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
