import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { createTestGitRoot } from '../lib/test-git.ts';
import { seal } from './seal.ts';

describe('seal', () => {
	it('auto-detects and seals all changed spells', () => {
		const { root, gitDir, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'alpha' }, { name: 'beta' }] }],
		});
		try {
			const result = seal({ root, gitDir });
			assert.ok(result.commitHash.length > 0);
			assert.ok(result.sealedPaths.includes('ch/alpha'));
			assert.ok(result.sealedPaths.includes('ch/beta'));
			assert.ok((result.ranks['ch/alpha'] ?? 0) >= 1);
		} finally {
			cleanup();
		}
	});

	it('seals only specified paths when paths provided', () => {
		const { root, gitDir, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'alpha' }, { name: 'beta' }] }],
		});
		try {
			const result = seal({ root, gitDir }, undefined, ['ch/alpha'], 'seal alpha');
			assert.ok(result.commitHash.length > 0);
			assert.deepEqual(result.sealedPaths, ['ch/alpha']);
		} finally {
			cleanup();
		}
	});

	it('logs seal events when db is provided', () => {
		const db = createTestDb();
		const { root, gitDir, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal({ root, gitDir }, db);
			const rows = db
				.prepare("SELECT spell, event FROM spell_events WHERE event = 'seal'")
				.all<{ spell: string; event: string }>();
			assert.ok(rows.length >= 1);
			assert.equal(rows[0]?.event, 'seal');
		} finally {
			cleanup();
			db.close();
		}
	});

	it('returns empty result when no changes exist', () => {
		const {
			root,
			gitDir,
			seal: testSeal,
			cleanup,
		} = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			testSeal();
			const result = seal({ root, gitDir });
			assert.equal(result.commitHash, '');
			assert.deepEqual(result.sealedPaths, []);
		} finally {
			cleanup();
		}
	});

	it('increments rank on repeated seals', () => {
		const { root, gitDir, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal({ root, gitDir });
			writeFileSync(join(root, 'ch', 'sp', 'SKILL.md'), 'updated content');
			const result = seal({ root, gitDir });
			assert.ok((result.ranks['ch/sp'] ?? 0) >= 2);
		} finally {
			cleanup();
		}
	});
});
