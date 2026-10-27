import { grimoireCliOptions } from './surface/grimoire_cli_options.ts';
import { runToolCli } from './surfaces/cli.ts';

process.exitCode = await runToolCli(process.argv.slice(2), grimoireCliOptions);
