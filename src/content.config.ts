import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content collections.
 *
 * Only `projects` has real content today. The other four are scaffolded so the
 * routes, feeds and sitemap exist from day one, and so adding the first entry to
 * any of them is a one-file operation.
 *
 * Deliberate omissions, per the Phase 0 audit:
 *  - No field carries a `.default()` except `draft` and `tags`. A missing `title`,
 *    `summary` or `date` is a build error naming the offending file, never a
 *    silently invented value.
 *  - `author` is gone. It read "David Elizondo" in all seven source files, so it
 *    lives in `src/consts.ts` instead of being restated on every entry.
 *  - `slug` is gone. It duplicated the directory name in all seven source files;
 *    Astro derives the entry id from the filename.
 */

/** Fields every collection shares. Spread into each schema below. */
const common = {
	title: z.string().min(1),
	summary: z.string().min(1),
	/**
	 * Sorting key for the whole site, newest first.
	 *
	 * For `projects` this is the date the engagement *began*. Sorting on the end
	 * date was the original plan, but three of the seven projects turned out to
	 * be open-ended, which collapsed them into a tie at today's date and pushed
	 * a 2017 engagement above current work. Start date has no such degenerate
	 * case and still reads as reverse-chronological.
	 *
	 * Never the Ghost publish date the archive shipped with — that contradicted
	 * the body text in five of seven files.
	 */
	date: z.coerce.date(),
	tags: z.array(z.string()).default([]),
	draft: z.boolean().default(false),
};

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			...common,
			/** Split out of the archived `"Company: Project"` title format. */
			company: z.string().min(1),
			role: z.string().min(1),
			/**
			 * When *the engagement* ended. Three states, each written out
			 * explicitly, because the archive turned out to contain all three:
			 *
			 *   end: 2022-09-30   ended on this date
			 *   end: present      still ongoing
			 *   end: null         ended, but no date on record
			 *
			 * Required, never optional. An omitted `end` is a build error rather
			 * than a project quietly presenting itself as current work — and
			 * `null` cannot stand in for "ongoing", which is what made Tigo read
			 * as active for years after the engagement finished.
			 */
			// Order matters. `z.coerce.date()` happily coerces null to the Unix
			// epoch rather than failing, so if it came first every "ended, undated"
			// project would silently render as January 1970. The literal and null
			// branches have to be tried before it.
			end: z.union([z.literal('present'), z.null(), z.coerce.date()]),
			/**
			 * Whether *the system* is still running in production, which is a
			 * different question from whether the engagement is still going. Tigo
			 * is the case that forced these apart: the engagement ended years ago
			 * and the portal is still serving customers.
			 *
			 * `null` means genuinely not known, and renders as nothing at all —
			 * better than quietly asserting either state.
			 */
			inProduction: z.boolean().nullable(),
			/** Flattened from each article's "Technologies Used" section. */
			tech: z.array(z.string()).min(1),
			hero: image(),
			/**
			 * Required on purpose. The archive shipped hero alt text that merely
			 * repeated the title and left all inline images with empty alt
			 * attributes; making this required stops that regressing silently.
			 */
			heroAlt: z.string().min(1),
			/**
			 * Provenance only — never rendered as a link. Every value points at
			 * theseusthread.com, which is being retired.
			 */
			source: z.url().optional(),
		}),
});

const tech = defineCollection({
	loader: glob({ base: './src/content/tech', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			...common,
			hero: image().optional(),
			heroAlt: z.string().min(1).optional(),
		}),
});

const philosophy = defineCollection({
	loader: glob({ base: './src/content/philosophy', pattern: '**/*.{md,mdx}' }),
	schema: z.object({ ...common }),
});

const books = defineCollection({
	loader: glob({ base: './src/content/books', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			...common,
			/** The book's author, as distinct from the author of the notes. */
			bookAuthor: z.string().min(1),
			/** Year the book was published, not the year it was read. */
			published: z.number().int().optional(),
			cover: image().optional(),
			coverAlt: z.string().min(1).optional(),
		}),
});

const music = defineCollection({
	loader: glob({ base: './src/content/music', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		...common,
		/** e.g. a specific opera, score or album under analysis. */
		work: z.string().min(1).optional(),
		composer: z.string().min(1).optional(),
	}),
});

export const collections = { projects, tech, philosophy, books, music };
