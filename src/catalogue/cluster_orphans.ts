import type { GrimoireDb } from '../database.ts';
import { DEFAULTS } from '../defaults.ts';
import type { OrphanCluster } from '../health/types.ts';
import { topBigrams } from '../lib/bigrams.ts';
import { trigramJaccard } from '../lib/trigram_jaccard.ts';

export function clusterOrphans(db: GrimoireDb, threshold?: number): OrphanCluster[] {
	const t = threshold ?? DEFAULTS.clusteringThreshold;

	const unrouted = db
		.prepare(
			"SELECT id, source, content FROM spell_notes WHERE domain IS NULL AND status = 'pending' ORDER BY id",
		)
		.all<{ id: number; source: string; content: string }>();

	const draftRows = db
		.prepare("SELECT note_ids FROM spell_drafts WHERE status = 'pending'")
		.all<{ note_ids: string }>();

	const draftNoteIds = new Set<number>();
	for (const row of draftRows) {
		const ids: unknown = JSON.parse(row.note_ids);
		if (Array.isArray(ids)) {
			for (const id of ids) {
				draftNoteIds.add(Number(id));
			}
		}
	}

	const orphans = unrouted.filter((n) => !draftNoteIds.has(n.id));
	if (orphans.length < 3) return [];

	const parent = new Int32Array(orphans.length);
	for (let i = 0; i < parent.length; i++) {
		parent[i] = i;
	}

	function find(x: number): number {
		let root = x;
		let p = parent[root];
		while (p !== undefined && p !== root) {
			root = p;
			p = parent[root];
		}
		let current = x;
		while (current !== root) {
			const next = parent[current] ?? root;
			parent[current] = root;
			current = next;
		}
		return root;
	}

	function union(a: number, b: number): void {
		parent[find(a)] = find(b);
	}

	for (let i = 0; i < orphans.length; i++) {
		const contentI = orphans[i]?.content;
		if (contentI === undefined) continue;
		for (let j = i + 1; j < orphans.length; j++) {
			const contentJ = orphans[j]?.content;
			if (contentJ === undefined) continue;
			if (trigramJaccard(contentI, contentJ) >= t) {
				union(i, j);
			}
		}
	}

	const groups = new Map<number, number[]>();
	for (let i = 0; i < orphans.length; i++) {
		const root = find(i);
		let group = groups.get(root);
		if (!group) {
			group = [];
			groups.set(root, group);
		}
		group.push(i);
	}

	const clusters: OrphanCluster[] = [];

	for (const indices of groups.values()) {
		if (indices.length < 3) continue;

		const sources = new Set<string>();
		const noteIds: number[] = [];
		const contents: string[] = [];

		for (const idx of indices) {
			const orphan = orphans[idx];
			if (orphan === undefined) continue;
			sources.add(orphan.source);
			noteIds.push(orphan.id);
			contents.push(orphan.content);
		}

		if (sources.size < 2) continue;

		clusters.push({
			noteIds,
			memberCount: noteIds.length,
			sourceCount: sources.size,
			suggestedTerms: topBigrams(contents),
		});
	}

	return clusters;
}
