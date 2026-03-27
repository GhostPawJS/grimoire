import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { downloadTarball } from './download_tarball.ts';

describe('downloadTarball', () => {
	it('is a function', () => {
		assert.equal(typeof downloadTarball, 'function');
	});

	it('rejects on network error', async () => {
		await assert.rejects(
			() => downloadTarball('http://127.0.0.1:1/__invalid__/test.tar.gz', '/tmp/grimoire-dl-test'),
			(err: unknown) => {
				assert.ok(err instanceof Error);
				return true;
			},
		);
	});
});
