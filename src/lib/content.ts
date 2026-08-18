import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { SECTIONS } from '../consts';

/**
 * Drafts render in `astro dev` so work-in-progress is previewable, and are
 * dropped from every production build, feed and sitemap.
 */
const includeDrafts = !import.meta.env.PROD;

/** Newest first. `date` is the shared sort key across all five collections. */
function byDateDesc(a: { data: { date: Date } }, b: { data: { date: Date } }) {
	return b.data.date.valueOf() - a.data.date.valueOf();
}

/** Published entries of one collection, newest first. */
export async function getPublished<K extends CollectionKey>(
	collection: K,
): Promise<CollectionEntry<K>[]> {
	const entries = await getCollection(collection, ({ data }) => includeDrafts || !data.draft);
	return entries.sort(byDateDesc);
}

/** Declared once so the feed, cross-listing and translation lookups agree. */
export const ALL_COLLECTIONS: CollectionKey[] = [
	'projects',
	'tech',
	'philosophy',
	'books',
	'music',
];

/** Every published entry across every collection, newest first. Used by the feed. */
export async function getAllPublished() {
	const grouped = await Promise.all(
		ALL_COLLECTIONS.map(async (collection) =>
			(await getPublished(collection)).map((entry) => ({ collection, entry })),
		),
	);
	return grouped.flat().sort((a, b) => byDateDesc(a.entry, b.entry));
}

/** Canonical path for an entry, e.g. `/projects/n1co-fintech-app/`. */
export function entryPath(collection: string, id: string) {
	return `/${collection}/${id}/`;
}

/**
 * Sections that actually have something to read.
 *
 * Four of the five collections are empty scaffolding. Their routes exist so
 * that dropping in one file is the whole job, but linking to them from the nav
 * before then would just advertise empty pages.
 */
export async function getPopulatedSections() {
	const counts = await Promise.all(
		SECTIONS.map(async (section) => ({
			...section,
			count: (await getPublished(section.slug)).length,
		})),
	);
	return counts.filter((section) => section.count > 0);
}

/** An entry as it appears in a section listing, canonical or cross-listed. */
export interface SectionItem {
	id: string;
	/** The collection the file actually lives in — canonical for its URL. */
	collection: CollectionKey;
	data: CollectionEntry<CollectionKey>['data'];
	/** True when it is shown here but lives in another section. */
	crossListed: boolean;
	href: string;
}

/**
 * Everything to list under one section: its own entries, plus entries from other
 * collections that name it in `alsoIn`.
 *
 * A cross-listed entry links to its canonical URL rather than being rendered a
 * second time, so the same text is never served from two addresses and there is
 * no duplicate-content problem to paper over with rel=canonical.
 */
export async function getSectionEntries(section: CollectionKey): Promise<SectionItem[]> {
	const own = (await getPublished(section)).map((entry) => ({
		id: entry.id,
		collection: section,
		data: entry.data,
		crossListed: false,
		href: entryPath(section, entry.id),
	}));

	const others: SectionItem[] = [];
	for (const other of ALL_COLLECTIONS) {
		if (other === section) continue;
		for (const entry of await getPublished(other)) {
			// Widened to string[] deliberately: `alsoIn` only permits the four
			// writing sections, while `section` is any collection key. Comparing the
			// literal unions makes cross-listing into `projects` a type error rather
			// than simply something that never matches.
			const alsoIn: readonly string[] = 'alsoIn' in entry.data ? (entry.data.alsoIn ?? []) : [];
			if (!alsoIn.includes(section)) continue;
			others.push({
				id: entry.id,
				collection: other,
				data: entry.data,
				crossListed: true,
				href: entryPath(other, entry.id),
			});
		}
	}

	return [...own, ...others].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * The other language versions of one piece, found by shared `work` id.
 *
 * Filenames differ between languages, so the id cannot be the link; `work` is
 * carried in front matter for exactly this.
 */
export async function getTranslations(collection: CollectionKey, entry: { id: string; data: Record<string, unknown> }) {
	const work = 'work' in entry.data ? entry.data.work : undefined;
	if (typeof work !== 'string') return [];

	const out: { lang: string; href: string; title: string }[] = [];
	for (const other of ALL_COLLECTIONS) {
		for (const candidate of await getPublished(other)) {
			if (candidate.id === entry.id && other === collection) continue;
			if (!('work' in candidate.data) || candidate.data.work !== work) continue;
			out.push({
				lang: String(candidate.data.lang ?? ''),
				href: entryPath(other, candidate.id),
				title: candidate.data.title,
			});
		}
	}
	return out;
}
