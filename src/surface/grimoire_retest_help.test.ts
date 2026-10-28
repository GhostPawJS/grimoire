import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { cliCommands } from '../surfaces/cli_commands.ts';
import { grimoireCliOptions } from './grimoire_cli_options.ts';

test('every command and review view accepts short and long help without opening state', async () => {
	const commands = cliCommands(grimoireCliOptions.tools).map((command) => command.path);
	commands.push('review index');
	for (const command of commands)
		for (const flag of ['-h', '--help']) {
			let out = '';
			const code = await runToolCli([...command.split(' '), flag], {
				...grimoireCliOptions,
				stdin: Readable.from([]),
				stdout: new Writable({
					write(chunk, _encoding, cb) {
						out += String(chunk);
						cb();
					},
				}),
				openContext: () => {
					throw new Error('Help must not open state');
				},
			});
			assert.equal(code, 0, command);
			assert.match(out, /Usage:/, command);
		}
});
