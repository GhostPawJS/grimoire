import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { scoutSkillsTool } from '../tools/scout_skills_tool.ts';
import { checkUpdates } from './check_updates.ts';

describe('upstream checks with injected fetch', () => {
	it('checks GitHub paths and hub commits and supplies tool follow-up hints', async (t) => {
		const db = createTestDb();
		const { root, cleanup } = createTestRoot();
		const urls: string[] = [];
		t.mock.method(
			globalThis,
			'fetch',
			async (input: string | URL | Request, init?: RequestInit) => {
				const url = String(input);
				urls.push(url);
				if (url.includes('api.github.com')) return Response.json([{ sha: 'new-github' }]);
				assert.equal(init?.method, 'POST');
				assert.deepEqual(JSON.parse(String(init?.body)), { commits: ['old-hub'] });
				return Response.json({ 'old-hub': 'new-hub' });
			},
		);
		try {
			const insert = db.prepare(
				'INSERT INTO spell_provenance (spell_path, source_type, source_repo, source_path, source_commit, imported_at) VALUES (?, ?, ?, ?, ?, ?)',
			);
			insert.run('general/github', 'github', 'owner/repo', 'skills/a b', null, '2026-01-01');
			insert.run('general/repo', 'github', 'owner/repo', null, null, '2026-01-01');
			insert.run('general/hub', 'agentskillhub', null, null, 'old-hub', '2026-01-01');
			insert.run('general/missing-repo', 'github', null, null, null, '2026-01-01');
			insert.run('general/missing-commit', 'agentskillhub', null, null, null, '2026-01-01');
			const checks = await checkUpdates(root, db);
			assert.equal(
				checks.find((c) => c.spellPath === 'general/github')?.latestCommit,
				'new-github',
			);
			assert.equal(checks.find((c) => c.spellPath === 'general/hub')?.latestCommit, 'new-hub');
			assert.ok(urls.some((url) => url.endsWith('?path=skills%2Fa%20b&per_page=1')));
			assert.ok(urls.some((url) => url.endsWith('?per_page=1')));
			assert.equal(urls.length, 3);
			const result = await scoutSkillsTool.handler({ root, db }, { action: 'check_updates' });
			assert.equal(result.ok, true);
			assert.equal(result.entities.length, 5);
			assert.equal(result.next?.length, 5);
			assert.ok(result.next?.every((hint) => hint.suggestedInput?.action === 'apply_update'));

			for (const mode of ['http', 'offline', 'empty']) {
				t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
					if (mode === 'offline') throw new Error('offline');
					if (mode === 'http') return new Response(null, { status: 503 });
					return Response.json(String(input).includes('api.github.com') ? [] : {});
				});
				const unavailable = await checkUpdates(root, db);
				assert.equal(unavailable.length, 5);
				assert.ok(unavailable.every((check) => check.latestCommit === undefined));
			}
		} finally {
			cleanup();
			db.close();
		}
	});
});
