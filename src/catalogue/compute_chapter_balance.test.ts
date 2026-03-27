import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeChapterBalance } from './compute_chapter_balance.ts';

describe('computeChapterBalance', () => {
	it('balanced chapters', () => {
		const spells = new Map([
			['basics', 5],
			['advanced', 5],
		]);
		const notes = new Map([
			['basics', 5],
			['advanced', 5],
		]);
		const result = computeChapterBalance(spells, notes);

		assert.equal(result.length, 2);
		assert.equal(result[0]?.chapter, 'advanced');
		assert.equal(result[0]?.noteLoadRatio, 1);
		assert.equal(result[1]?.chapter, 'basics');
		assert.equal(result[1]?.noteLoadRatio, 1);
	});

	it('unbalanced chapters', () => {
		const spells = new Map([
			['basics', 2],
			['advanced', 10],
		]);
		const notes = new Map([
			['basics', 8],
			['advanced', 2],
		]);
		const result = computeChapterBalance(spells, notes);

		assert.equal(result.length, 2);
		const basics = result.find((r) => r.chapter === 'basics');
		assert.ok(basics);
		assert.equal(basics.noteLoadRatio, 4);

		const advanced = result.find((r) => r.chapter === 'advanced');
		assert.ok(advanced);
		assert.equal(advanced.noteLoadRatio, 0.2);
	});

	it('chapter with notes but no spells gets 0 ratio', () => {
		const spells = new Map<string, number>();
		const notes = new Map([['orphaned', 5]]);
		const result = computeChapterBalance(spells, notes);

		assert.equal(result.length, 1);
		assert.equal(result[0]?.chapter, 'orphaned');
		assert.equal(result[0]?.spellCount, 0);
		assert.equal(result[0]?.noteLoadRatio, 0);
	});

	it('chapter with spells but no notes', () => {
		const spells = new Map([['clean', 10]]);
		const notes = new Map<string, number>();
		const result = computeChapterBalance(spells, notes);

		assert.equal(result.length, 1);
		assert.equal(result[0]?.pendingNotes, 0);
		assert.equal(result[0]?.noteLoadRatio, 0);
	});

	it('empty inputs', () => {
		const result = computeChapterBalance(new Map(), new Map());
		assert.equal(result.length, 0);
	});
});
