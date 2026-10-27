import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { withGitLock } from './with_git_lock.ts';

test('lock is exclusive, reentrant, and removed after success or failure', () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-lock-'));
	const path = join(dir, 'grimoire.lock');
	try {
		assert.equal(
			withGitLock(dir, () => {
				assert.equal(JSON.parse(readFileSync(path, 'utf8')).pid, process.pid);
				return withGitLock(dir, () => 42);
			}),
			42,
		);
		assert.equal(existsSync(path), false);
		assert.throws(
			() =>
				withGitLock(dir, () => {
					throw new Error('write failed');
				}),
			/write failed/,
		);
		assert.equal(existsSync(path), false);
		for (const lock of [
			{ pid: process.pid, timestamp: Date.now() - 61_000 },
			{ pid: 2147483647, timestamp: Date.now() },
		]) {
			writeFileSync(path, JSON.stringify(lock));
			assert.equal(
				withGitLock(dir, () => 'recovered'),
				'recovered',
			);
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
