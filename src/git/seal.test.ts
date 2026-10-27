import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
	it('seals without a configured git identity and keeps a configured one', () => {
		const { root, gitDir, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'alpha' }] }],
		});
		const keys = [
			'GIT_CONFIG_GLOBAL',
			'GIT_CONFIG_NOSYSTEM',
			'GIT_AUTHOR_NAME',
			'GIT_AUTHOR_EMAIL',
			'GIT_COMMITTER_NAME',
			'GIT_COMMITTER_EMAIL',
			'EMAIL',
		] as const;
		const saved = keys.map((key) => [key, process.env[key]] as const);
		const author = () =>
			execFileSync('git', [`--git-dir=${gitDir}`, 'log', '-1', '--format=%an'], {
				encoding: 'utf-8',
			}).trim();
		try {
			assert.ok(seal({ root, gitDir }, undefined, ['ch/alpha'], 'configured').commitHash);
			assert.equal(author(), 'Test');
			for (const key of keys) delete process.env[key];
			process.env.GIT_CONFIG_GLOBAL = '/dev/null';
			process.env.GIT_CONFIG_NOSYSTEM = '1';
			execFileSync('git', ['config', '-f', `${gitDir}/config`, '--unset', 'user.name']);
			execFileSync('git', ['config', '-f', `${gitDir}/config`, '--unset', 'user.email']);
			writeFileSync(
				join(root, 'ch', 'alpha', 'SKILL.md'),
				'---\nname: alpha\ndescription: changed\n---\n\n# alpha\n',
			);
			const result = seal({ root, gitDir }, undefined, ['ch/alpha'], 'anonymous');
			assert.ok(result.commitHash.length > 0);
			assert.equal(author(), 'grimoire');
			assert.ok((result.ranks['ch/alpha'] ?? 0) >= 2);
		} finally {
			for (const [key, value] of saved) {
				if (value === undefined) delete process.env[key];
				else process.env[key] = value;
			}
			cleanup();
		}
	});
});
