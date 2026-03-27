import { execSync } from 'node:child_process';

export async function cloneRepo(url: string, dest: string, ref?: string): Promise<void> {
	const args = ['git', 'clone', '--depth=1'];
	if (ref) {
		args.push('--branch', ref);
	}
	args.push(url, dest);
	execSync(args.join(' '), { stdio: 'pipe', timeout: 60_000 });
}
