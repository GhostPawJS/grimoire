import type { RepoAnalysis } from './types.ts';

export async function analyzeRepo(url: string): Promise<RepoAnalysis> {
	if (!url.trim()) {
		throw new Error('analyzeRepo requires a non-empty URL');
	}

	const res = await fetch('https://agentskillhub.dev/api/v1/repos/analyze', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url }),
	});

	if (!res.ok) {
		throw new Error(`analyzeRepo failed: ${String(res.status)} ${res.statusText}`);
	}

	return (await res.json()) as RepoAnalysis;
}
