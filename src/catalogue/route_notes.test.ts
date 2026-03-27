import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { routeNotes } from './route_notes.ts';

function insertNote(
	db: ReturnType<typeof createTestDb>,
	content: string,
	domain: string | null = null,
): void {
	db.prepare(
		'INSERT INTO spell_notes (source, content, domain, status, created_at) VALUES (?, ?, ?, ?, ?)',
	).run('test', content, domain, 'pending', Date.now());
}

describe('routeNotes', () => {
	it('routes matching notes to best spell', () => {
		const db = createTestDb();
		insertNote(db, 'typescript generics and type inference patterns');
		insertNote(db, 'react hooks and state management');

		const descriptions = new Map([
			['lang/typescript', 'typescript generics type inference advanced patterns'],
			['ui/react', 'react hooks state management component lifecycle'],
		]);

		const routed = routeNotes(db, descriptions, 0.2);
		assert.equal(routed, 2);

		const rows = db
			.prepare("SELECT domain FROM spell_notes WHERE status = 'pending' ORDER BY id")
			.all<{ domain: string | null }>();
		assert.equal(rows[0]?.domain, 'lang/typescript');
		assert.equal(rows[1]?.domain, 'ui/react');
		db.close();
	});

	it('leaves unmatched notes alone', () => {
		const db = createTestDb();
		insertNote(db, 'completely unrelated content about cooking recipes');

		const descriptions = new Map([
			['lang/rust', 'rust ownership borrowing lifetimes memory safety'],
		]);

		const routed = routeNotes(db, descriptions, 0.5);
		assert.equal(routed, 0);

		const row = db
			.prepare("SELECT domain FROM spell_notes WHERE status = 'pending'")
			.get<{ domain: string | null }>();
		assert.equal(row?.domain, null);
		db.close();
	});

	it('skips notes that already have a domain', () => {
		const db = createTestDb();
		insertNote(db, 'typescript generics', 'existing/spell');

		const descriptions = new Map([['lang/typescript', 'typescript generics type inference']]);

		const routed = routeNotes(db, descriptions);
		assert.equal(routed, 0);
		db.close();
	});

	it('returns 0 when no pending notes', () => {
		const db = createTestDb();
		const descriptions = new Map([['lang/ts', 'typescript']]);
		const routed = routeNotes(db, descriptions);
		assert.equal(routed, 0);
		db.close();
	});
});
