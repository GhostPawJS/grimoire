import { grimoireCliOptions } from '../../src/surface/grimoire_cli_options.ts';
import { runToolCli } from '../../src/surfaces/cli.ts';

export const run = (): Promise<void> =>
	runToolCli(process.argv.slice(2), grimoireCliOptions).then(
		(code) => {
			process.exitCode = code;
		},
		(error: unknown) => {
			process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
			process.exitCode = 1;
		},
	);
