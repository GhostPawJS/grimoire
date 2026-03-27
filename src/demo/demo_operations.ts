import { clusterOrphans } from '../catalogue/cluster_orphans.ts';
import { computeChapterBalance } from '../catalogue/compute_chapter_balance.ts';
import { computeSealVelocity } from '../catalogue/compute_seal_velocity.ts';
import { computeSpellHealth } from '../catalogue/compute_spell_health.ts';
import { computeStaleness } from '../catalogue/compute_staleness.ts';
import { routeNotes } from '../catalogue/route_notes.ts';
import type { CatalogueOptions } from '../catalogue/types.ts';
import type { GrimoireDb } from '../database.ts';
import { DEFAULTS } from '../defaults.ts';
import { pendingDrafts } from '../drafts/pending_drafts.ts';
import { GrimoireNotFoundError, GrimoireValidationError } from '../errors.ts';
import { allResonance } from '../events/all_resonance.ts';
import { logEvent } from '../events/log_event.ts';
import { tier } from '../git/tier.ts';
import { saveCatalogue } from '../health/save_catalogue.ts';
import type { CatalogueSnapshot } from '../health/types.ts';
import type { IndexEntry, IndexOptions } from '../indexing/types.ts';
import { trigramJaccard } from '../lib/trigram_jaccard.ts';
import { resolveNow } from '../resolve_now.ts';
import { countBodyLines } from '../spec/count_body_lines.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { isValidSpellName, validateSkillMd } from '../spec/validate_skill_md.ts';
import type { DuplicationWarning, InscribeInput, InscribeResult, Spell } from '../spells/types.ts';
import { withTransaction } from '../with_transaction.ts';
import type { VirtualSpellStore } from './virtual_spell_store.ts';

const DEMO_ROOT = '/demo';

export function demoBuildIndex(store: VirtualSpellStore, options?: IndexOptions): IndexEntry[] {
	const spells = store.discoverSpells();
	const entries: IndexEntry[] = [];
	for (const spell of spells) {
		const content = store.get(spell.path);
		if (!content) continue;
		const parsed = parseSkillMd(content);
		if (!parsed.ok) continue;
		if (options?.chapters && !options.chapters.includes(spell.chapter)) continue;
		const rank = 0;
		entries.push({
			path: spell.path,
			chapter: spell.chapter,
			name: spell.name,
			tier: tier(rank),
			rank,
			description: parsed.frontmatter.description,
		});
	}
	entries.sort((a, b) => b.rank - a.rank || a.path.localeCompare(b.path));
	return entries;
}

function detectDuplicates(
	store: VirtualSpellStore,
	newPath: string,
	newDescription: string,
): DuplicationWarning[] {
	const warnings: DuplicationWarning[] = [];
	for (const entry of store.discoverSpells()) {
		if (entry.path === newPath) continue;
		const content = store.get(entry.path);
		if (!content) continue;
		const parsed = parseSkillMd(content);
		if (!parsed.ok) continue;
		const similarity = trigramJaccard(newDescription, parsed.frontmatter.description);
		if (similarity >= DEFAULTS.routingThreshold) {
			warnings.push({ existingPath: entry.path, similarity });
		}
	}
	return warnings;
}

export function demoInscribe(
	store: VirtualSpellStore,
	db: GrimoireDb | undefined,
	input: InscribeInput,
): InscribeResult {
	const name = input.name.trim();
	const chapter = (input.chapter ?? DEFAULTS.defaultChapter).trim();
	if (name.length === 0) {
		throw new GrimoireValidationError('Spell name is required');
	}
	if (!isValidSpellName(name)) {
		throw new GrimoireValidationError(
			'Spell name must be kebab-case (lowercase letters, digits, single hyphens)',
		);
	}
	if (chapter.length === 0 || chapter.includes('/')) {
		throw new GrimoireValidationError('Chapter must be a single path segment (no slashes)');
	}
	const validation = validateSkillMd(input.content);
	if (!validation.valid) {
		throw new GrimoireValidationError(`Invalid SKILL.md content: ${validation.errors.join('; ')}`);
	}
	const parsed = parseSkillMd(input.content);
	if (!parsed.ok) {
		throw new GrimoireValidationError(`Failed to parse SKILL.md: ${parsed.error}`);
	}
	if (parsed.frontmatter.name !== name) {
		throw new GrimoireValidationError(
			`Frontmatter name "${parsed.frontmatter.name}" must match the Name field "${name}"`,
		);
	}
	const path = `${chapter}/${name}`;
	if (store.has(path)) {
		throw new GrimoireValidationError(`Spell already exists: ${path}`);
	}
	store.set(path, input.content);
	const warnings = detectDuplicates(store, path, parsed.frontmatter.description);

	const perform = (): InscribeResult => {
		if (db) {
			logEvent(db, {
				spell: path,
				event: 'inscribe',
				...(input.now !== undefined ? { now: input.now } : {}),
			});
		}
		const spell = demoGetSpell(store, path);
		return { spell, warnings };
	};

	return db ? withTransaction(db, perform) : perform();
}

export function demoGetSpell(store: VirtualSpellStore, path: string, db?: GrimoireDb): Spell {
	const content = store.get(path);
	if (content === undefined) {
		throw new GrimoireNotFoundError(`Spell not found: ${path}`);
	}
	const parsed = parseSkillMd(content);
	if (!parsed.ok) {
		throw new GrimoireNotFoundError(
			`Failed to parse SKILL.md for spell: ${path} — ${parsed.error}`,
		);
	}
	const sep = path.indexOf('/');
	const chapter = path.slice(0, sep);
	const name = path.slice(sep + 1);
	const absolutePath = `${DEMO_ROOT}/${path}`;
	const skillMdPath = `${absolutePath}/SKILL.md`;
	if (db) {
		logEvent(db, { spell: path, event: 'read' });
	}
	return {
		name,
		chapter,
		path,
		absolutePath,
		skillMdPath,
		description: parsed.frontmatter.description,
		body: parsed.body,
		bodyLines: countBodyLines(content),
		rank: 0,
		tier: tier(0),
		files: { scripts: [], references: [], assets: [] },
		frontmatter: parsed.frontmatter,
	};
}

export function demoDeleteSpell(store: VirtualSpellStore, path: string): void {
	if (!store.delete(path)) {
		throw new GrimoireNotFoundError(`Spell not found: ${path}`);
	}
}

export function demoCatalogue(
	store: VirtualSpellStore,
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
		const spells = store.discoverSpells();
		const ranks: Record<string, number> = {};
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

			const content = store.get(spell.path);
			if (!content) continue;

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

		const rankDistribution: Record<string, number> = { ...ranks };
		for (const s of spells) {
			if (rankDistribution[s.path] === undefined) rankDistribution[s.path] = 0;
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
