import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { GrimoireConflictError } from '../errors.ts';
import { unshelve } from './unshelve.ts';

test('unshelve preserves an occupied destination until force is supplied', () => {
	const root = mkdtempSync(join(tmpdir(), 'grimoire-unshelve-'));
	try {
		for (const path of ['general/sample', '.shelved/general/sample'])
			mkdirSync(join(root, path), { recursive: true });
		writeFileSync(join(root, 'general/sample/SKILL.md'), 'current');
		writeFileSync(join(root, '.shelved/general/sample/SKILL.md'), 'shelved');
		assert.throws(() => unshelve(root, 'general/sample'), GrimoireConflictError);
		assert.equal(readFileSync(join(root, 'general/sample/SKILL.md'), 'utf8'), 'current');
		assert.equal(readFileSync(join(root, '.shelved/general/sample/SKILL.md'), 'utf8'), 'shelved');
		unshelve(root, 'general/sample', undefined, { force: true });
		assert.equal(readFileSync(join(root, 'general/sample/SKILL.md'), 'utf8'), 'shelved');
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
