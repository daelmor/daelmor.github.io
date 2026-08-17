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

/** Every published entry across every collection, newest first. Used by the feed. */
export async function getAllPublished() {
	const collections: CollectionKey[] = ['projects', 'tech', 'philosophy', 'books', 'music'];
	const grouped = await Promise.all(
		collections.map(async (collection) =>
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
