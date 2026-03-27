import type { GrimoireDb } from '../database.ts';
import { rank } from '../git/rank.ts';
import { allProvenance } from '../provenance/all_provenance.ts';
import type { Provenance } from '../provenance/types.ts';
import type { UpdateCheck } from './types.ts';

export async function checkUpdates(root: string, db: GrimoireDb): Promise<UpdateCheck[]> {
	const records = allProvenance(db);
	const ctx = { root };
	const results: UpdateCheck[] = [];

	for (const prov of records) {
		const localRank = rank(ctx, prov.spellPath);
		const hasLocalEvolution = localRank > 1;

		const latestCommit = await fetchLatestCommit(prov);

		results.push({
			spellPath: prov.spellPath,
			provenance: prov,
			...(latestCommit !== undefined ? { latestCommit } : {}),
			hasLocalEvolution,
			localRank,
		});
	}

	return results;
}

async function fetchLatestCommit(prov: Provenance): Promise<string | undefined> {
	switch (prov.sourceType) {
		case 'github': {
			if (!prov.sourceRepo) return undefined;
			const pathParam = prov.sourcePath
				? `?path=${encodeURIComponent(prov.sourcePath)}&per_page=1`
				: '?per_page=1';
			const url = `https://api.github.com/repos/${prov.sourceRepo}/commits${pathParam}`;
			try {
				const response = await fetch(url);
				if (!response.ok) return undefined;
				const data = (await response.json()) as Array<{ sha?: string }>;
				return data[0]?.sha;
			} catch {
				return undefined;
			}
		}

		case 'agentskillhub': {
			if (!prov.sourceCommit) return undefined;
			try {
				const response = await fetch('https://agentskillhub.dev/api/v1/skills/check-updates', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ commits: [prov.sourceCommit] }),
				});
				if (!response.ok) return undefined;
				const data = (await response.json()) as Record<string, string | undefined>;
				return data[prov.sourceCommit];
			} catch {
				return undefined;
			}
		}

		case 'local':
			return undefined;

		default:
			return undefined;
	}
}
