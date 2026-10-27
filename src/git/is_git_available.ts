import { execFileSync } from 'node:child_process';

let cached: boolean | undefined;

export function isGitAvailable(): boolean {
	if (cached !== undefined) return cached;
	try {
		execFileSync('git', ['--version'], { encoding: 'utf-8', timeout: 5_000 });
		cached = true;
	} catch {
		cached = false;
	}
	return cached;
}
