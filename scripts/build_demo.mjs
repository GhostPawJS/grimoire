#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as esbuild from 'esbuild';

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

async function writeHtmlShell() {
	const cssPath = join(process.cwd(), 'scripts', 'demo.css');
	const css = await readFile(cssPath, 'utf-8');
	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Spell Forge</title>
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<script type="module" src="./app.js"></script>
</body>
</html>
`;
	await writeFile(join(OUT_DIR, 'index.html'), html, 'utf-8');
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
