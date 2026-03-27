import type { ResolvedSource } from './types.ts';

export function resolveSource(source: string): ResolvedSource {
	if (source.startsWith('skhub:')) {
		return { type: 'agentskillhub', slug: source.slice(6) };
	}

	if (source.startsWith('/') || source.startsWith('.')) {
		return { type: 'local', url: source };
	}

	if (source.startsWith('git@')) {
		return { type: 'git', url: source };
	}

	if (source.startsWith('https://github.com/')) {
		return parseGitHubUrl(source);
	}

	if (source.endsWith('.git')) {
		return { type: 'git', url: source };
	}

	const slashIdx = source.indexOf('/');
	if (slashIdx > 0 && source.indexOf('/', slashIdx + 1) === -1 && !source.includes(':')) {
		const owner = source.slice(0, slashIdx);
		const repo = source.slice(slashIdx + 1);
		return { type: 'github', owner, repo, url: `https://github.com/${owner}/${repo}` };
	}

	return { type: 'git', url: source };
}

function parseGitHubUrl(source: string): ResolvedSource {
	const url = new URL(source);
	const parts = url.pathname.split('/').filter(Boolean);
	const owner = parts[0];
	const rawRepo = parts[1];

	if (!owner || !rawRepo) {
		return { type: 'git', url: source };
	}

	const repo = rawRepo.replace(/\.git$/, '');

	if (parts[2] === 'tree' && parts[3]) {
		const ref = parts[3];
		const result: ResolvedSource = { type: 'github', owner, repo, ref, url: source };
		if (parts.length > 4) {
			result.subpath = parts.slice(4).join('/');
		}
		return result;
	}

	return { type: 'github', owner, repo, url: source };
}
