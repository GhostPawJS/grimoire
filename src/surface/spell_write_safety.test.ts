import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { decomposeOversizedSpellsSkill } from '../skills/decompose-oversized-spells.ts';
import { inscribe } from '../spells/inscribe.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { createMcpServer } from '../surfaces/mcp_server.ts';
import { honeSpellTool } from '../tools/hone_spell_tool.ts';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { manageSpellTool } from '../tools/manage_spell_tool.ts';
import { grimoireTools } from '../tools/tool_registry.ts';
import { updateSpellTool } from '../tools/update_spell_tool.ts';
import { grimoireCliOptions } from './grimoire_cli_options.ts';
import { grimoireMcpOptions } from './grimoire_mcp_options.ts';
import { grimoireMcpSurfaceTools } from './grimoire_surface_tools.ts';
import { openGrimoireDb } from './open_grimoire_db.ts';

const content =
	'---\nname: sample\ndescription: A sample procedure\n---\n\n# Sample\n\nFollow this rule.\n';

test('compression and re-measurement precede splitting', () => {
	const text = decomposeOversizedSpellsSkill.content;
	assert.ok(text.indexOf('better abstraction') < text.indexOf('last resort, split'));
	assert.ok(text.indexOf('re-measure') < text.indexOf('last resort, split'));
	assert.match(text, /merge duplicated cases/);
});

test('MCP payload stays below seventy percent without changing schema structure', async () => {
	const server = createMcpServer(
		grimoireMcpOptions(() => {
			throw new Error('listing must not open context');
		}),
	);
	const response = await server.handleLine(
		JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/list',
			params: {
				_meta: {
					'io.modelcontextprotocol/protocolVersion': '2026-07-28',
					'io.modelcontextprotocol/clientCapabilities': {},
				},
			},
		}),
	);
	const payload = JSON.parse(response as string).result.tools;
	assert.equal(payload.length, 11);
	assert.ok(Buffer.byteLength(JSON.stringify(payload)) <= 10714 * 0.7);
	const withoutText = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(withoutText);
		if (value && typeof value === 'object')
			return Object.fromEntries(
				Object.entries(value)
					.filter(([key]) => key !== 'description')
					.map(([key, child]) => [key, withoutText(child)]),
			);
		return value;
	};
	for (const tool of grimoireMcpSurfaceTools) {
		assert.deepEqual(
			withoutText(tool.inputSchema),
			withoutText(grimoireTools.find((original) => original.name === tool.name)?.inputSchema),
		);
	}
});

test('database directory creation and bad parent CLI error', async () => {
	const { root, cleanup } = createTestRoot();
	try {
		const path = join(root, 'missing', 'nested', 'state.db');
		const db = await openGrimoireDb(path);
		db.close();
		assert.ok(existsSync(path));
		const file = join(root, 'file');
		writeFileSync(file, 'occupied');
		const directory = join(file, 'nested');
		const message = `Cannot create database directory ${directory}: a path component is not a directory`;
		await assert.rejects(openGrimoireDb(join(directory, 'state.db')), { message });
		let error = '';
		const sink = new Writable({
			write(chunk, _encoding, done) {
				error += String(chunk);
				done();
			},
		});
		const code = await runToolCli(
			['--db', join(directory, 'state.db'), '--root', root, 'review', 'chapters'],
			{ ...grimoireCliOptions, stdout: sink, stderr: sink },
		);
		assert.equal(code, 2);
		assert.ok(error.includes(message));
	} finally {
		cleanup();
	}
});

test('force re-inscription advances rank only for changed content and hone identifies its seal', async () => {
	const { root, gitDir, cleanup } = createTestGitRoot();
	const ctx = { root, gitDir };
	try {
		const created = await inscribeSpellTool.handler(ctx, { name: 'sample', content });
		assert.ok(created.ok && created.data.commitHash);
		const first = inscribe(root, undefined, { name: 'sample', content, gitDir, force: true });
		assert.equal(first.spell.rank, 1);
		assert.throws(
			() => inscribe(root, undefined, { name: 'sample', content, gitDir }),
			/Spell already exists: general\/sample.*--force/,
		);
		assert.equal(
			inscribe(root, undefined, { name: 'sample', content, gitDir, force: true }).spell.rank,
			1,
		);
		assert.equal(
			inscribe(root, undefined, {
				name: 'sample',
				content: `${content}\nMore detail.\n`,
				gitDir,
				force: true,
			}).spell.rank,
			2,
		);
		const initialHash = await honeSpellTool.handler(ctx, { paths: ['general/sample'] });
		assert.ok(initialHash.ok && initialHash.data.commitHash);
		const honed = await honeSpellTool.handler(ctx, { paths: ['general/sample'] });
		assert.equal(honed.outcome, 'no_op');
		assert.match(honed.summary, /^already sealed by inscribe [a-f0-9]{8}$/);
		const update = await updateSpellTool.handler(ctx, {
			path: 'general/sample',
			content: `${content}\nChanged again.\n`,
		});
		assert.ok(update.ok && 'rollbackHash' in update.data);
		const seal = await honeSpellTool.handler(ctx, { paths: ['general/sample'] });
		assert.ok(seal.ok && seal.data.commitHash);
		const unchanged = await honeSpellTool.handler(ctx, { paths: ['general/sample'] });
		assert.match(unchanged.summary, /^already sealed by hone [a-f0-9]{8}$/);
		const moved = await manageSpellTool.handler(ctx, {
			action: 'move',
			path: 'general/sample',
			target: 'general/renamed',
		});
		assert.ok(moved.ok && moved.data.commitHash);
		const restored = await manageSpellTool.handler(ctx, {
			action: 'rollback',
			path: 'general/renamed',
			ref: initialHash.ok ? initialHash.data.commitHash : '',
		});
		assert.ok(restored.ok && restored.data.commitHash);
		const repaired = await manageSpellTool.handler(ctx, { action: 'repair_all' });
		assert.ok(repaired.ok && (repaired.data.commitHash || repaired.data.rollbackHash));
		for (const action of ['shelve', 'unshelve', 'repair', 'delete'] as const) {
			const result = await manageSpellTool.handler(ctx, { action, path: 'general/renamed' });
			assert.ok(result.ok && (result.data.commitHash || result.data.rollbackHash), action);
		}
	} finally {
		cleanup();
	}
});

test('inscribe refuses occupied files and force replaces them', async () => {
	const { root, cleanup } = createTestRoot();
	try {
		const name = 'general';
		const chapter = join(root, name);
		mkdirSync(chapter);
		writeFileSync(join(chapter, 'sample'), 'occupied');
		const result = await inscribeSpellTool.handler(
			{ root },
			{ name: 'sample', chapter: name, content },
		);
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		assert.match(result.summary, /--force/);
		assert.ok(
			(
				await inscribeSpellTool.handler(
					{ root },
					{ name: 'sample', chapter: name, content, force: true },
				)
			).ok,
		);
		writeFileSync(join(chapter, 'occupied'), 'another file');
		const refused = await manageSpellTool.handler(
			{ root },
			{ action: 'move', path: 'general/sample', target: 'general/occupied' },
		);
		assert.equal(refused.outcome, 'error');
		assert.match(refused.summary, /Spell already exists: general\/occupied.*--force/);
		assert.ok(
			(
				await manageSpellTool.handler(
					{ root },
					{ action: 'move', path: 'general/sample', target: 'general/occupied', force: true },
				)
			).ok,
		);
	} finally {
		cleanup();
	}
});

test('terminal writes end with the short commit or rollback hash', () => {
	const format = grimoireCliOptions.formatResult;
	assert.ok(format);
	const tool = grimoireMcpSurfaceTools.find((item) => item.name === 'update_spell');
	assert.ok(tool);
	const hash = '12345678abcdefab';
	assert.equal(
		format({ summary: 'Updated.', data: { rollbackHash: hash } }, tool, {}, false),
		'Updated.\nrollback 12345678\n',
	);
	assert.equal(
		format({ summary: 'Sealed.', data: { commitHash: hash } }, tool, {}, false),
		'Sealed.\ncommit 12345678\n',
	);
	assert.equal(
		format(
			{ summary: 'already sealed by hone 12345678', outcome: 'no_op', data: { commitHash: hash } },
			tool,
			{},
			false,
		),
		'already sealed by hone 12345678\nrollback 12345678\n',
	);
});
