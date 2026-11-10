import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { resolveGrimoireRoot } from './resolve_grimoire_root.ts';

test('DB environment isolates the root with explicit root precedence', () => {
	const env = { GHOSTPAW_GRIMOIRE_DB: '/tmp/isolated/state.db' };
	assert.equal(resolveGrimoireRoot({ env }), '/tmp/isolated/grimoire');
	assert.equal(
		resolveGrimoireRoot({ env: { ...env, GHOSTPAW_GRIMOIRE_ROOT: '/tmp/env-root' } }),
		'/tmp/env-root',
	);
	assert.equal(
		resolveGrimoireRoot({
			root: '/tmp/flag-root',
			env: { ...env, GHOSTPAW_GRIMOIRE_ROOT: '/tmp/env-root' },
		}),
		'/tmp/flag-root',
	);
	assert.equal(
		resolveGrimoireRoot({ env: { GHOSTPAW_GRIMOIRE_DB: 'local/state.db' } }),
		resolve('local/grimoire'),
	);
});
test('unset, empty and in-memory DB environment preserve the original default', () => {
	for (const env of [{}, { GHOSTPAW_GRIMOIRE_DB: '' }, { GHOSTPAW_GRIMOIRE_DB: ':memory:' }])
		assert.equal(resolveGrimoireRoot({ env }), join(homedir(), '.ghostpaw', 'grimoire'));
});

test('CLI state help uses the same DB-derived root and explicit Git precedence', async () => {
	const { grimoireCliOptions } = await import('./grimoire_cli_options.ts');
	const names = [
		'GHOSTPAW_GRIMOIRE_DB',
		'GHOSTPAW_GRIMOIRE_ROOT',
		'GHOSTPAW_GRIMOIRE_GIT_DIR',
	] as const;
	const previous = names.map((name) => process.env[name]);
	try {
		process.env.GHOSTPAW_GRIMOIRE_DB = '/tmp/isolation/state.db';
		delete process.env.GHOSTPAW_GRIMOIRE_ROOT;
		delete process.env.GHOSTPAW_GRIMOIRE_GIT_DIR;
		const state = grimoireCliOptions.describeDb?.({});
		assert.match(
			state ?? '',
			/Root \/tmp\/isolation\/grimoire\nGit \/tmp\/isolation\/grimoire\/\.grimoire-git/,
		);
		process.env.GHOSTPAW_GRIMOIRE_GIT_DIR = '/tmp/explicit-history';
		assert.match(
			grimoireCliOptions.describeDb?.({ db: '/tmp/flag.db' }) ?? '',
			/Root \/tmp\/isolation\/grimoire\nGit \/tmp\/explicit-history/,
		);
	} finally {
		names.forEach((name, index) => {
			if (previous[index] === undefined) delete process.env[name];
			else process.env[name] = previous[index];
		});
	}
});
