import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as git from './index.ts';

describe('git/index barrel', () => {
	it('exports allRanks', () => {
		assert.equal(typeof git.allRanks, 'function');
	});

	it('exports diff', () => {
		assert.equal(typeof git.diff, 'function');
	});

	it('exports history', () => {
		assert.equal(typeof git.history, 'function');
	});

	it('exports isGitAvailable', () => {
		assert.equal(typeof git.isGitAvailable, 'function');
	});

	it('exports pendingChanges', () => {
		assert.equal(typeof git.pendingChanges, 'function');
	});

	it('exports rank', () => {
		assert.equal(typeof git.rank, 'function');
	});

	it('exports rollback', () => {
		assert.equal(typeof git.rollback, 'function');
	});

	it('exports seal', () => {
		assert.equal(typeof git.seal, 'function');
	});

	it('exports tier', () => {
		assert.equal(typeof git.tier, 'function');
	});

	it('exports tierInfo', () => {
		assert.equal(typeof git.tierInfo, 'function');
	});
});
