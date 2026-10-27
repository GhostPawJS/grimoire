import { execFileSync } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { GrimoireValidationError } from '../errors.ts';

export async function cloneRepo(url: string, dest: string, ref?: string): Promise<void> {
	if ((!/^(https?|file):\/\//.test(url) && !isAbsolute(url)) || hasControlCharacters(url)) {
		throw new GrimoireValidationError(
			'Repository URL must use http, https, file, or an absolute local path',
		);
	}
	if (ref !== undefined && (ref.startsWith('-') || /\s/.test(ref) || hasControlCharacters(ref))) {
		throw new GrimoireValidationError(
			'Repository ref must not start with a dash or contain whitespace or control characters',
		);
	}
	execFileSync(
		'git',
		[
			'-c',
			'protocol.ext.allow=never',
			'clone',
			'--depth=1',
			...(ref ? ['--branch', ref] : []),
			'--',
			url,
			dest,
		],
		{
			stdio: 'pipe',
			timeout: 60_000,
			shell: false,
			env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
		},
	);
}

function hasControlCharacters(value: string): boolean {
	return /\p{Cc}/u.test(value);
}
