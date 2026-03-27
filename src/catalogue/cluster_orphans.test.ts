import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { clusterOrphans } from './cluster_orphans.ts';

function insertNote(db: ReturnType<typeof createTestDb>, source: string, content: string): number {
	const result = db
		.prepare(
			'INSERT INTO spell_notes (source, content, domain, status, created_at) VALUES (?, ?, NULL, ?, ?)',
		)
		.run(source, content, 'pending', Date.now());
	return Number(result.lastInsertRowid);
}

function insertDraft(db: ReturnType<typeof createTestDb>, noteIds: number[]): void {
	db.prepare(
		"INSERT INTO spell_drafts (title, rationale, note_ids, chapter, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)",
	).run('draft', 'rationale', JSON.stringify(noteIds), 'general', Date.now());
}

describe('clusterOrphans', () => {
	it('forms clusters from similar notes with multiple sources', () => {
		const db = createTestDb();
		insertNote(db, 'source-a', 'advanced typescript generics patterns and type inference');
		insertNote(db, 'source-b', 'advanced typescript generics and type system patterns');
		insertNote(db, 'source-c', 'typescript generics patterns advanced type usage');

		const clusters = clusterOrphans(db, 0.3);
		assert.equal(clusters.length, 1);
		assert.equal(clusters[0]?.memberCount, 3);
		assert.ok((clusters[0]?.sourceCount ?? 0) >= 2);
		assert.ok((clusters[0]?.suggestedTerms.length ?? 0) > 0);
		db.close();
	});

	it('excludes notes referenced by drafts', () => {
		const db = createTestDb();
		const id1 = insertNote(
			db,
			'source-a',
			'advanced typescript generics patterns and type inference',
		);
		insertNote(db, 'source-b', 'advanced typescript generics and type system patterns');
		insertNote(db, 'source-c', 'typescript generics patterns advanced type usage');
		insertDraft(db, [id1]);

		const clusters = clusterOrphans(db, 0.3);
		for (const cluster of clusters) {
			assert.ok(!cluster.noteIds.includes(id1));
		}
		db.close();
	});

	it('filters clusters with fewer than 3 members', () => {
		const db = createTestDb();
		insertNote(db, 'source-a', 'typescript generics patterns');
		insertNote(db, 'source-b', 'typescript generics patterns');

		const clusters = clusterOrphans(db, 0.3);
		assert.equal(clusters.length, 0);
		db.close();
	});

	it('filters clusters from single source', () => {
		const db = createTestDb();
		insertNote(db, 'same-source', 'advanced typescript generics patterns and type inference');
		insertNote(db, 'same-source', 'advanced typescript generics and type system patterns');
		insertNote(db, 'same-source', 'typescript generics patterns advanced type usage');

		const clusters = clusterOrphans(db, 0.3);
		assert.equal(clusters.length, 0);
		db.close();
	});

	it('returns empty for no notes', () => {
		const db = createTestDb();
		const clusters = clusterOrphans(db);
		assert.deepEqual(clusters, []);
		db.close();
	});
});
