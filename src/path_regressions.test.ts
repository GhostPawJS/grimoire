import assert from 'node:assert/strict';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { GrimoireConflictError, GrimoireValidationError } from './errors.ts';
import { seal } from './git/seal.ts';
import { execGit } from './lib/exec_git.ts';
import { createTestDb } from './lib/test-db.ts';
import { createTestGitRoot } from './lib/test-git.ts';
import { cloneRepo } from './scouting/clone_repo.ts';
import { deleteSpell } from './spells/delete_spell.ts';
import { getSpell } from './spells/get_spell.ts';
import { inscribe } from './spells/inscribe.ts';
import { moveSpell } from './spells/move_spell.ts';
import { grimoireCliOptions } from './surface/grimoire_cli_options.ts';
import { grimoireMcpOptions } from './surface/grimoire_mcp_options.ts';
import { runToolCli } from './surfaces/cli.ts';
import { createMcpServer } from './surfaces/mcp_server.ts';
import type { GrimoireToolContext } from './tools/tool_metadata.ts';
import type { ToolResult } from './tools/tool_types.ts';

const content = (name = 'sample', body = 'Original') =>
	`---\nname: ${name}\ndescription: Test procedure\n---\n\n${body}\n`;
type Input = Record<string, unknown>;
async function invoke(surface: string, ctx: GrimoireToolContext, name: string, input: Input) {
	if (surface === 'library') {
		try {
			switch (name) {
				case 'inscribe_spell':
					inscribe(ctx.root, ctx.db, {
						name: String(input.name),
						content: String(input.content),
						...(input.chapter === undefined ? {} : { chapter: String(input.chapter) }),
						...(input.force === undefined ? {} : { force: input.force === true }),
					});
					break;
				case 'inspect_grimoire_item':
					getSpell(ctx.root, String(input.path));
					break;
				case 'manage_spell':
					if (input.action === 'delete') deleteSpell(ctx.root, String(input.path));
					else
						moveSpell(ctx.root, String(input.path), String(input.target), ctx.db, {
							force: input.force === true,
						});
					break;
				case 'hone_spell':
					seal(
						{ root: ctx.root, ...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}) },
						ctx.db,
						input.paths as string[],
						String(input.message),
					);
					break;
				case 'scout_skills':
					await cloneRepo(String(input.source), join(ctx.root, 'clone'));
					break;
				default:
					throw new Error(name);
			}
			return { ok: true, code: 0 };
		} catch (error) {
			assert.ok(error instanceof GrimoireValidationError || error instanceof GrimoireConflictError);
			return { ok: false, code: error instanceof GrimoireConflictError ? 4 : 1 };
		}
	}
	if (surface === 'cli') {
		let out = '';
		const stream = new Writable({
			write(chunk, _encoding, cb) {
				out += String(chunk);
				cb();
			},
		});
		const commands: Record<string, string[]> = {
			inscribe_spell: ['spell', 'inscribe'],
			inspect_grimoire_item: ['inspect'],
			manage_spell: ['spell', String(input.action)],
			hone_spell: ['spell', 'hone'],
			scout_skills: ['scout', 'adopt'],
		};
		const code = await runToolCli([...(commands[name] ?? []), '--json'], {
			...grimoireCliOptions,
			openContext: () => ctx,
			closeContext: () => {},
			stdin: Readable.from([JSON.stringify(input)]),
			stdout: stream,
			stderr: new Writable({
				write(_chunk, _encoding, cb) {
					cb();
				},
			}),
		});
		const result = JSON.parse(out) as ToolResult<unknown>;
		if (!result.ok) {
			assert.ok('error' in result);
			// Schema-level rejection (usage_error, exit 2) and handler-level validation (exit 1) both refuse the input.
			if (code === 2) {
				assert.equal(result.error?.code, 'usage_error');
				return { ok: false, code: 1 };
			}
			assert.equal(result.error?.code, code === 4 ? 'conflict' : 'validation_failed');
			assert.equal(result.error?.kind, code === 4 ? 'domain' : 'protocol');
		}
		return { ok: result.ok, code };
	}
	const server = createMcpServer(grimoireMcpOptions(() => ctx));
	const response = await server.handleLine(
		JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: {
				_meta: {
					'io.modelcontextprotocol/protocolVersion': '2026-07-28',
					'io.modelcontextprotocol/clientCapabilities': {},
				},
				name,
				arguments: input,
			},
		}),
	);
	const envelope = JSON.parse(response ?? 'null').result as {
		isError?: boolean;
		structuredContent?: ToolResult<unknown>;
		content?: { text?: string }[];
	};
	if (!envelope.structuredContent) {
		// Schema-level rejection before the handler runs.
		assert.equal(envelope.isError, true);
		assert.match(envelope.content?.[0]?.text ?? '', /must match|required|must be/);
		return { ok: false, code: 1 };
	}
	const result = envelope.structuredContent;
	if (!result.ok) {
		assert.ok('error' in result);
		assert.equal(result.error?.kind, result.error?.code === 'conflict' ? 'domain' : 'protocol');
		assert.ok(['conflict', 'validation_failed'].includes(result.error?.code ?? ''));
	}
	return {
		ok: result.ok,
		code: result.ok ? 0 : 'error' in result && result.error?.code === 'conflict' ? 4 : 1,
	};
}

for (const surface of ['library', 'cli', 'mcp']) {
	for (const scenario of [
		'chapter-text',
		'chapter-parent',
		'name-parent',
		'delete-parent',
		'symlink',
		'inscribe-conflict',
		'move-conflict',
		'clone-url',
	]) {
		test(`${surface}: ${scenario}`, async () => {
			const base = mkdtempSync(join(tmpdir(), 'grimoire-path-test-'));
			const root = join(base, 'root');
			mkdirSync(root);
			const db = createTestDb();
			const ctx = { root, db };
			const marker = join(base, 'marker');
			const call = (name: string, input: Input) => invoke(surface, ctx, name, input);
			try {
				if (scenario.startsWith('chapter-') || scenario === 'name-parent') {
					const input: Input = { name: 'sample', content: content(), chapter: 'general' };
					if (scenario === 'chapter-text') input.chapter = `c$(touch ${marker})`;
					if (scenario === 'chapter-parent') input.chapter = '../escaped';
					if (scenario === 'name-parent') input.name = '../../outside';
					assert.deepEqual(await call('inscribe_spell', input), { ok: false, code: 1 });
					assert.equal(existsSync(join(base, 'escaped')), false);
					assert.equal(existsSync(join(base, 'outside')), false);
					assert.equal(existsSync(join(root, String(input.chapter))), false);
				} else if (scenario === 'delete-parent') {
					const outside = join(base, 'escaped', 'trav');
					mkdirSync(outside, { recursive: true });
					writeFileSync(join(outside, 'SKILL.md'), content());
					assert.deepEqual(
						await call('manage_spell', { action: 'delete', path: '../escaped/trav' }),
						{ ok: false, code: 1 },
					);
					assert.equal(readFileSync(join(outside, 'SKILL.md'), 'utf8'), content());
				} else if (scenario === 'symlink') {
					const outside = join(base, 'outside');
					mkdirSync(join(outside, 'sample'), { recursive: true });
					writeFileSync(join(outside, 'sample', 'SKILL.md'), content());
					symlinkSync(outside, join(root, 'ops'), 'dir');
					for (const [name, input] of [
						['inscribe_spell', { chapter: 'ops', name: 'sample', content: content() }],
						['inspect_grimoire_item', { path: 'ops/sample' }],
						['manage_spell', { action: 'delete', path: 'ops/sample' }],
					] as [string, Input][])
						assert.deepEqual(await call(name, input), { ok: false, code: 1 });
					assert.equal(readFileSync(join(outside, 'sample', 'SKILL.md'), 'utf8'), content());
				} else if (scenario === 'inscribe-conflict') {
					assert.equal(
						(await call('inscribe_spell', { name: 'sample', content: content() })).ok,
						true,
					);
					assert.deepEqual(
						await call('inscribe_spell', { name: 'sample', content: content('sample', 'New') }),
						{ ok: false, code: 4 },
					);
					assert.equal(readFileSync(join(root, 'general/sample/SKILL.md'), 'utf8'), content());
					assert.equal(
						(
							await call('inscribe_spell', {
								name: 'sample',
								content: content('sample', 'New'),
								force: true,
							})
						).ok,
						true,
					);
					assert.equal(
						readFileSync(join(root, 'general/sample/SKILL.md'), 'utf8'),
						content('sample', 'New'),
					);
				} else if (scenario === 'move-conflict') {
					for (const name of ['source', 'target'])
						await call('inscribe_spell', { name, content: content(name) });
					assert.deepEqual(
						await call('manage_spell', {
							action: 'move',
							path: 'general/source',
							target: 'general/target',
						}),
						{ ok: false, code: 4 },
					);
					for (const name of ['source', 'target'])
						assert.equal(
							readFileSync(join(root, 'general', name, 'SKILL.md'), 'utf8'),
							content(name),
						);
					assert.equal(
						(
							await call('manage_spell', {
								action: 'move',
								path: 'general/source',
								target: 'general/target',
								force: true,
							})
						).ok,
						true,
					);
					assert.equal(existsSync(join(root, 'general/source')), false);
					assert.equal(
						readFileSync(join(root, 'general/target/SKILL.md'), 'utf8'),
						content('source'),
					);
				} else {
					assert.deepEqual(
						await call('scout_skills', {
							action: 'adopt',
							source: `--upload-pack=touch ${marker}`,
						}),
						{ ok: false, code: 1 },
					);
				}
				assert.equal(existsSync(marker), false);
			} finally {
				db.close();
				rmSync(base, { recursive: true, force: true });
			}
		});
	}
	test(`${surface}: hone preserves a literal commit message`, async () => {
		const fixture = createTestGitRoot({
			chapters: [{ name: 'general', spells: [{ name: 'sample' }] }],
		});
		const marker = join(fixture.root, 'marker');
		const marker2 = join(fixture.root, 'marker2');
		const message = `x $(touch ${marker}) \`touch ${marker2}\``;
		try {
			assert.equal(
				(
					await invoke(surface, { root: fixture.root, gitDir: fixture.gitDir }, 'hone_spell', {
						paths: ['general/sample'],
						message,
					})
				).ok,
				true,
			);
			assert.equal(execGit(fixture, ['log', '-1', '--format=%s']), message);
			assert.equal(existsSync(marker), false);
			assert.equal(existsSync(marker2), false);
		} finally {
			fixture.cleanup();
		}
	});
}

test('spell command help exposes force', async () => {
	for (const command of ['inscribe', 'move', 'unshelve']) {
		let output = '';
		const stdout = new Writable({
			write(chunk, _encoding, cb) {
				output += String(chunk);
				cb();
			},
		});
		assert.equal(
			await runToolCli(['spell', command, '--help'], { ...grimoireCliOptions, stdout }),
			0,
		);
		assert.match(output, /--force/);
	}
});
