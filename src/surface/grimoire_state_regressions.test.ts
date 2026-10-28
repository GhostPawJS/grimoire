import assert from 'node:assert/strict';
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { catalogue } from '../catalogue/catalogue.ts';
import { logEvent } from '../events/log_event.ts';
import { resonance } from '../events/resonance.ts';
import { history } from '../git/history.ts';
import { init } from '../init.ts';
import { execGit, resolveGitDir } from '../lib/exec_git.ts';
import { createTestDb } from '../lib/test-db.ts';
import { adoptSpell } from '../scouting/adopt_spell.ts';
import { inscribe } from '../spells/inscribe.ts';
import { moveSpell } from '../spells/move_spell.ts';
import { shelve } from '../spells/shelve.ts';
import { unshelve } from '../spells/unshelve.ts';
import { updateSpell } from '../spells/update_spell.ts';
import { honeSpellTool } from '../tools/hone_spell_tool.ts';
import { inspectGrimoireItemTool } from '../tools/inspect_grimoire_item_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { openGrimoireContext } from './open_grimoire_context.ts';

const content = (name: string, body = 'Check SHA256SUMS.') =>
	`---\nname: ${name}\ndescription: Verify release\n---\n${body}\n`;

test('sibling roots retain separate history and inspect shows two real seals', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-siblings-'));
	const db = createTestDb();
	try {
		const a = await openGrimoireContext({ root: join(dir, 'a'), db });
		const b = await openGrimoireContext({ root: join(dir, 'b'), db });
		inscribe(a.root, db, { name: 'alpha', content: content('alpha') });
		inscribe(b.root, db, { name: 'beta', content: content('beta') });
		updateSpell(
			a.root,
			'general/alpha',
			content('alpha', 'Check the archive and retry on mismatch.'),
		);
		assert.ok((await honeSpellTool.handler(a, { paths: ['general/alpha'] })).ok);
		const result = await inspectGrimoireItemTool.handler(a, { path: 'general/alpha' });
		assert.ok(result.ok);
		assert.equal(result.data.history?.length, 2);
		assert.ok(
			result.data.history?.every(
				(entry) => entry.shortHash && entry.subject && Number.isFinite(Date.parse(entry.date)),
			),
		);
		assert.ok(!result.warnings?.some((warning) => warning.code === 'degraded_no_git'));
		assert.equal(history(b, 'general/beta').length, 1);
		assert.equal(execGit(b, ['show', 'HEAD:general/beta/SKILL.md']), content('beta').trim());
	} finally {
		db.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

test('legacy migration copies safe history and ignores shared history with one warning', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-migrate-'));
	try {
		const root = join(dir, 'root');
		const legacy = join(dir, '.grimoire-git');
		init(root, undefined, { gitDir: legacy });
		inscribe(root, undefined, { name: 'alpha', content: content('alpha'), gitDir: legacy });
		const oldHead = execGit({ root, gitDir: legacy }, ['rev-parse', 'HEAD']);
		const destination = resolveGitDir(root);
		assert.equal(destination, join(root, '.grimoire-git'));
		assert.ok(existsSync(join(legacy, 'HEAD')));
		assert.equal(readFileSync(join(legacy, 'MIGRATED_TO'), 'utf8').trim(), destination);
		assert.equal(execGit({ root, gitDir: destination }, ['rev-parse', 'HEAD']), oldHead);
		assert.equal(history({ root, gitDir: destination }, 'general/alpha').length, 1);
		assert.equal(
			resolveGitDir(root, legacy),
			destination,
			'a migrated legacy store redirects to its copy',
		);

		const sharedBase = join(dir, 'shared');
		const source = join(sharedBase, 'source');
		const shared = join(sharedBase, '.grimoire-git');
		init(source, undefined, { gitDir: shared });
		for (const name of ['alpha', 'beta'])
			inscribe(source, undefined, { name, content: content(name), gitDir: shared });
		writeFileSync(join(source, 'README.md'), 'Shared repository content');
		execGit({ root: source, gitDir: shared }, ['add', '--', 'README.md']);
		execGit({ root: source, gitDir: shared }, [
			'-c',
			'user.name=Test',
			'-c',
			'user.email=test@test.com',
			'commit',
			'-m',
			'shared content',
		]);
		const partial = join(sharedBase, 'partial');
		mkdirSync(join(partial, 'general'), { recursive: true });
		cpSync(join(source, 'general/alpha'), join(partial, 'general/alpha'), { recursive: true });
		assert.equal(resolveGitDir(partial), join(partial, '.grimoire-git'));
		assert.equal(existsSync(join(partial, '.grimoire-git')), false);
		assert.equal(existsSync(join(shared, 'MIGRATED_TO')), false);
		const inspected = await inspectGrimoireItemTool.handler(
			{ root: partial },
			{ path: 'general/alpha' },
		);
		assert.equal(inspected.warnings?.filter((w) => w.code === 'shared_git_dir').length, 1);
		const reviewed = await reviewGrimoireTool.handler({ root: partial }, { view: 'index' });
		assert.equal(reviewed.warnings?.filter((w) => w.code === 'shared_git_dir').length, 1);
		const sharedHead = execGit({ root: source, gitDir: shared }, ['rev-parse', 'HEAD']);
		const seal = await honeSpellTool.handler({ root: partial, gitDir: shared }, {});
		assert.equal(seal.ok, false);
		assert.equal(execGit({ root: source, gitDir: shared }, ['rev-parse', 'HEAD']), sharedHead);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('adopting fourteen files counts once and no-change hone distills notes while preserving rank and resonance', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-rank-'));
	const db = createTestDb();
	try {
		const source = join(dir, 'skill');
		mkdirSync(join(source, 'references'), { recursive: true });
		writeFileSync(join(source, 'SKILL.md'), content('reference'));
		for (let i = 0; i < 13; i++)
			writeFileSync(join(source, 'references', `${i}.md`), `Reference ${i}`);
		const ctx = await openGrimoireContext({ root: join(dir, 'root'), db });
		const adopted = adoptSpell(ctx.root, db, source);
		assert.equal(adopted.spell.rank, 1);
		assert.equal(adopted.spell.tier, 'Apprentice');
		const now = Date.now();
		logEvent(db, { spell: adopted.spell.path, event: 'read', now });
		const note = db
			.prepare(
				"INSERT INTO spell_notes (source, content, status, created_at) VALUES ('practice', 'Evidence', 'pending', ?)",
			)
			.run(now);
		const before = resonance(db, adopted.spell.path, { now });
		const honed = await honeSpellTool.handler(ctx, {
			paths: [adopted.spell.path],
			noteIds: [Number(note.lastInsertRowid)],
		});
		assert.equal(honed.outcome, 'no_op');
		assert.ok(honed.ok);
		assert.deepEqual(honed.data.distilledNoteIds, [Number(note.lastInsertRowid)]);
		assert.deepEqual(resonance(db, adopted.spell.path, { now }), before);
		assert.equal(
			db
				.prepare('SELECT status FROM spell_notes WHERE id = ?')
				.get<{ status: string }>(note.lastInsertRowid)?.status,
			'distilled',
		);
		assert.equal(history(ctx, adopted.spell.path).length, 1);
		assert.equal(catalogue(ctx.root, db, { now }).sealVelocity[adopted.spell.path], 1);
	} finally {
		db.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

test('lifecycle commits have a fallback identity and leave unrelated staged files untouched', () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-identity-'));
	const keys = [
		'HOME',
		'GIT_CONFIG_GLOBAL',
		'GIT_CONFIG_NOSYSTEM',
		'GIT_AUTHOR_NAME',
		'GIT_AUTHOR_EMAIL',
		'GIT_COMMITTER_NAME',
		'GIT_COMMITTER_EMAIL',
		'EMAIL',
	] as const;
	const saved = keys.map((key) => [key, process.env[key]] as const);
	try {
		for (const key of keys) delete process.env[key];
		process.env.HOME = dir;
		process.env.GIT_CONFIG_GLOBAL = '/dev/null';
		process.env.GIT_CONFIG_NOSYSTEM = '1';
		const root = join(dir, 'root');
		init(root);
		inscribe(root, undefined, { name: 'alpha', content: content('alpha') });
		for (const perform of [
			() => shelve(root, 'general/alpha'),
			() => unshelve(root, 'general/alpha'),
			() => moveSpell(root, 'general/alpha', 'ops/alpha'),
		]) {
			const before = execGit({ root }, ['rev-parse', 'HEAD']);
			perform();
			assert.notEqual(execGit({ root }, ['rev-parse', 'HEAD']), before);
			assert.equal(execGit({ root }, ['log', '-1', '--format=%ae']), 'grimoire@localhost');
		}
		mkdirSync(join(root, 'general/beta'), { recursive: true });
		writeFileSync(join(root, 'general/beta/SKILL.md'), content('beta'));
		execGit({ root }, ['add', '--', 'general/beta']);
		inscribe(root, undefined, { name: 'gamma', content: content('gamma') });
		assert.equal(
			execGit({ root }, ['show', '--format=', '--name-only', 'HEAD']),
			'general/gamma/SKILL.md',
		);
		assert.equal(execGit({ root }, ['diff', '--cached', '--name-only']), 'general/beta/SKILL.md');
	} finally {
		for (const [key, value] of saved) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
		rmSync(dir, { recursive: true, force: true });
	}
});
