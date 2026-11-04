import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { inscribe } from '../spells/inscribe.ts';
import { updateSpell } from '../spells/update_spell.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { honeSpellTool } from '../tools/hone_spell_tool.ts';
import { updateSpellTool } from '../tools/update_spell_tool.ts';
import { grimoireCliOptions } from './grimoire_cli_options.ts';

const content =
	'---\nname: sample\ndescription: Sample procedure\n---\n\n# Sample\n\nFirst rule.\n';

test('ordered tool edits validate every match and section before writing', async () => {
	const { root, cleanup } = createTestRoot({
		chapters: [{ name: 'cantrips', spells: [{ name: 'sample', content }] }],
	});
	const gitDir = join(root, '.grimoire-git');
	const ctx = { root, gitDir };
	const file = join(root, 'cantrips/sample/SKILL.md');
	try {
		const path = 'cantrips/sample';
		for (const replace of [
			[{ old: 'missing', with: 'x' }],
			[
				{ old: 'rule', with: 'Sample' },
				{ old: 'Sample', with: 'x' },
			],
		]) {
			const result = await updateSpellTool.handler(ctx, { path, replace });
			assert.equal(result.ok, false);
			assert.equal(readFileSync(file, 'utf8'), content);
		}
		const result = await updateSpellTool.handler(ctx, {
			path,
			replace: [
				{ old: 'First', with: 'Next' },
				{ old: 'Next', with: 'Final' },
			],
			appendSection: { heading: 'Notes', body: 'Remember.' },
		});
		assert.equal(result.ok, true);
		assert.match(readFileSync(file, 'utf8'), /Final rule\.\n\n## Notes\n\nRemember\./);
		const before = readFileSync(file, 'utf8');
		assert.equal(
			(
				await updateSpellTool.handler(ctx, {
					path,
					replace: [{ old: 'Final', with: 'Changed' }],
					appendSection: { heading: 'Notes', body: 'Again' },
				})
			).ok,
			false,
		);
		assert.equal(
			(
				await updateSpellTool.handler(ctx, {
					path,
					content,
					replace: [{ old: 'First', with: 'x' }],
				})
			).ok,
			false,
		);
		assert.equal((await updateSpellTool.handler(ctx, { path })).ok, false);
		assert.equal(readFileSync(file, 'utf8'), before);
	} finally {
		cleanup();
	}
});

test('hone detects direct edits after inscribe and update, including without a database', async () => {
	const { root, gitDir, cleanup } = createTestGitRoot();
	const ctx = { root, gitDir };
	const path = 'cantrips/sample';
	const file = join(root, path, 'SKILL.md');
	try {
		inscribe(root, undefined, { name: 'sample', chapter: 'cantrips', content, gitDir });
		writeFileSync(file, content.replace('First', 'Direct'));
		const direct = await honeSpellTool.handler(ctx, { paths: [path] });
		assert.equal(direct.ok, true);
		assert.ok(
			direct.warnings?.some((warning) =>
				warning.message.includes('direct edit detected, not via update'),
			),
		);
		updateSpell(root, path, content.replace('First', 'Updated'), { gitDir });
		const updated = await honeSpellTool.handler(ctx, { paths: [path] });
		assert.equal(updated.ok, true);
		assert.ok(!updated.warnings?.some((warning) => warning.message.includes('direct edit')));
		writeFileSync(file, content.replace('First', 'Direct again'));
		assert.ok(
			(await honeSpellTool.handler(ctx, { paths: [path] })).warnings?.some((warning) =>
				warning.message.includes('direct edit'),
			),
		);
	} finally {
		cleanup();
	}
});

test('CLI env Git history, exact edit flags, file sections, and compact inspection', async () => {
	const { root, gitDir, cleanup } = createTestGitRoot();
	const saved = { ...process.env };
	process.env.GHOSTPAW_GRIMOIRE_ROOT = root;
	process.env.GHOSTPAW_GRIMOIRE_GIT_DIR = gitDir;
	process.env.GHOSTPAW_GRIMOIRE_DB = join(root, 'state.sqlite');
	async function cli(args: string[]) {
		let output = '',
			errors = '';
		const stdout = new Writable({
			write(chunk, _encoding, done) {
				output += String(chunk);
				done();
			},
		});
		const stderr = new Writable({
			write(chunk, _encoding, done) {
				errors += String(chunk);
				done();
			},
		});
		const code = await runToolCli(args, { ...grimoireCliOptions, stdout, stderr });
		return { code, output, errors };
	}
	try {
		assert.equal(
			(await cli(['spell', 'inscribe', 'sample', '--chapter', 'cantrips', '--content', content]))
				.code,
			0,
		);
		assert.equal((await cli(['spell', 'hone', 'cantrips/sample'])).code, 0);
		const full = JSON.parse((await cli(['inspect', 'cantrips/sample'])).output);
		assert.ok(full.data.history.length);
		assert.ok(
			!full.warnings?.some((warning: { code: string }) => warning.code === 'degraded_no_git'),
		);
		assert.equal(typeof full.data.spell.body, 'string');
		const compact = JSON.parse((await cli(['inspect', 'cantrips/sample', '--compact'])).output);
		assert.equal(compact.data.spell.body, undefined);
		assert.equal(compact.data.historyCount, full.data.history.length);
		assert.equal(compact.data.lastCommit.hash, full.data.history[0].hash);
		assert.ok(compact.data.validation.valid);
		assert.equal(
			(
				await cli([
					'spell',
					'update',
					'cantrips/sample',
					'--replace',
					'First',
					'--with',
					'Next',
					'--replace',
					'Next',
					'--with',
					'Final',
				])
			).code,
			0,
		);
		const file = join(root, 'cantrips/sample/SKILL.md');
		const before = readFileSync(file, 'utf8');
		const failure = await cli([
			'spell',
			'update',
			'cantrips/sample',
			'--replace',
			'Final',
			'--with',
			'Sample',
			'--replace',
			'Sample',
			'--with',
			'X',
		]);
		assert.equal(failure.code, 2);
		assert.match(failure.errors, /matched 3 times; make it unique/);
		assert.equal(readFileSync(file, 'utf8'), before);
		assert.equal((await cli(['spell', 'update', 'cantrips/sample', '--replace', 'x'])).code, 2);
		const bodyFile = join(root, 'body.txt');
		writeFileSync(bodyFile, 'Section body');
		assert.equal(
			(
				await cli([
					'spell',
					'update',
					'cantrips/sample',
					'--append-section',
					'Notes',
					'--body',
					`@${bodyFile}`,
				])
			).code,
			0,
		);
		assert.match(readFileSync(file, 'utf8'), /## Notes\n\nSection body/);
		assert.equal(
			(
				await cli([
					'spell',
					'update',
					'cantrips/sample',
					'--append-section',
					'Literal',
					'--body',
					'@@literal',
				])
			).code,
			0,
		);
		assert.match(readFileSync(file, 'utf8'), /@literal/);
	} finally {
		process.env = saved;
		cleanup();
	}
});

test('CLI update parsing and compact formatting work without Git', async () => {
	const { root, cleanup } = createTestRoot({
		chapters: [{ name: 'cantrips', spells: [{ name: 'sample', content }] }],
	});
	async function cli(args: string[]) {
		let output = '',
			errors = '';
		const stdout = new Writable({
			write(chunk, _encoding, done) {
				output += String(chunk);
				done();
			},
		});
		const stderr = new Writable({
			write(chunk, _encoding, done) {
				errors += String(chunk);
				done();
			},
		});
		const code = await runToolCli(args, {
			...grimoireCliOptions,
			stdout,
			stderr,
			openContext: async () => ({ root }),
			closeContext: () => {},
		});
		return { code, output, errors };
	}
	try {
		const file = join(root, 'cantrips/sample/SKILL.md');
		const before = readFileSync(file, 'utf8');
		const missing = await cli([
			'spell',
			'update',
			'cantrips/sample',
			'--replace',
			'absent',
			'--with',
			'x',
		]);
		assert.equal(missing.code, 2);
		assert.match(missing.errors, /matched 0 times/);
		assert.equal(readFileSync(file, 'utf8'), before);
		assert.equal((await cli(['spell', 'update', 'cantrips/sample', '--with', 'x'])).code, 2);
		assert.equal(
			(await cli(['spell', 'update', 'cantrips/sample', '--append-section', 'Notes'])).code,
			2,
		);
		assert.equal(
			(
				await cli([
					'spell',
					'update',
					'cantrips/sample',
					'--replace=First',
					'--with=Next',
					'--replace',
					'Next',
					'--with',
					'Final',
				])
			).code,
			0,
		);
		const body = join(root, 'body.txt');
		writeFileSync(body, 'From file.');
		assert.equal(
			(
				await cli([
					'spell',
					'update',
					'cantrips/sample',
					'--append-section',
					'Notes',
					'--body',
					`@${body}`,
				])
			).code,
			0,
		);
		assert.match(readFileSync(file, 'utf8'), /Final rule\.\n\n## Notes\n\nFrom file\./);
		assert.equal(
			(
				await cli([
					'spell',
					'update',
					'cantrips/sample',
					'--append-section',
					'Literal',
					'--body',
					'@@literal',
				])
			).code,
			0,
		);
		assert.match(readFileSync(file, 'utf8'), /@literal/);
		const full = JSON.parse((await cli(['inspect', 'cantrips/sample'])).output);
		const compact = JSON.parse((await cli(['inspect', 'cantrips/sample', '--compact'])).output);
		assert.equal(typeof full.data.spell.body, 'string');
		assert.equal(compact.data.spell.body, undefined);
		assert.equal(compact.data.historyCount, 0);
		assert.equal(compact.data.lastCommit, null);
		assert.deepEqual(compact.data.spell.frontmatter, full.data.spell.frontmatter);
		const help = await cli(['spell', 'update', '--help']);
		assert.match(help.output, /--with/);
		assert.match(help.output, /--body.*@file/);
	} finally {
		cleanup();
	}
});
