import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { applyUpdate } from './apply_update.ts';

describe('applyUpdate', () => {
	it('is an async function', () => {
		assert.equal(typeof applyUpdate, 'function');
	});

	it('throws GrimoireNotFoundError when no provenance exists', async () => {
		const { root, cleanup } = createTestRoot();
		const db = createTestDb();
		try {
			await assert.rejects(
				() => applyUpdate(root, db, 'general/nonexistent'),
				(err: unknown) => {
					assert.ok(err instanceof GrimoireNotFoundError);
					return true;
				},
			);
		} finally {
			db.close();
			cleanup();
		}
	});

	it('throws when provenance has no source URL or repo', async () => {
		const { root, cleanup } = createTestRoot();
		const db = createTestDb();
		try {
			db.prepare(
				`INSERT INTO spell_provenance (spell_path, source_type, source_url, source_repo, source_path, source_commit, source_version, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			).run('general/test-spell', 'local', null, null, null, null, null, new Date().toISOString());

			await assert.rejects(
				() => applyUpdate(root, db, 'general/test-spell'),
				(err: unknown) => {
					assert.ok(err instanceof GrimoireNotFoundError);
					assert.ok((err as Error).message.includes('no source URL or repo'));
					return true;
				},
			);
		} finally {
			db.close();
			cleanup();
		}
	});

	it('returns a promise', () => {
		const db = createTestDb();
		try {
			const result = applyUpdate('/tmp', db, 'general/test');
			assert.ok(result instanceof Promise);
			result.catch(() => {});
		} finally {
			db.close();
		}
	});
});
