import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { cliCommands } from '../surfaces/cli_commands.ts';
import { grimoireCliOptions } from './grimoire_cli_options.ts';
import { grimoireMcpSurfaceTools, grimoireSurfaceTools } from './grimoire_surface_tools.ts';

test('grimoire noun verb note drop and review notes use a file database', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-cli-'));
	const previous = process.env.GHOSTPAW_GRIMOIRE_ROOT;
	process.env.GHOSTPAW_GRIMOIRE_ROOT = join(dir, 'spells');
	try {
		const invoke = async (args: string[]) => {
			let out = '';
			let err = '';
			const code = await runToolCli([...args, '--db', join(dir, 'test.db'), '--json'], {
				...grimoireCliOptions,
				stdin: Readable.from([]),
				stdout: new Writable({
					write(chunk, _encoding, cb) {
						out += String(chunk);
						cb();
					},
				}),
				stderr: new Writable({
					write(chunk, _encoding, cb) {
						err += String(chunk);
						cb();
					},
				}),
			});
			assert.equal(err, '');
			return { code, result: JSON.parse(out) };
		};

		const added = await invoke(['note', 'drop', 'Verify the build', '--source', 'test']);
		assert.equal(added.code, 0);
		const found = await invoke(['review', 'notes']);
		assert.equal(found.code, 0);
		assert.equal(found.result.data.notes.length, 1);
		assert.equal(found.result.data.notes[0].id, added.result.data.noteId);
	} finally {
		if (previous === undefined) delete process.env.GHOSTPAW_GRIMOIRE_ROOT;
		else process.env.GHOSTPAW_GRIMOIRE_ROOT = previous;
		rmSync(dir, { recursive: true, force: true });
	}
});

test('grimoire command tree covers every tool and action once without changing MCP metadata', () => {
	const commands = cliCommands(grimoireSurfaceTools);
	assert.equal(commands.length, 22);
	assert.equal(new Set(commands.map((command) => command.path)).size, commands.length);
	for (const tool of grimoireSurfaceTools) {
		assert.ok(tool.cli, tool.name);
		const paths = commands.filter((command) => command.tool === tool);
		const actions = tool.inputSchema.properties?.action?.enum;
		assert.equal(paths.length, actions?.length ?? 1, tool.name);
		if (actions)
			assert.deepEqual(
				paths.map((command) => command.fixed.action),
				actions,
			);
	}
	assert.deepEqual(
		grimoireSurfaceTools.map(({ cli: _cli, ...tool }) => tool),
		grimoireMcpSurfaceTools,
	);
	assert.ok(grimoireMcpSurfaceTools.every((tool) => !('cli' in tool)));
});
