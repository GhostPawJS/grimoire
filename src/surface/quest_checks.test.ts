import assert from 'node:assert/strict';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { catalogue } from '../catalogue/catalogue.ts';
import { logEvent } from '../events/log_event.ts';
import { createTestDb } from '../lib/test-db.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { parseCliArgs } from '../surfaces/cli_args.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { sharedGitWarning } from '../tools/shared_git_warning.ts';
import { grimoireCliOptions } from './grimoire_cli_options.ts';
import { openGrimoireContext } from './open_grimoire_context.ts';

async function cli(args: string[]) {
	let output = '',
		errors = '';
	const stream = (append: (text: string) => void) =>
		new Writable({
			write(chunk, _encoding, done) {
				append(String(chunk));
				done();
			},
		});
	const code = await runToolCli(args, {
		...grimoireCliOptions,
		stdout: stream((text) => {
			output += text;
		}),
		stderr: stream((text) => {
			errors += text;
		}),
	});
	return { code, output, errors };
}

test('explicit environment and flag Git directories suppress parent warnings, including root-local paths', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'quest62-'));
	const previous = process.env.GHOSTPAW_GRIMOIRE_GIT_DIR;
	try {
		mkdirSync(join(dir, '.grimoire-git'));
		const root = join(dir, 'root');
		mkdirSync(root);
		delete process.env.GHOSTPAW_GRIMOIRE_GIT_DIR;
		assert.equal(sharedGitWarning({ root }).length, 1);
		for (const mode of ['env', 'flag']) {
			const gitDir = join(root, '.grimoire-git');
			if (mode === 'env') process.env.GHOSTPAW_GRIMOIRE_GIT_DIR = gitDir;
			else delete process.env.GHOSTPAW_GRIMOIRE_GIT_DIR;
			const ctx = await openGrimoireContext({
				root,
				dbPath: ':memory:',
				...(mode === 'flag' ? { gitDir } : {}),
			});
			try {
				assert.deepEqual(sharedGitWarning(ctx), []);
			} finally {
				ctx.db.close();
			}
		}
	} finally {
		if (previous === undefined) delete process.env.GHOSTPAW_GRIMOIRE_GIT_DIR;
		else process.env.GHOSTPAW_GRIMOIRE_GIT_DIR = previous;
		rmSync(dir, { recursive: true, force: true });
	}
});

test('CLI replacement values accept dash-leading equals values and files', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'quest66-'));
	const root = join(dir, 'root'),
		db = join(dir, 'state.db');
	const base = ['--root', root, '--db', db];
	try {
		assert.equal(
			(
				await cli([
					...base,
					'spell',
					'inscribe',
					'sample',
					'--content=---\nname: sample\ndescription: Example\n---\n--soul <A>:owner\n',
				])
			).code,
			0,
		);
		const result = await cli([
			...base,
			'spell',
			'update',
			'general/sample',
			'--replace=--soul <A>:owner',
			'--with=--help',
		]);
		assert.equal(result.code, 0, result.errors);
		writeFileSync(join(dir, 'old'), '--help');
		writeFileSync(join(dir, 'new'), '--json');
		const files = await cli([
			...base,
			'spell',
			'update',
			'general/sample',
			'--replace',
			`@${join(dir, 'old')}`,
			'--with',
			`@${join(dir, 'new')}`,
		]);
		assert.equal(files.code, 0, files.errors);
		assert.match(readFileSync(join(root, 'general/sample/SKILL.md'), 'utf8'), /--json/);
		const positional = await cli([...base, 'note', 'drop', '--source=practice', '--', '--help']);
		assert.equal(positional.code, 0, positional.errors);
		assert.match((await cli([...base, 'review', 'notes'])).output, /--help/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('all parser value types support equals and separator preserves positional flags', () => {
	assert.deepEqual(
		parseCliArgs(
			[
				'--text=--soul <A>:owner',
				'--count=-2',
				'--tags=--help',
				'--config={"x":"--"}',
				'--',
				'--json',
			],
			{
				command: 'example',
				flags: [
					{ name: 'text', type: 'string' },
					{ name: 'count', type: 'integer' },
					{ name: 'tags', type: 'array' },
					{ name: 'config', type: 'json' },
				],
				positionals: [{ name: 'literal', type: 'string' }],
			},
		),
		{
			text: '--soul <A>:owner',
			count: -2,
			tags: ['--help'],
			config: { x: '--' },
			literal: '--json',
		},
	);
});

test('facade check combines saved catalogue and resonance using only SELECT queries', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'quest46-tool-'));
	const db = createTestDb();
	try {
		const empty = await reviewGrimoireTool.handler({ root: dir, db }, { view: 'check' });
		assert.ok(empty.ok);
		assert.equal(empty.data.snapshot, null);
		const snapshot = catalogue(dir, db);
		logEvent(db, { spell: 'general/example', event: 'read' });
		const before = db.prepare('SELECT total_changes() AS n').get();
		const readOnly = {
			...db,
			close: () => {},
			exec: () => {
				throw new Error('write');
			},
			prepare: (sql: string) => {
				assert.match(sql, /^SELECT /);
				return db.prepare(sql);
			},
		};
		const result = await reviewGrimoireTool.handler({ root: dir, db: readOnly }, { view: 'check' });
		assert.ok(result.ok);
		assert.deepEqual(result.data.snapshot, snapshot);
		assert.equal(result.data.totalSpells, 1);
		assert.deepEqual(db.prepare('SELECT total_changes() AS n').get(), before);
		assert.equal((await reviewGrimoireTool.handler({ root: dir }, { view: 'check' })).ok, false);
	} finally {
		db.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

test('CLI check opens existing state read-only and never initializes missing roots or databases', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'quest46-cli-'));
	const dbPath = join(dir, 'state.db'),
		root = join(dir, 'missing-root');
	try {
		const ctx = await openGrimoireContext({ dbPath, root: join(dir, 'setup') });
		ctx.db.exec('PRAGMA journal_mode=DELETE');
		ctx.db.close();
		const before = readFileSync(dbPath);
		const names = readdirSync(dir);
		for (const command of [
			['check'],
			['review', 'check'],
			['call', 'review_grimoire', '{"view":"check"}'],
		]) {
			const result = await cli([...command, `--root=${root}`, `--db=${dbPath}`]);
			assert.equal(result.code, 0, result.errors);
			assert.equal(JSON.parse(result.output).data.snapshot, null);
		}
		assert.deepEqual(readFileSync(dbPath), before);
		assert.deepEqual(readdirSync(dir), names);
		assert.equal(existsSync(root), false);
		assert.notEqual(
			(await cli(['check', '--root', root, '--db', join(dir, 'missing/state.db')])).code,
			0,
		);
		assert.equal(existsSync(join(dir, 'missing')), false);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('check leaves an unmigrated database unchanged on failure', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'quest46-schema-'));
	try {
		const { DatabaseSync } = await import('node:sqlite');
		const path = join(dir, 'old.db');
		const db = new DatabaseSync(path);
		db.exec('CREATE TABLE sentinel (value TEXT); PRAGMA user_version=1');
		db.close();
		const before = readFileSync(path);
		const result = await cli(['check', '--db', path, '--root', join(dir, 'root')]);
		assert.notEqual(result.code, 0);
		assert.deepEqual(readFileSync(path), before);
		assert.deepEqual(readdirSync(dir), ['old.db']);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
