/** Site-wide constants. Referenced by meta tags, the RSS feed and the nav. */

export const SITE_TITLE = 'David Elizondo';

/**
 * TODO(david): this is derived strictly from what the seven archived articles
 * actually describe — payments, digital invoicing, fintech, Central America —
 * rather than written as a tagline. Replace it with your own wording.
 */
export const SITE_DESCRIPTION =
	'Engineering write-ups on payments, digital invoicing and fintech infrastructure in Central America.';

export const SITE_AUTHOR = 'David Elizondo';

/** Language of the site chrome. Individual elements override this where needed. */
export const SITE_LANG = 'en';

/**
 * The five sections. `projects` is the only one with content today; the rest are
 * scaffolded and are hidden from the nav until they have at least one entry.
 */
export const SECTIONS = [
	{ slug: 'projects', label: 'Projects' },
	{ slug: 'tech', label: 'Tech' },
	{ slug: 'philosophy', label: 'Philosophy' },
	{ slug: 'books', label: 'Books' },
	{ slug: 'music', label: 'Music' },
] as const;

export type SectionSlug = (typeof SECTIONS)[number]['slug'];
