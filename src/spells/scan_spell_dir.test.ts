import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { scanSpellDir } from './scan_spell_dir.ts';

describe('scanSpellDir', () => {
	it('finds files in scripts/, references/, assets/', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'my-spell' }] }],
		});
		try {
			const spellDir = join(root, 'general', 'my-spell');
			mkdirSync(join(spellDir, 'scripts'), { recursive: true });
			mkdirSync(join(spellDir, 'references'), { recursive: true });
			mkdirSync(join(spellDir, 'assets'), { recursive: true });
			writeFileSync(join(spellDir, 'scripts', 'run.sh'), '#!/bin/bash');
			writeFileSync(join(spellDir, 'references', 'doc.md'), '# Doc');
			writeFileSync(join(spellDir, 'assets', 'logo.png'), 'binary');

			const files = scanSpellDir(spellDir);
			assert.equal(files.scripts.length, 1);
			assert.equal(files.references.length, 1);
			assert.equal(files.assets.length, 1);
			assert.ok(files.scripts[0]?.endsWith('run.sh'));
			assert.ok(files.references[0]?.endsWith('doc.md'));
			assert.ok(files.assets[0]?.endsWith('logo.png'));
		} finally {
			cleanup();
		}
	});

	it('returns empty arrays when no subdirs exist', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'bare' }] }],
		});
		try {
			const files = scanSpellDir(join(root, 'general', 'bare'));
			assert.deepEqual(files, { scripts: [], references: [], assets: [] });
		} finally {
			cleanup();
		}
	});
});
