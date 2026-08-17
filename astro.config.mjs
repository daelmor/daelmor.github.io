// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// This repo becomes `daelmor.github.io` — a GitHub *user* site, served from the
	// domain root. `base` must therefore stay unset; setting it would prefix every
	// asset and link with a path segment that does not exist.
	// When a custom domain is attached, change `site` to it and nothing else.
	site: 'https://daelmor.github.io',

	integrations: [mdx(), sitemap()],

	// Phase 0 audited every Markdown file for LaTeX (`$…$`, `$$`, `\(`, `\[`) and
	// for `[[wikilinks]]` and found neither, so `remark-math`, `rehype-katex` and a
	// wikilink plugin are all deliberately absent. Astro 7 ships the native Sätteri
	// Markdown pipeline by default; pulling in `unified()` is only necessary to run
	// remark/rehype plugins, so we stay on the default and keep the build lean.
	// If a future note needs math, install the plugins and switch the processor then.
});
