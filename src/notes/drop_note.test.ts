import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNote } from './drop_note.ts';

describe('dropNote', () => {
	it('inserts a note and returns id', () => {
		const db = createTestDb();
		const { id } = dropNote(db, { source: 'src', content: 'hello' });
		assert.equal(id, 1);

		const row = db
			.prepare(
				'SELECT source, source_id, content, domain, status, created_at FROM spell_notes WHERE id = ?',
			)
			.get<{
				source: string;
				source_id: string | null;
				content: string;
				domain: string | null;
				status: string;
				created_at: number;
			}>(id);
		assert.equal(row?.source, 'src');
		assert.equal(row?.source_id, null);
		assert.equal(row?.content, 'hello');
		assert.equal(row?.domain, null);
		assert.equal(row?.status, 'pending');
		assert.equal(typeof row?.created_at, 'number');

		db.close();
	});

	it('normalizes content before insert', () => {
		const db = createTestDb();
		dropNote(db, { source: 's', content: '  a   b\tc  ', now: 100 });
		const row = db.prepare('SELECT content FROM spell_notes LIMIT 1').get<{ content: string }>();
		assert.equal(row?.content, 'a b c');
		db.close();
	});

	it('stores optional sourceId and domain', () => {
		const db = createTestDb();
		dropNote(db, {
			source: 's',
			sourceId: 'ext-1',
			content: 'x',
			domain: 'water',
			now: 200,
		});
		const row = db
			.prepare('SELECT source_id, domain FROM spell_notes LIMIT 1')
			.get<{ source_id: string | null; domain: string | null }>();
		assert.equal(row?.source_id, 'ext-1');
		assert.equal(row?.domain, 'water');
		db.close();
	});
});
