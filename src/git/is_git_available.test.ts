import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isGitAvailable } from './is_git_available.ts';

describe('isGitAvailable', () => {
	it('returns true when git is installed', () => {
		assert.equal(isGitAvailable(), true);
	});

	it('returns same cached value on second call', () => {
		const first = isGitAvailable();
		const second = isGitAvailable();
		assert.equal(first, second);
	});
});
