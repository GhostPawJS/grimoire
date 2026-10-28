import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { test } from 'node:test';

test('guard roots are removed on success and failure without deleting supplied roots', () => {
	for (const fail of [false, true]) {
		const env = { ...process.env };
		delete env.GHOSTPAW_GRIMOIRE_ROOT;
		const result = spawnSync(
			process.execPath,
			[
				'--input-type=module',
				'-e',
				`await import(${JSON.stringify(new URL('./config.mjs', import.meta.url).href)}); console.log(process.env.GHOSTPAW_GRIMOIRE_ROOT); ${fail ? 'throw new Error("failure")' : ''}`,
			],
			{ env, encoding: 'utf8' },
		);
		assert.equal(result.status, fail ? 1 : 0);
		assert.equal(existsSync(dirname(result.stdout.trim())), false);
	}
});

test('guard config preserves a caller-supplied root', () => {
	const root = process.cwd();
	const result = spawnSync(
		process.execPath,
		[
			'--input-type=module',
			'-e',
			`await import(${JSON.stringify(new URL('./config.mjs', import.meta.url).href)}); console.log(process.env.GHOSTPAW_GRIMOIRE_ROOT);`,
		],
		{ env: { ...process.env, GHOSTPAW_GRIMOIRE_ROOT: root }, encoding: 'utf8' },
	);
	assert.equal(result.status, 0);
	assert.equal(result.stdout.trim(), root);
	assert.ok(existsSync(root));
});
