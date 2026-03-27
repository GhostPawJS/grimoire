import { pendingDrafts } from '../drafts/pending_drafts.ts';
import { allResonance } from '../events/all_resonance.ts';
import { readCatalogue } from '../health/read_catalogue.ts';
import { buildIndex } from '../indexing/build_index.ts';
import { formatIndex } from '../indexing/format_index.ts';
import { noteCounts } from '../notes/note_counts.ts';
import { pendingNoteCount } from '../notes/pending_note_count.ts';
import { pendingNotes } from '../notes/pending_notes.ts';
import { allProvenance } from '../provenance/all_provenance.ts';
import { listChapters } from '../spells/list_chapters.ts';
import { listSpells } from '../spells/list_spells.ts';
import { validateAll } from '../validation/validate_all.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, enumSchema, integerSchema, objectSchema } from './tool_metadata.ts';
import { reviewGrimoireToolName } from './tool_names.ts';
import { catalogueNext, inspectSpellNext, manageSpellNext, reviewViewNext } from './tool_next.ts';
import {
	toDraftRef,
	toIndexEntryRef,
	toNoteRef,
	toProvenanceRef,
	toSpellPathRef,
	toSpellRef,
} from './tool_ref.ts';
import { summarizeCount } from './tool_summary.ts';
import type { ToolResult } from './tool_types.ts';
import { toolFailure, toolSuccess, toolWarning } from './tool_types.ts';

type ReviewView =
	| 'chapters'
	| 'health'
	| 'resonance'
	| 'notes'
	| 'drafts'
	| 'validation'
	| 'provenance'
	| 'index';
type ReviewInput = { view: ReviewView; limit?: number; now?: number };

function dbRequiredFailure(view: string) {
	return toolFailure(
		'system',
		'invalid_state',
		`The "${view}" view requires a database.`,
		'Database is not available.',
		{ warnings: [toolWarning('degraded_no_db', 'No database configured.')] },
	);
}

export const reviewGrimoireTool = defineGrimoireTool<
	ReviewInput,
	ToolResult<Record<string, unknown>>
>({
	name: reviewGrimoireToolName,
	description:
		'Review a dashboard view of the grimoire — chapters, health, resonance, notes, drafts, validation, provenance, or index.',
	whenToUse: 'When you need a broad overview of grimoire state from a specific angle.',
	whenNotToUse: 'When you need details about a single spell — use inspect_grimoire_item instead.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: false,
	targetKinds: ['spell', 'note', 'draft', 'provenance'],
	inputDescriptions: {
		view: 'Which dashboard view to display.',
		limit: 'Maximum number of items to return.',
		now: 'Timestamp override for time-based calculations.',
	},
	outputDescription: 'View-specific data snapshot of the grimoire.',
	inputSchema: objectSchema(
		{
			view: enumSchema('Review view', [
				'chapters',
				'health',
				'resonance',
				'notes',
				'drafts',
				'validation',
				'provenance',
				'index',
			]),
			limit: integerSchema('Maximum results to return'),
			now: integerSchema('Timestamp override'),
		},
		['view'],
	),
	handler(ctx, input) {
		try {
			const limit = input.limit;

			switch (input.view) {
				case 'chapters': {
					const chapters = listChapters(ctx.root);
					const spells = listSpells(ctx.root);
					const counts: Record<string, number> = {};
					for (const ch of chapters) {
						counts[ch] = spells.filter((s) => s.chapter === ch).length;
					}
					const entities = spells.slice(0, 10).map(toSpellRef);
					return toolSuccess(
						`Found ${chapters.length} chapter${chapters.length === 1 ? '' : 's'} with ${spells.length} spell${spells.length === 1 ? '' : 's'}.`,
						{ chapters: counts, totalSpells: spells.length },
						{ entities, next: [reviewViewNext('index')] },
					);
				}

				case 'health': {
					if (!ctx.db) return dbRequiredFailure('health');
					const snapshot = readCatalogue(ctx.db);
					if (!snapshot) {
						return toolSuccess(
							'No catalogue data available.',
							{ snapshot: null },
							{
								warnings: [
									toolWarning('empty_result', 'No catalogue snapshot. Run the catalogue first.'),
								],
								next: [catalogueNext()],
							},
						);
					}
					return toolSuccess(
						`Catalogue snapshot from ${snapshot.computedAt}: ${snapshot.totalSpells} spell${snapshot.totalSpells === 1 ? '' : 's'}.`,
						{ snapshot },
						{ next: [catalogueNext()] },
					);
				}

				case 'resonance': {
					if (!ctx.db) return dbRequiredFailure('resonance');
					const resOptions = input.now !== undefined ? { now: input.now } : undefined;
					const all = allResonance(ctx.db, resOptions);
					const sorted = Object.entries(all).sort(
						([, a], [, b]) => b.weightedReads - a.weightedReads,
					);
					const limited = limit !== undefined ? sorted.slice(0, limit) : sorted;
					const entities = limited.slice(0, 10).map(([path]) => toSpellPathRef(path));
					const first = limited[0];
					const next = first ? [inspectSpellNext(first[0])] : [];
					return toolSuccess(
						`Resonance data for ${sorted.length} spell${sorted.length === 1 ? '' : 's'}.`,
						{ resonance: Object.fromEntries(limited), totalSpells: sorted.length },
						{ entities, next },
					);
				}

				case 'notes': {
					if (!ctx.db) return dbRequiredFailure('notes');
					const notes = pendingNotes(ctx.db);
					const count = pendingNoteCount(ctx.db);
					const counts = noteCounts(ctx.db);
					const limited = limit !== undefined ? notes.slice(0, limit) : notes;
					const entities = limited.slice(0, 10).map(toNoteRef);
					return toolSuccess(
						`${count} pending note${count === 1 ? '' : 's'} across ${counts.length} source${counts.length === 1 ? '' : 's'}.`,
						{ notes: limited, pendingCount: count, countsBySource: counts },
						{ entities, next: [reviewViewNext('drafts')] },
					);
				}

				case 'drafts': {
					if (!ctx.db) return dbRequiredFailure('drafts');
					const drafts = pendingDrafts(ctx.db);
					const limited = limit !== undefined ? drafts.slice(0, limit) : drafts;
					const entities = limited.slice(0, 10).map(toDraftRef);
					return toolSuccess(
						`${drafts.length} pending draft${drafts.length === 1 ? '' : 's'}.`,
						{ drafts: limited, totalDrafts: drafts.length },
						{ entities },
					);
				}

				case 'validation': {
					const results = validateAll(ctx.root);
					const invalid = results.filter((r) => !r.valid);
					const limited = limit !== undefined ? results.slice(0, limit) : results;
					const entities = invalid.slice(0, 10).map((r) => toSpellPathRef(r.path));
					const firstInvalid = invalid[0];
					const next = firstInvalid ? [manageSpellNext('repair', firstInvalid.path)] : [];
					return toolSuccess(
						`Validated ${results.length} spell${results.length === 1 ? '' : 's'}; ${invalid.length} with issues.`,
						{ results: limited, invalidCount: invalid.length },
						{ entities, next },
					);
				}

				case 'provenance': {
					if (!ctx.db) return dbRequiredFailure('provenance');
					const records = allProvenance(ctx.db);
					const limited = limit !== undefined ? records.slice(0, limit) : records;
					const entities = limited.slice(0, 10).map(toProvenanceRef);
					const first = limited[0];
					const next = first ? [inspectSpellNext(first.spellPath)] : [];
					return toolSuccess(
						summarizeCount(records.length, 'provenance record'),
						{ provenance: limited, totalRecords: records.length },
						{ entities, next },
					);
				}

				case 'index': {
					const entries = buildIndex(ctx.root);
					const formatted = formatIndex(entries);
					const limited = limit !== undefined ? entries.slice(0, limit) : entries;
					const entities = limited.slice(0, 10).map(toIndexEntryRef);
					const first = limited[0];
					const next = first ? [inspectSpellNext(first.path, first.name)] : [];
					return toolSuccess(
						`Grimoire index with ${entries.length} spell${entries.length === 1 ? '' : 's'}.`,
						{ entries: limited, formatted, totalEntries: entries.length },
						{ entities, next },
					);
				}

				default: {
					const _exhaustive: never = input.view;
					return toolFailure(
						'protocol',
						'invalid_input',
						`Unknown view: ${_exhaustive as string}`,
						`The view "${_exhaustive as string}" is not recognized.`,
					);
				}
			}
		} catch (error) {
			return translateToolError(error);
		}
	},
});
