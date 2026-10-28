import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { grimoireCliOptions } from './grimoire_cli_options.ts';

for (const command of [
	['spell', 'delete', '../outside'],
	['inspect', '/etc/passwd'],
	['spell', 'hone', '../outside'],
	['spell', 'move', '../outside', 'general/target'],
])
	test(`${command.join(' ')} returns validation exit 2`, async () => {
		const { root, cleanup } = createTestRoot();
		try {
			let output = '';
			const code = await runToolCli([...command, '--json'], {
				...grimoireCliOptions,
				openContext: () => ({ root }),
				closeContext: () => {},
				stdin: Readable.from([]),
				stdout: new Writable({
					write(chunk, _encoding, cb) {
						output += String(chunk);
						cb();
					},
				}),
				stderr: new Writable({
					write(_chunk, _encoding, cb) {
						cb();
					},
				}),
			});
			assert.equal(code, 2);
			assert.equal(JSON.parse(output).error.code, 'validation_failed');
		} finally {
			cleanup();
		}
	});

test('move --target conflicts once on stderr and --force replaces the target', async () => {
	const { root, cleanup } = createTestRoot({
		chapters: [{ name: 'general', spells: [{ name: 'source' }, { name: 'target' }] }],
	});
	try {
		const original = readFileSync(join(root, 'general/source/SKILL.md'), 'utf8');
		for (const force of [false, true]) {
			let output = '';
			let error = '';
			const code = await runToolCli(
				[
					'spell',
					'move',
					'general/source',
					'--target',
					'general/target',
					...(force ? ['--force'] : []),
					'--json',
				],
				{
					...grimoireCliOptions,
					openContext: () => ({ root }),
					closeContext: () => {},
					stdin: Readable.from([]),
					stdout: new Writable({
						write(chunk, _encoding, cb) {
							output += String(chunk);
							cb();
						},
					}),
					stderr: new Writable({
						write(chunk, _encoding, cb) {
							error += String(chunk);
							cb();
						},
					}),
				},
			);
			assert.equal(code, force ? 0 : 4);
			if (!force) {
				const result = JSON.parse(output);
				assert.equal(result.error.code, 'conflict');
				assert.equal(error.split(result.error.message).length - 1, 1);
				assert.equal(error.split('force: true').length - 1, 1);
				assert.match(error, /Inspect the existing spell/);
			} else {
				assert.equal(existsSync(join(root, 'general/source')), false);
				assert.equal(readFileSync(join(root, 'general/target/SKILL.md'), 'utf8'), original);
			}
		}
	} finally {
		cleanup();
	}
});
