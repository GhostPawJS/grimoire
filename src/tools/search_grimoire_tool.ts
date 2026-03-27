import { buildIndex } from '../indexing/build_index.ts';
import type { IndexEntry } from '../indexing/types.ts';
import { translateToolError } from './tool_errors.ts';
import { arraySchema, defineGrimoireTool, objectSchema, stringSchema } from './tool_metadata.ts';
import { searchGrimoireToolName } from './tool_names.ts';
import { inspectSpellNext, reviewViewNext } from './tool_next.ts';
import { toIndexEntryRef } from './tool_ref.ts';
import { summarizeCount } from './tool_summary.ts';
import type { ToolResult, ToolWarning } from './tool_types.ts';
import { toolSuccess, toolWarning } from './tool_types.ts';

type SearchInput = { query: string; chapters?: string[] };
type SearchData = { results: IndexEntry[]; count: number };

export const searchGrimoireTool = defineGrimoireTool<SearchInput, ToolResult<SearchData>>({
	name: searchGrimoireToolName,
	description: 'Search the grimoire for spells by name or description.',
	whenToUse: 'When looking for spells matching a keyword, topic, or partial name.',
	whenNotToUse: 'When you already know the exact spell path — use inspect_grimoire_item instead.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		query:
			'Search query to match against spell names and descriptions (case-insensitive substring).',
		chapters: 'Optional list of chapters to restrict the search to.',
	},
	outputDescription: 'Matching spells with path, chapter, name, tier, rank, and description.',
	inputSchema: objectSchema(
		{
			query: stringSchema('Search query'),
			chapters: arraySchema(stringSchema('Chapter name'), 'Chapters to filter by'),
		},
		['query'],
	),
	handler(ctx, input) {
		try {
			const entries = buildIndex(
				ctx.root,
				input.chapters ? { chapters: input.chapters } : undefined,
			);
			const q = input.query.toLowerCase();
			const results = entries.filter(
				(e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
			);
			const entities = results.slice(0, 10).map(toIndexEntryRef);
			const next =
				results.length > 0
					? results.slice(0, 3).map((r) => inspectSpellNext(r.path, r.name))
					: [reviewViewNext('chapters')];
			const warnings: ToolWarning[] = [];
			if (results.length === 0) {
				warnings.push(toolWarning('empty_result', `No spells matched query "${input.query}".`));
			}
			return toolSuccess(
				summarizeCount(results.length, 'spell'),
				{ results, count: results.length },
				{ entities, next, warnings },
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
