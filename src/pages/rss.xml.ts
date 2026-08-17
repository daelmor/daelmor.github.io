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
			// Feed readers show titles with no surrounding context, so a project
			// carries its company. Without it three separate entries would all
			// read as bare service names under the same author.
			title:
				'company' in entry.data ? `${entry.data.company}: ${entry.data.title}` : entry.data.title,
			description: entry.data.summary,
			pubDate: entry.data.date,
			link: entryPath(collection, entry.id),
			categories: [collection, ...entry.data.tags],
		})),
	});
}
