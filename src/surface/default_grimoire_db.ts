import { CliUsageError } from '../surfaces/cli_args.ts';
import { resolveGrimoireDbPath } from './resolve_grimoire_db_path.ts';

export function defaultGrimoireDb(db?: string, notice = false) {
	if (db !== undefined || process.env.GHOSTPAW_GRIMOIRE_DB) return undefined;
	if (process.env.GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT === '1')
		throw new CliUsageError(
			'--db/GHOSTPAW_GRIMOIRE_DB required; --root/GHOSTPAW_GRIMOIRE_ROOT, --git-dir/GHOSTPAW_GRIMOIRE_GIT_DIR.',
		);
	const path = resolveGrimoireDbPath();
	const args = process.argv.slice(2);
	const end = args.indexOf('--');
	if (end >= 0) args.length = end;
	if (
		notice &&
		process.env.GHOSTPAW_QUIET !== '1' &&
		!args.includes('-q') &&
		!args.includes('--quiet')
	)
		process.stderr.write(`using default db ${path}\n`);
	return path;
}
