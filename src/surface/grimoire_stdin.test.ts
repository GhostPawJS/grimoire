import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('text stdin works for noun and legacy flags, while a final dash reads JSON after a positional name', async () => {
	const directory = mkdtempSync(join(tmpdir(), 'grimoire-stdin-'));
	const content = (name: string) =>
		`---\nname: ${name}\ndescription: Stdin procedure\n---\nBody from stdin\n`;
	const invoke = (args: string[], input: string) =>
		new Promise<{ code: number | null; out: string; err: string }>((resolve, reject) => {
			const child = spawn(
				process.execPath,
				[
					'--no-warnings',
					'--experimental-strip-types',
					fileURLToPath(new URL('../cli.ts', import.meta.url)),
					...args,
					'--db',
					join(directory, 'state.db'),
					'--root',
					join(directory, 'root'),
					'--json',
				],
				{ stdio: ['pipe', 'pipe', 'pipe'] },
			);
			let out = '',
				err = '';
			child.stdout.on('data', (chunk) => {
				out += String(chunk);
			});
			child.stderr.on('data', (chunk) => {
				err += String(chunk);
			});
			child.on('error', reject);
			child.on('close', (code) => resolve({ code, out, err }));
			child.stdin.end(input);
		});
	try {
		for (const [args, input] of [
			[['spell', 'inscribe', 'first', '--content', '@-'], content('first')],
			[['inscribe_spell', '--name', 'second', '--content', '@-'], content('second')],
			[['spell', 'inscribe', 'third', '-'], JSON.stringify({ content: content('third') })],
		] as [string[], string][]) {
			const result = await invoke(args, input);
			assert.equal(result.code, 0, `${result.out}\n${result.err}`);
			assert.equal(JSON.parse(result.out).ok, true);
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
