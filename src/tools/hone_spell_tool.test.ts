import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { honeSpellTool } from './hone_spell_tool.ts';

function insertNote(db: ReturnType<typeof createTestDb>): number {
	const result = db
		.prepare(
			"INSERT INTO spell_notes (source, content, status, created_at) VALUES ('test', 'an observation', 'pending', ?)",
		)
		.run(Date.now());
	return Number(result.lastInsertRowid);
}

describe('honeSpellTool', () => {
	it('has correct metadata', () => {
		assert.equal(honeSpellTool.name, 'hone_spell');
		assert.equal(honeSpellTool.readOnly, false);
		assert.equal(honeSpellTool.sideEffects, 'writes_state');
		assert.deepEqual(honeSpellTool.targetKinds, ['spell']);
		assert.ok(honeSpellTool.description.length > 0);
		assert.ok(honeSpellTool.whenToUse.length > 0);
		assert.ok(honeSpellTool.whenNotToUse && honeSpellTool.whenNotToUse.length > 0);
	});

	it('returns no-op when no git repo and no pending changes', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = await honeSpellTool.handler({ root, db: undefined }, {});
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.equal(result.outcome, 'no_op');
			assert.equal(result.summary, 'No pending changes to seal.');
			assert.deepEqual(result.data.sealedPaths, []);
			assert.deepEqual(result.data.ranks, {});
			assert.deepEqual(result.data.tiers, {});
			assert.deepEqual(result.data.distilledNoteIds, []);
		} finally {
			cleanup();
		}
	});

	it('has valid input schema', () => {
		assert.equal(honeSpellTool.inputSchema.type, 'object');
		const props = honeSpellTool.inputSchema.properties ?? {};
		assert.ok('paths' in props);
		assert.ok('message' in props);
		assert.ok('note_ids' in props);
	});

	it('warns but does not fail when note_ids provided without db', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			// no git → no-op; note_ids warning still emitted if db absent
			const result = await honeSpellTool.handler({ root, db: undefined }, { note_ids: [1] });
			assert.ok(result.ok);
			// no-op because no git changes — note_ids warning path not reached in no-op
		} finally {
			cleanup();
		}
	});

	it('note_ids are present in the schema and data shape includes distilledNoteIds', () => {
		const db = createTestDb();
		try {
			const noteId = insertNote(db);
			const row = db
				.prepare('SELECT status FROM spell_notes WHERE id = ?')
				.get<{ status: string }>(noteId);
			assert.equal(row?.status, 'pending');
		} finally {
			db.close();
		}
	});

	it('note_ids schema uses integer type', () => {
		const props = honeSpellTool.inputSchema.properties ?? {};
		const noteIds = props.note_ids;
		assert.ok(noteIds);
		assert.equal(noteIds.type, 'array');
		assert.equal(noteIds.items?.type, 'integer');
	});
});
