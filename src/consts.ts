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

/**
 * Everything except `projects`, which has bespoke routes because it carries
 * hero images, a stack and an engagement span. These four share one generic
 * pair of routes, so the first file dropped into any of them is immediately
 * live at its own URL with no extra wiring.
 */
export const WRITING_SECTIONS = ['tech', 'philosophy', 'books', 'music'] as const;

export type WritingSection = (typeof WRITING_SECTIONS)[number];

export const SECTION_LABELS: Record<SectionSlug, string> = Object.fromEntries(
	SECTIONS.map((s) => [s.slug, s.label]),
) as Record<SectionSlug, string>;

/**
 * Sections served by the generic `[section]` routes.
 *
 * `books` is excluded: 78 entries with cover art need a grid grouped by shelf
 * and a detail page that renders an attributed synopsis, so it has its own
 * routes under src/pages/books/. Leaving it here as well would mean two route
 * files racing to build the same URL.
 */
export const GENERIC_SECTIONS = WRITING_SECTIONS.filter((s) => s !== 'books');
