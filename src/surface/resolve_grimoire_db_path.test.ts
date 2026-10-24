import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { resolveGrimoireDbPath } from './resolve_grimoire_db_path.ts';

test('database path precedence is flag, environment, home default', () => {
	assert.equal(
		resolveGrimoireDbPath({ flag: ':memory:', env: { GHOSTPAW_GRIMOIRE_DB: 'env' } }),
		':memory:',
	);
	assert.equal(resolveGrimoireDbPath({ env: { GHOSTPAW_GRIMOIRE_DB: 'env' } }), 'env');
	assert.equal(resolveGrimoireDbPath({ env: {} }), join(homedir(), '.ghostpaw', 'grimoire.db'));
});

test('empty environment path uses the default', () => {
	assert.equal(
		resolveGrimoireDbPath({ env: { GHOSTPAW_GRIMOIRE_DB: '' } }),
		resolveGrimoireDbPath({ env: {} }),
	);
});
