import assert from 'node:assert/strict';
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { execGit } from '../lib/exec_git.ts';
import { createTestGitRoot } from '../lib/test-git.ts';
import { deleteSpell } from '../spells/delete_spell.ts';
import { moveSpell } from '../spells/move_spell.ts';
import { repair } from '../spells/repair.ts';
import { repairAll } from '../spells/repair_all.ts';
import { allRanks } from './all_ranks.ts';
import { history } from './history.ts';
import { rank } from './rank.ts';
import { rollback } from './rollback.ts';
import { seal } from './seal.ts';

const layout = { chapters: [{ name: 'general', spells: [{ name: 'alpha' }, { name: 'beta' }] }] };

test('hone refuses symlinks before staging any path and later scoped hones work', () => {
	const fixture = createTestGitRoot(layout);
	const { root, gitDir, cleanup } = fixture;
	const ctx = { root, gitDir };
	try {
		fixture.seal();
		const tracked = execGit(ctx, ['ls-files', '-s']);
		mkdirSync(join(root, 'general', 'linked'));
		symlinkSync('../alpha/SKILL.md', join(root, 'general', 'linked', 'SKILL.md'));
		writeFileSync(join(root, 'general', 'beta', 'SKILL.md'), 'changed');
		assert.throws(() => seal(ctx), /symbolic link/);
		assert.equal(execGit(ctx, ['ls-files', '-s']), tracked);
		assert.equal(execGit(ctx, ['diff', '--cached']), '');
		assert.deepEqual(seal(ctx, undefined, ['general/beta']).sealedPaths, ['general/beta']);
		rmSync(join(root, 'general', 'linked'), { recursive: true });
		symlinkSync('alpha', join(root, 'general', 'linked'));
		assert.throws(() => seal(ctx), /symbolic link/);
		assert.equal(execGit(ctx, ['diff', '--cached']), '');
	} finally {
		cleanup();
	}
});

for (const operation of ['hone', 'delete', 'repair', 'repair-all', 'hone-all']) {
	test(`hand-deleted tracked spells permit scoped hone and ${operation}`, () => {
		const fixture = createTestGitRoot(layout);
		const { root, gitDir, cleanup } = fixture;
		const ctx = { root, gitDir };
		try {
			fixture.seal();
			rmSync(join(root, 'general', 'alpha'), { recursive: true });
			writeFileSync(join(root, 'general', 'beta', 'SKILL.md'), 'changed');
			seal(ctx, undefined, ['general/beta']);
			assert.match(execGit(ctx, ['ls-files']), /general\/alpha\/SKILL.md/);
			if (operation === 'hone') seal(ctx, undefined, ['general/alpha']);
			if (operation === 'hone-all') seal(ctx);
			if (operation === 'delete') deleteSpell(root, 'general/alpha', undefined, { gitDir });
			if (operation === 'repair')
				assert.equal(repair(root, 'general/alpha', { gitDir }).fixes[0]?.code, 'tracked-missing');
			if (operation === 'repair-all')
				assert.ok(
					repairAll(root, { gitDir }).some((item) =>
						item.fixes.some((fix) => fix.code === 'tracked-missing'),
					),
				);
			assert.doesNotMatch(execGit(ctx, ['ls-files']), /general\/alpha/);
			assert.equal(execGit(ctx, ['status', '--porcelain', '--', 'general']), '');
		} finally {
			cleanup();
		}
	});
}

test('move retains rank and history, refuses existing targets, and rollback does not advance rank', () => {
	const fixture = createTestGitRoot(layout);
	const { root, gitDir, cleanup } = fixture;
	const ctx = { root, gitDir };
	try {
		const first = fixture.seal();
		writeFileSync(join(root, 'general', 'alpha', 'SKILL.md'), 'updated');
		seal(ctx, undefined, ['general/alpha']);
		assert.throws(
			() => moveSpell(root, 'general/alpha', 'general/beta', undefined, { gitDir }),
			/already exists/,
		);
		const before = rank(ctx, 'general/alpha');
		assert.equal(rollback(ctx, 'general/alpha', first).success, true);
		assert.equal(rank(ctx, 'general/alpha'), before);
		moveSpell(root, 'general/alpha', 'general/renamed', undefined, { gitDir });
		assert.equal(rank(ctx, 'general/renamed'), before);
		assert.equal(allRanks(ctx)['general/renamed'], before);
		assert.ok(history(ctx, 'general/renamed').some((entry) => entry.hash === first));
	} finally {
		cleanup();
	}
});

test('unsafe parent legacy history is ignored and new-root writes use local history', async () => {
	const fixture = createTestGitRoot(layout);
	const { root: parent, cleanup } = fixture;
	const { init } = await import('../init.ts');
	const { inscribe } = await import('../spells/inscribe.ts');
	const { adoptSpells } = await import('../scouting/adopt_spells.ts');
	const { resolveGitDir } = await import('../lib/resolve_git_dir.ts');
	const root = join(parent, 'new-root');
	try {
		fixture.seal();
		const previous = execGit({ root: parent }, ['rev-parse', 'HEAD']);
		init(root);
		assert.equal(resolveGitDir(root), join(root, '.grimoire-git'));
		inscribe(root, undefined, {
			name: 'local',
			content: '---\nname: local\ndescription: Local procedure\n---\nBody\n',
		});
		const sources = ['one', 'two', 'three'].map((name) => {
			const source = join(root, `.source-${name}`);
			mkdirSync(source);
			writeFileSync(
				join(source, 'SKILL.md'),
				`---\nname: ${name}\ndescription: Imported procedure\n---\nBody\n`,
			);
			return source;
		});
		const adopted = adoptSpells(root, undefined, sources);
		assert.equal(adopted.adopted.length, 3);
		assert.deepEqual(adopted.errors, []);
		writeFileSync(join(root, 'general', 'local', 'SKILL.md'), 'changed');
		assert.deepEqual(seal({ root }).sealedPaths, ['general/local']);
		assert.equal(execGit({ root: parent }, ['rev-parse', 'HEAD']), previous);
		assert.equal(execGit({ root }, ['ls-files']).split('\n').length, 4);
	} finally {
		cleanup();
	}
});

test('foreign scope is rejected before inscribe or batch adoption writes files', async () => {
	const fixture = createTestGitRoot(layout);
	const { root, gitDir, cleanup } = fixture;
	const { inscribe } = await import('../spells/inscribe.ts');
	const { adoptSpells } = await import('../scouting/adopt_spells.ts');
	const { existsSync } = await import('node:fs');
	try {
		writeFileSync(join(root, 'foreign.txt'), 'foreign');
		fixture.seal();
		assert.throws(
			() =>
				inscribe(root, undefined, {
					name: 'fresh',
					content: '---\nname: fresh\ndescription: Fresh procedure\n---\nBody\n',
				}),
			/unrelated path/,
		);
		assert.equal(existsSync(join(root, 'general', 'fresh')), false);
		const result = adoptSpells(root, undefined, ['first', 'second', 'third'], { gitDir });
		assert.equal(result.errors.length, 1);
		assert.equal(result.adopted.length, 0);
	} finally {
		cleanup();
	}
});

test('forced inscribe checkpoints identical files that have not been committed', async () => {
	const { root, gitDir, cleanup } = createTestGitRoot();
	const { inscribe } = await import('../spells/inscribe.ts');
	try {
		const content = '---\nname: pending\ndescription: Pending procedure\n---\nBody\n';
		mkdirSync(join(root, 'general', 'pending'), { recursive: true });
		writeFileSync(join(root, 'general', 'pending', 'SKILL.md'), content);
		const result = inscribe(root, undefined, { name: 'pending', content, force: true, gitDir });
		assert.equal(result.noOp, undefined);
		assert.equal(result.spell.rank, 1);
		assert.equal(
			execGit({ root, gitDir }, ['show', 'HEAD:general/pending/SKILL.md']),
			content.trim(),
		);
	} finally {
		cleanup();
	}
});
