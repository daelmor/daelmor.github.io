import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { entryPath, getAllPublished } from '../lib/content';

const LANGUAGE_NAMES: Record<string, string> = { es: 'Español', en: 'English' };

/** Title as a feed reader will see it, with no page around it for context. */
function feedTitle(data: Record<string, unknown>): string {
	const title = String(data.title);

	if ('company' in data && data.company) return `${data.company}: ${title}`;

	if ('translation' in data && data.translation) {
		const lang = typeof data.lang === 'string' ? data.lang : '';
		const name = LANGUAGE_NAMES[lang] ?? lang;
		return name ? `${title} (${name} translation)` : `${title} (translation)`;
	}

	return title;
}

export async function GET(context: APIContext) {
	const all = await getAllPublished();

	/*
	 * Books are left out of the writing feed.
	 *
	 * There are 78 of them, dated by when they were shelved, so they arrived in
	 * one block and pushed every essay and article off the front of the feed —
	 * 78 items out of 106. A shelf entry is also not a piece of writing: it has
	 * no body, and its description is the publisher's blurb. The shelf is
	 * browsable at /books/ instead.
	 */
	const items = all.filter(({ collection }) => collection !== 'books');

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site ?? 'https://daelmor.github.io',
		items: items.map(({ collection, entry }) => ({
			// Feed readers show titles with no surrounding context, so a project
			// carries its company. Without it three separate entries would all
			// read as bare service names under the same author.
			//
			// A translation is marked as one: the feed is chronological, and two
			// same-dated entries with different titles otherwise look like two
			// separate pieces of writing rather than one piece in two languages.
			title: feedTitle(entry.data),
			description: entry.data.summary,
			pubDate: entry.data.date,
			link: entryPath(collection, entry.id),
			categories: [collection, ...entry.data.tags],
		})),
	});
}
