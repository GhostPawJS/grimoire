import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { DEFAULTS } from '../defaults.ts';
import { pendingDrafts } from '../drafts/pending_drafts.ts';
import { allResonance } from '../events/all_resonance.ts';
import { allRanks } from '../git/all_ranks.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { saveCatalogue } from '../health/save_catalogue.ts';
import type { CatalogueSnapshot } from '../health/types.ts';
import { resolveNow } from '../resolve_now.ts';
import { countBodyLines } from '../spec/count_body_lines.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { discoverSpells } from '../spells/discover_spells.ts';
import { withTransaction } from '../with_transaction.ts';
import { clusterOrphans } from './cluster_orphans.ts';
import { computeChapterBalance } from './compute_chapter_balance.ts';
import { computeSealVelocity } from './compute_seal_velocity.ts';
import { computeSpellHealth } from './compute_spell_health.ts';
import { computeStaleness } from './compute_staleness.ts';
import { routeNotes } from './route_notes.ts';
import type { CatalogueOptions } from './types.ts';

export function catalogue(
	root: string,
	db: GrimoireDb,
	options?: CatalogueOptions,
): CatalogueSnapshot {
	const now = resolveNow(options?.now);
	const staleDays = options?.staleDays ?? DEFAULTS.staleDays;
	const dormantDays = options?.dormantDays ?? DEFAULTS.dormantDays;
	const oversizeLines = options?.oversizeLines ?? DEFAULTS.oversizeLines;
	const resonanceHalfLife = options?.resonanceHalfLife ?? DEFAULTS.resonanceHalfLife;
	const routingThreshold = options?.routingThreshold ?? DEFAULTS.routingThreshold;
	const clusteringThreshold = options?.clusteringThreshold ?? DEFAULTS.clusteringThreshold;

	return withTransaction(db, () => {
		const spells = discoverSpells(root);
		const ranks = isGitAvailable() ? allRanks({ root }) : {};
		const allRes = allResonance(db, { resonanceHalfLife, now });

		const sealRows = db
			.prepare("SELECT spell, ts FROM spell_events WHERE event = 'seal' ORDER BY spell, ts")
			.all<{ spell: string; ts: number }>();

		const sealsBySpell = new Map<string, number[]>();
		for (const row of sealRows) {
			let timestamps = sealsBySpell.get(row.spell);
			if (!timestamps) {
				timestamps = [];
				sealsBySpell.set(row.spell, timestamps);
			}
			timestamps.push(Number(row.ts));
		}

		const readRows = db
			.prepare("SELECT spell, MAX(ts) as ts FROM spell_events WHERE event = 'read' GROUP BY spell")
			.all<{ spell: string; ts: number }>();

		const lastReadBySpell = new Map<string, number>();
		for (const row of readRows) {
			lastReadBySpell.set(row.spell, Number(row.ts));
		}

		const spellHealthMap: Record<string, number> = {};
		const sealVelocityMap: Record<string, number> = {};
		const chapterDistribution: Record<string, number> = {};
		const staleSpells: string[] = [];
		const dormantSpells: string[] = [];
		const oversizedSpells: string[] = [];
		const spellDescriptions = new Map<string, string>();
		const spellsByChapter = new Map<string, number>();

		for (const spell of spells) {
			const chapterCount = spellsByChapter.get(spell.chapter) ?? 0;
			spellsByChapter.set(spell.chapter, chapterCount + 1);
			chapterDistribution[spell.chapter] = (chapterDistribution[spell.chapter] ?? 0) + 1;

			const skillMdPath = join(root, spell.chapter, spell.name, 'SKILL.md');
			let content: string;
			try {
				content = readFileSync(skillMdPath, 'utf-8');
			} catch {
				continue;
			}

			const parsed = parseSkillMd(content);
			if (parsed.ok) {
				spellDescriptions.set(spell.path, parsed.frontmatter.description);
			}

			const bodyLines = countBodyLines(content);
			const oversizeRatio = Math.min(1, bodyLines / oversizeLines);
			const isOversized = bodyLines > oversizeLines;

			const res = allRes[spell.path];
			const lastSealTs = res?.lastSealTs ?? now;
			const lastReadTs = lastReadBySpell.get(spell.path) ?? null;
			const resonanceWeight = Math.min(1, (res?.weightedReads ?? 0) / 6);

			const { isStale, isDormant, staleness } = computeStaleness(
				lastSealTs,
				lastReadTs,
				now,
				staleDays,
				dormantDays,
			);

			const health = computeSpellHealth(staleness, oversizeRatio, resonanceWeight);
			const sealTimestamps = sealsBySpell.get(spell.path) ?? [];
			const sealVelocity = computeSealVelocity(sealTimestamps, now);

			spellHealthMap[spell.path] = health;
			sealVelocityMap[spell.path] = sealVelocity;

			if (isStale) staleSpells.push(spell.path);
			if (isDormant) dormantSpells.push(spell.path);
			if (isOversized) oversizedSpells.push(spell.path);
		}

		const notesRouted = routeNotes(db, spellDescriptions, routingThreshold);
		const orphanClusters = clusterOrphans(db, clusteringThreshold);

		const pendingNoteCount = Number(
			db
				.prepare("SELECT COUNT(*) as cnt FROM spell_notes WHERE status = 'pending'")
				.get<{ cnt: number }>()?.cnt ?? 0,
		);

		const notesByChapterRows = db
			.prepare(
				"SELECT domain, COUNT(*) as cnt FROM spell_notes WHERE status = 'pending' AND domain IS NOT NULL GROUP BY domain",
			)
			.all<{ domain: string; cnt: number }>();

		const notesByChapter = new Map<string, number>();
		for (const row of notesByChapterRows) {
			const chapter = row.domain.split('/')[0];
			if (chapter !== undefined) {
				notesByChapter.set(chapter, (notesByChapter.get(chapter) ?? 0) + Number(row.cnt));
			}
		}

		const chapterBalance = computeChapterBalance(spellsByChapter, notesByChapter);
		const chapterBalanceMap: Record<string, number> = {};
		for (const cb of chapterBalance) {
			chapterBalanceMap[cb.chapter] = cb.noteLoadRatio;
		}

		const draftsQueued = pendingDrafts(db).length;

		const rankDistribution: Record<string, number> = {};
		for (const [path, rank] of Object.entries(ranks)) {
			rankDistribution[path] = rank;
		}

		const computedAt = new Date(now).toISOString();

		const { id } = saveCatalogue(db, {
			computedAt,
			totalSpells: spells.length,
			chapterDistribution,
			rankDistribution,
			staleSpells,
			dormantSpells,
			oversizedSpells,
			pendingNotes: pendingNoteCount,
			notesRouted,
			orphanClusters,
			draftsQueued,
			chapterBalance: chapterBalanceMap,
			spellHealth: spellHealthMap,
			sealVelocity: sealVelocityMap,
		});

		return {
			id,
			computedAt,
			totalSpells: spells.length,
			chapterDistribution,
			rankDistribution,
			staleSpells,
			dormantSpells,
			oversizedSpells,
			pendingNotes: pendingNoteCount,
			notesRouted,
			orphanClusters,
			draftsQueued,
			chapterBalance: chapterBalanceMap,
			spellHealth: spellHealthMap,
			sealVelocity: sealVelocityMap,
		};
	});
}
