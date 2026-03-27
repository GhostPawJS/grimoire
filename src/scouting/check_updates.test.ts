import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { checkUpdates } from './check_updates.ts';

describe('checkUpdates', () => {
	it('returns empty array when no provenance records exist', async () => {
		const db = createTestDb();
		try {
			const result = await checkUpdates('/tmp/grimoire-check-updates-test', db);
			assert.ok(Array.isArray(result));
			assert.equal(result.length, 0);
		} finally {
			db.close();
		}
	});

	it('is an async function', () => {
		assert.equal(typeof checkUpdates, 'function');
		const db = createTestDb();
		try {
			const result = checkUpdates('/tmp', db);
			assert.ok(result instanceof Promise);
		} finally {
			db.close();
		}
	});

	it('returns UpdateCheck objects with expected shape', async () => {
		const db = createTestDb();
		try {
			db.prepare(
				`INSERT INTO spell_provenance (spell_path, source_type, source_url, source_repo, source_path, source_commit, source_version, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			).run(
				'general/test-spell',
				'local',
				null,
				null,
				'/some/local/path',
				null,
				null,
				new Date().toISOString(),
			);

			const results = await checkUpdates('/tmp/grimoire-check-updates-test', db);
			assert.equal(results.length, 1);
			assert.equal(results[0]?.spellPath, 'general/test-spell');
			assert.equal(results[0]?.provenance.sourceType, 'local');
			assert.equal(results[0]?.latestCommit, undefined);
			assert.equal(typeof results[0]?.hasLocalEvolution, 'boolean');
			assert.equal(typeof results[0]?.localRank, 'number');
		} finally {
			db.close();
		}
	});
});
