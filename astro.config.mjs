// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// This repo becomes `daelmor.github.io` — a GitHub *user* site, served from the
	// domain root. `base` must therefore stay unset; setting it would prefix every
	// asset and link with a path segment that does not exist.
	// When a custom domain is attached, change `site` to it and nothing else.
	site: 'https://daelmor.github.io',

	integrations: [mdx(), sitemap()],

	// Downloaded, subset and self-hosted at build time. No request ever leaves
	// for a font CDN, so there is no third-party dependency and no layout shift.
	fonts: [
		{
			// Omnibus-Type, Buenos Aires. Drawn from American gothic wood type for
			// use in documents and forms, with Spanish diacritics designed rather
			// than retrofitted — this site contains a Spanish paragraph and says
			// "Guatemala" repeatedly. Used only for the wordmark and page H1.
			//
			// Fontsource, not Google, on purpose: Google's provider serves Archivo
			// as a weight-only variable font pinned at `font-stretch: 100%`, which
			// silently makes the expanded width used on H1 a no-op. Fontsource
			// ships the real two-axis build (`font-stretch: 62% 125%`). Costs about
			// 54kB more, which is the whole reason the display face has a voice.
			provider: fontProviders.fontsource(),
			name: 'Archivo',
			cssVariable: '--font-archivo',
			weights: ['500 700'],
			styles: ['normal'],
			subsets: ['latin'],
			stretch: '62% 125%',
			fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
			display: 'swap',
		},
		{
			// Commissioned for extended screen reading. Deliberately LOW contrast,
			// which is what keeps it clear of the high-contrast display serif this
			// design is avoiding. Carries true tabular figures for the time axis.
			provider: fontProviders.google(),
			name: 'Literata',
			cssVariable: '--font-literata',
			weights: ['400 600'],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Georgia', 'serif'],
			display: 'swap',
		},
	],

	// Phase 0 audited every Markdown file for LaTeX (`$…$`, `$$`, `\(`, `\[`) and
	// for `[[wikilinks]]` and found neither, so `remark-math`, `rehype-katex` and a
	// wikilink plugin are all deliberately absent. Astro 7 ships the native Sätteri
	// Markdown pipeline by default; pulling in `unified()` is only necessary to run
	// remark/rehype plugins, so we stay on the default and keep the build lean.
	// If a future note needs math, install the plugins and switch the processor then.
});
