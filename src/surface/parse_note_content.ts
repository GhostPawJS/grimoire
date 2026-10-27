import { CliUsageError } from '../surfaces/cli_args.ts';

export function parseNoteContent(raw: string): string {
	if (!raw.trim()) {
		const error = new CliUsageError(
			'Note content must not be empty. Supply non-empty evidence and --source; see ghostpaw-grimoire note drop --help.',
		);
		error.errorCode = 'invalid_input';
		throw error;
	}
	return raw;
}
