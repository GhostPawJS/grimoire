import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestDb } from '../lib/test-db.ts';
import { distill } from './distill.ts';
import { dropNote } from './drop_note.ts';

describe('distill', () => {
	it('marks a pending note as distilled', () => {
		const db = createTestDb();
		const { id } = dropNote(db, { source: 's', content: 'c', now: 1 });
		distill(db, id, '/spells/x');
		const row = db
			.prepare('SELECT status, distilled_by FROM spell_notes WHERE id = ?')
			.get<{ status: string; distilled_by: string | null }>(id);
		assert.equal(row?.status, 'distilled');
		assert.equal(row?.distilled_by, '/spells/x');
		db.close();
	});

	it('throws for missing id', () => {
		const db = createTestDb();
		assert.throws(
			() => distill(db, 999, '/spells/x'),
			(err) => err instanceof GrimoireNotFoundError,
		);
		db.close();
	});

	it('throws when note is already distilled', () => {
		const db = createTestDb();
		const { id } = dropNote(db, { source: 's', content: 'c', now: 1 });
		distill(db, id, '/a');
		assert.throws(
			() => distill(db, id, '/b'),
			(err) => err instanceof GrimoireNotFoundError,
		);
		db.close();
	});
});
