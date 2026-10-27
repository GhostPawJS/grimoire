import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { allRanks } from '../git/all_ranks.ts';
import { history } from '../git/history.ts';
import { execGit } from '../lib/exec_git.ts';
import { discoverSpells } from '../spells/discover_spells.ts';
import { openGrimoireContext } from './open_grimoire_context.ts';

test('twelve parallel spell writers and twelve note writers each finish without sweeping commits', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-parallel-'));
	const root = join(dir, 'root');
	const dbPath = join(dir, 'grimoire.db');
	const run = (args: string[]) =>
		new Promise<{ code: number | null; out: string; err: string }>((resolve, reject) => {
			const child = spawn(
				process.execPath,
				[
					'--no-warnings',
					'--experimental-strip-types',
					fileURLToPath(new URL('../cli.ts', import.meta.url)),
					...args,
					'--root',
					root,
					'--db',
					dbPath,
					'--json',
				],
				{ stdio: ['ignore', 'pipe', 'pipe'] },
			);
			let out = '',
				err = '';
			child.stdout.on('data', (chunk) => {
				out += String(chunk);
			});
			child.stderr.on('data', (chunk) => {
				err += String(chunk);
			});
			child.on('error', reject);
			child.on('close', (code) => resolve({ code, out, err }));
		});
	try {
		const work: string[][] = [];
		for (let i = 0; i < 12; i++) {
			work.push([
				'spell',
				'inscribe',
				`proc-${i}`,
				'--content',
				`---\nname: proc-${i}\ndescription: Parallel procedure ${i}\n---\nBody ${i}\n`,
			]);
			work.push(['note', 'drop', `Parallel evidence ${i}`, '--source', 'practice']);
		}
		const results = await Promise.all(work.map(run));
		for (const result of results) {
			assert.equal(result.code, 0, `${result.out}\n${result.err}`);
			assert.equal(JSON.parse(result.out).ok, true);
		}
		const ctx = await openGrimoireContext({ root, dbPath });
		try {
			assert.equal(discoverSpells(root).length, 12);
			assert.equal(
				ctx.db.prepare('SELECT COUNT(*) AS count FROM spell_notes').get<{ count: number }>()?.count,
				12,
			);
			const ranks = allRanks(ctx);
			for (let i = 0; i < 12; i++) {
				const path = `general/proc-${i}`;
				assert.equal(ranks[path], 1);
				const entries = history(ctx, path);
				assert.equal(entries.length, 1);
				assert.equal(
					execGit(ctx, ['show', '--format=', '--name-only', entries[0]?.hash ?? '']),
					`${path}/SKILL.md`,
				);
			}
		} finally {
			ctx.db.close();
		}
		const changed = await run([
			'spell',
			'update',
			'general/proc-0',
			'--content',
			'---\nname: proc-0\ndescription: Improved procedure\n---\nUpdated body\n',
		]);
		assert.equal(changed.code, 0, changed.err);
		assert.equal((await run(['spell', 'hone', 'general/proc-0'])).code, 0);
		const inspected = await run(['inspect', 'general/proc-0']);
		assert.equal(inspected.code, 0, inspected.err);
		assert.equal(JSON.parse(inspected.out).data.history.length, 2);
		const noChange = await run(['spell', 'hone', 'general/proc-0']);
		assert.equal(noChange.code, 0, noChange.err);
		assert.equal(JSON.parse(noChange.out).outcome, 'no_op');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
