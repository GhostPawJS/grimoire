import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { distillNoteTool } from './distill_note_tool.ts';

function insertNote(db: ReturnType<typeof createTestDb>): number {
	const result = db
		.prepare(
			"INSERT INTO spell_notes (source, content, status, created_at) VALUES ('test', 'an observation', 'pending', ?)",
		)
		.run(Date.now());
	return Number(result.lastInsertRowid);
}

describe('distillNoteTool', () => {
	it('has correct metadata', () => {
		assert.equal(distillNoteTool.name, 'distill_note');
		assert.equal(distillNoteTool.readOnly, false);
		assert.equal(distillNoteTool.sideEffects, 'writes_state');
		assert.deepEqual(distillNoteTool.targetKinds, ['note']);
		assert.ok(distillNoteTool.description.length > 0);
		assert.ok(distillNoteTool.whenToUse.length > 0);
		assert.ok(distillNoteTool.whenNotToUse && distillNoteTool.whenNotToUse.length > 0);
	});

	it('has valid input schema with required note_id and spell_path', () => {
		assert.equal(distillNoteTool.inputSchema.type, 'object');
		const props = distillNoteTool.inputSchema.properties ?? {};
		assert.ok('note_id' in props);
		assert.ok('spell_path' in props);
		assert.ok(distillNoteTool.inputSchema.required?.includes('note_id'));
		assert.ok(distillNoteTool.inputSchema.required?.includes('spell_path'));
	});

	it('marks note as distilled and returns success', () => {
		const db = createTestDb();
		try {
			const noteId = insertNote(db);
			const result = distillNoteTool.handler(
				{ root: '/unused', db },
				{ note_id: noteId, spell_path: 'general/writing' },
			);
			assert.ok(!(result instanceof Promise));
			assert.equal(result.ok, true);
			assert.equal(result.outcome, 'success');
			assert.ok(result.summary.includes(String(noteId)));
			assert.ok(result.summary.includes('general/writing'));

			const row = db
				.prepare('SELECT status, distilled_by FROM spell_notes WHERE id = ?')
				.get<{ status: string; distilled_by: string }>(noteId);
			assert.ok(row);
			assert.equal(row.status, 'distilled');
			assert.equal(row.distilled_by, 'general/writing');
		} finally {
			db.close();
		}
	});

	it('returns error for a note that does not exist', () => {
		const db = createTestDb();
		try {
			const result = distillNoteTool.handler(
				{ root: '/unused', db },
				{ note_id: 9999, spell_path: 'general/writing' },
			);
			assert.ok(!(result instanceof Promise));
			assert.equal(result.ok, false);
			assert.equal(result.outcome, 'error');
		} finally {
			db.close();
		}
	});

	it('returns error when db is not provided', () => {
		const result = distillNoteTool.handler(
			{ root: '/unused', db: undefined },
			{ note_id: 1, spell_path: 'general/writing' },
		);
		assert.ok(!(result instanceof Promise));
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
	});

	it('suggests inspect_grimoire_item and review notes as next steps', () => {
		const db = createTestDb();
		try {
			const noteId = insertNote(db);
			const result = distillNoteTool.handler(
				{ root: '/unused', db },
				{ note_id: noteId, spell_path: 'general/writing' },
			);
			assert.ok(!(result instanceof Promise));
			assert.ok(result.ok);
			const inspectNext = result.next?.find((h) => h.tool === 'inspect_grimoire_item');
			const reviewNext = result.next?.find((h) => h.tool === 'review_grimoire');
			assert.ok(inspectNext, 'should suggest inspect_grimoire_item');
			assert.ok(reviewNext, 'should suggest review_grimoire');
		} finally {
			db.close();
		}
	});
});
