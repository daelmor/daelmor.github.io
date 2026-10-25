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
			// Reading face: article text and the major editorial headings.
			provider: fontProviders.google(),
			name: 'Source Serif 4',
			cssVariable: '--font-source-serif',
			weights: ['400 700'],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Georgia', 'serif'],
			display: 'swap',
		},
		{
			// Interface face: navigation, labels and metadata.
			provider: fontProviders.google(),
			name: 'Inter',
			cssVariable: '--font-inter',
			weights: ['400 600'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
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
