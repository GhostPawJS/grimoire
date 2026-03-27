import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
	GitContext,
	HistoryEntry,
	PendingChange,
	PendingChangesResult,
	RollbackResult,
	SealResult,
	Tier,
	TierInfo,
} from './types.ts';

describe('git types', () => {
	it('Tier accepts all valid values', () => {
		const tiers: Tier[] = ['Uncheckpointed', 'Apprentice', 'Journeyman', 'Expert', 'Master'];
		assert.equal(tiers.length, 5);
	});

	it('GitContext is structurally valid', () => {
		const ctx: GitContext = { root: '/tmp' };
		assert.equal(ctx.root, '/tmp');
	});

	it('TierInfo is structurally valid', () => {
		const info: TierInfo = { tier: 'Apprentice', rank: 1, sealsToNextTier: 2 };
		assert.equal(info.tier, 'Apprentice');
	});

	it('SealResult is structurally valid', () => {
		const result: SealResult = { commitHash: 'abc', sealedPaths: ['a/b'], ranks: { 'a/b': 1 } };
		assert.equal(result.commitHash, 'abc');
	});

	it('RollbackResult is structurally valid', () => {
		const result: RollbackResult = { success: true, restoredRef: 'abc' };
		assert.equal(result.success, true);
	});

	it('PendingChange is structurally valid', () => {
		const change: PendingChange = { status: 'created', filePath: 'a/b/c' };
		assert.equal(change.status, 'created');
	});

	it('PendingChangesResult is structurally valid', () => {
		const result: PendingChangesResult = {
			spellPath: 'ch/sp',
			changes: [{ status: 'modified', filePath: 'ch/sp/SKILL.md' }],
		};
		assert.equal(result.changes.length, 1);
	});

	it('HistoryEntry is structurally valid', () => {
		const entry: HistoryEntry = {
			hash: 'abc123',
			message: 'seal',
			date: '2025-01-01T00:00:00Z',
			files: ['ch/sp/SKILL.md'],
		};
		assert.equal(entry.files.length, 1);
	});
});
