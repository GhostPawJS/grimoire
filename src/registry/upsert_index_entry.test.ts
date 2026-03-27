import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import type { RegistryEntryRow } from './types.ts';
import { upsertIndexEntry } from './upsert_index_entry.ts';

describe('upsertIndexEntry', () => {
	it('inserts a new entry and returns id', () => {
		const db = createTestDb();

		const { id } = upsertIndexEntry(db, {
			source: 'github',
			slug: 'new',
			name: 'New Entry',
		});
		assert.ok(id > 0);

		const row = db
			.prepare(
				'SELECT id, source, slug, name, description, adoption_count, source_repo, source_path, fetch_url, last_seen FROM scout_index WHERE id = ?',
			)
			.get<RegistryEntryRow>(id);
		assert.equal(row?.slug, 'new');
		assert.equal(row?.name, 'New Entry');

		db.close();
	});

	it('upserts an existing row for the same source and slug', () => {
		const db = createTestDb();

		const first = upsertIndexEntry(db, {
			source: 'agentskillhub',
			slug: 'same',
			name: 'Before',
			description: 'old desc',
		});
		const second = upsertIndexEntry(db, {
			source: 'agentskillhub',
			slug: 'same',
			name: 'After',
			description: 'new desc',
			adoptionCount: 99,
		});

		assert.equal(second.id, first.id);

		const count = db
			.prepare('SELECT COUNT(*) AS c FROM scout_index WHERE source = ? AND slug = ?')
			.get<{ c: number }>('agentskillhub', 'same')?.c;
		assert.equal(count, 1);

		db.close();
	});

	it('updates stored fields on conflict', () => {
		const db = createTestDb();

		upsertIndexEntry(db, {
			source: 'github',
			slug: 'pkg',
			name: 'Original',
			description: 'alpha',
			sourceRepo: 'a/b',
			sourcePath: 'old.md',
			fetchUrl: 'https://old.example',
		});

		upsertIndexEntry(db, {
			source: 'github',
			slug: 'pkg',
			name: 'Updated',
			description: 'beta',
			adoptionCount: 3,
			sourceRepo: 'c/d',
			sourcePath: 'new.md',
			fetchUrl: 'https://new.example',
		});

		const row = db
			.prepare(
				'SELECT name, description, adoption_count, source_repo, source_path, fetch_url FROM scout_index WHERE source = ? AND slug = ?',
			)
			.get<{
				name: string;
				description: string | null;
				adoption_count: number | null;
				source_repo: string | null;
				source_path: string | null;
				fetch_url: string | null;
			}>('github', 'pkg');

		assert.equal(row?.name, 'Updated');
		assert.equal(row?.description, 'beta');
		assert.equal(row?.adoption_count, 3);
		assert.equal(row?.source_repo, 'c/d');
		assert.equal(row?.source_path, 'new.md');
		assert.equal(row?.fetch_url, 'https://new.example');

		db.close();
	});
});
