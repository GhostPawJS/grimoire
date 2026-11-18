#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as esbuild from 'esbuild';
import { addDocsChrome, minifyCss } from './docs_chrome.mjs';

const OUT_DIR = 'demo';
const ENTRY = 'src/demo/main.tsx';
const WATCH = process.argv.includes('--watch');
const EMPTY = './src/demo/empty_module.ts';

const buildOptions = {
	entryPoints: [ENTRY],
	outdir: OUT_DIR,
	bundle: true,
	format: 'esm',
	platform: 'browser',
	target: ['es2022'],
	sourcemap: true,
	minify: !WATCH,
	jsx: 'automatic',
	jsxImportSource: 'preact',
	loader: { '.wasm': 'file', '.json': 'json' },
	entryNames: 'app',
	assetNames: 'assets/[name]-[hash]',
	alias: {
		fs: EMPTY,
		path: EMPTY,
		'node:fs': EMPTY,
		'node:path': EMPTY,
		'node:child_process': EMPTY,
		'node:os': EMPTY,
	},
};

// The top bar and footer sit in the page flow; on phones the menu button
// sticks below them instead of covering the top bar.
const LAYOUT_CSS = `
@media (max-width: 768px) {
	.hamburger { position: sticky; top: 12px; justify-self: start; margin: 12px 0 -2.5rem 12px; }
}
`;

async function writeHtmlShell() {
	const cssPath = join(process.cwd(), 'scripts', 'demo.css');
	const css = await readFile(cssPath, 'utf-8');
	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Spell Forge</title>
<meta name="description" content="Interactive demo of @ghostpaw/grimoire: write skills as SKILL.md files, record evidence about them and watch their rank change. The library runs in your browser on an in-memory SQLite database (sql.js); nothing is sent anywhere." />
<link rel="canonical" href="https://grimoire.ghostpaw.dev/docs/" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Spell Forge · @ghostpaw/grimoire interactive demo" />
<meta property="og:description" content="Interactive demo of @ghostpaw/grimoire: write skills as SKILL.md files, record evidence about them and watch their rank change. The library runs in your browser on an in-memory SQLite database (sql.js); nothing is sent anywhere." />
<meta property="og:url" content="https://grimoire.ghostpaw.dev/docs/" />
<meta property="og:image" content="https://grimoire.ghostpaw.dev/docs/share.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="An open book drawn in cyan light with a ghost paw on its page and a violet rune, beside the line: Your agent edits its SKILL.md. Who keeps the history?" />
<meta name="twitter:card" content="summary_large_image" />
<!-- ghostpaw-docs-shell -->
<style>.pre{max-width:42rem;margin:4rem auto;padding:0 1.25rem;font:400 1rem/1.6 system-ui,sans-serif;color:#dce7f3}.pre h1{font-size:1.6rem;line-height:1.25;margin:0 0 .75rem}.pre h2{font-size:1.15rem;margin:1.5rem 0 .5rem}.pre code{font-family:ui-monospace,Menlo,monospace;font-size:.9em}.pre a{color:#62e6f2}.pre li{margin:.25rem 0}#app:not(:empty)~.pre{display:none}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}</style>
<style>${minifyCss(css)}</style>
</head>
<body>
<div id="app"></div>
<main class="pre">
<h1>Spell Forge: the @ghostpaw/grimoire interactive demo</h1>
<p>Write skills as SKILL.md files, record evidence about them and watch their rank change. This page loads the library into your browser with an in-memory SQLite database (sql.js with FTS5). Nothing is sent anywhere, and closing the tab discards the data. It needs JavaScript; the demo appears here once it has loaded.</p>
<h2>Six views, one library</h2>
<ul>
<li><strong>Dashboard</strong>: overview of the grimoire and the weighted reads from its event log.</li>
<li><strong>Chapters</strong>: spells grouped by chapter.</li>
<li><strong>Inscribe</strong>: spells are SKILL.md files with YAML frontmatter and a short procedural body; the editor shows the parsed frontmatter and validation while you type.</li>
<li><strong>Notes</strong>: observations that can later be distilled into a spell or routed toward a chapter.</li>
<li><strong>Catalogue</strong>: a run computes staleness, health, orphan note clusters and chapter balance from your spells and notes.</li>
<li><strong>Scout</strong>: searches a pre-seeded marketplace snapshot locally, or the public GitHub search API in live mode, and adopts a result with its provenance.</li>
</ul>
<h2>The same operations from the command line</h2>
<p>Every view maps to a CLI command, for example <code>ghostpaw-grimoire spell inscribe &lt;name&gt; --content TEXT</code>, <code>note drop &lt;content&gt; --source &lt;source&gt;</code>, <code>catalogue run</code> and <code>scout search &lt;query&gt;</code>. Results print to stdout; <code>-q</code> only silences the default-database notice on stderr. Rank counts sealed git commits, and <code>spell rollback &lt;path&gt; &lt;ref&gt;</code> restores an earlier version for review.</p>
<h2>Read next</h2>
<ul>
<li><a href="https://grimoire.ghostpaw.dev/">What @ghostpaw/grimoire is, with a worked example</a></li>
<li><a href="https://github.com/GhostPawJS/grimoire#cli">CLI reference</a></li>
<li><a href="https://github.com/GhostPawJS/grimoire/blob/main/docs/entities/SPELLS.md">Spells: frontmatter, chapters and companion files</a></li>
<li><a href="https://github.com/GhostPawJS/grimoire/blob/main/docs/entities/NOTES.md">Notes as evidence for honing</a></li>
<li><a href="https://github.com/GhostPawJS/grimoire/blob/main/docs/entities/HEALTH.md">Catalogue snapshots and health scores</a></li>
<li><a href="https://github.com/GhostPawJS/grimoire#readme">README on GitHub</a></li>
<li><a href="https://www.npmjs.com/package/@ghostpaw/grimoire">@ghostpaw/grimoire on npm</a></li>
<li><a href="https://ghostpaw.dev/">All GhostPaw libraries</a></li>
</ul>
</main>
<script type="module" src="./app.js"></script>
</body>
</html>
`;
	await writeFile(
		join(OUT_DIR, 'index.html'),
		addDocsChrome(html, { lib: 'grimoire', layoutCss: LAYOUT_CSS }),
		'utf-8',
	);
}

async function buildDemo() {
	await rm(OUT_DIR, { recursive: true, force: true });
	await mkdir(OUT_DIR, { recursive: true });
	await writeHtmlShell();
	if (WATCH) {
		const ctx = await esbuild.context(buildOptions);
		await ctx.watch();
		console.log('Watching demo…');
	} else {
		await esbuild.build(buildOptions);
		console.log('Demo built to demo/');
	}
}

buildDemo().catch((err) => {
	console.error(err);
	process.exit(1);
});
