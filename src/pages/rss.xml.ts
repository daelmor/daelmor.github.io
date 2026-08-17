import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { entryPath, getAllPublished } from '../lib/content';

export async function GET(context: APIContext) {
	const items = await getAllPublished();

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site ?? 'https://daelmor.github.io',
		items: items.map(({ collection, entry }) => ({
			title: entry.data.title,
			description: entry.data.summary,
			pubDate: entry.data.date,
			link: entryPath(collection, entry.id),
			categories: [collection, ...entry.data.tags],
		})),
	});
}
