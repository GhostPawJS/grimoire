import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cloneRepo } from './clone_repo.ts';

describe('cloneRepo', () => {
	it('is a function', () => {
		assert.equal(typeof cloneRepo, 'function');
	});

	it('rejects on invalid URL', async () => {
		await assert.rejects(
			() => cloneRepo('https://invalid.test/no-such-repo.git', '/tmp/grimoire-clone-test'),
			(err: unknown) => {
				assert.ok(err instanceof Error);
				return true;
			},
		);
	});
});
