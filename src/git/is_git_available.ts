import { execGit } from '../lib/exec_git.ts';

let cached: boolean | undefined;

export function isGitAvailable(): boolean {
	if (cached !== undefined) return cached;
	try {
		execGit({ root: '.', gitDir: '.' }, ['--version']);
		cached = true;
	} catch {
		cached = false;
	}
	return cached;
}
