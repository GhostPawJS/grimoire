import { catalogue } from '../catalogue/catalogue.ts';
import type { CatalogueSnapshot } from '../health/types.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, integerSchema, objectSchema } from './tool_metadata.ts';
import { inscribeSpellToolName, runCatalogueToolName } from './tool_names.ts';
import { manageSpellNext, reviewViewNext, useToolNext } from './tool_next.ts';
import { toSpellPathRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolNextStepHint, ToolResult } from './tool_types.ts';
import { toolFailure, toolSuccess } from './tool_types.ts';

type CatalogueInput = { now?: number };

export const runCatalogueTool = defineGrimoireTool<CatalogueInput, ToolResult<CatalogueSnapshot>>({
	name: runCatalogueToolName,
	description:
		'Run the full catalogue maintenance pass — detect stale/dormant/oversized spells, route notes, cluster orphans, compute health.',
	whenToUse: 'Periodically or after dropping many notes to process and analyze grimoire health.',
	whenNotToUse: 'When just reading health data — use review_grimoire with view "health" instead.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell', 'note', 'cluster'],
	inputDescriptions: {
		now: 'Optional timestamp override (milliseconds since epoch) for staleness calculations.',
	},
	outputDescription:
		'Full catalogue snapshot: stale/dormant/oversized spells, note routing results, orphan clusters, chapter balance, spell health scores.',
	inputSchema: objectSchema({ now: integerSchema('Timestamp override (ms)') }, []),
	handler(ctx, input) {
		if (!ctx.db) {
			return toolFailure(
				'system',
				'system_error',
				'Cannot run catalogue without a database.',
				'No database connection available.',
				{ recovery: 'Initialize grimoire with a database to use catalogue.' },
			);
		}
		try {
			const snapshot = catalogue(
				ctx.root,
				ctx.db,
				input.now !== undefined ? { now: input.now } : undefined,
			);
			const entities: ToolEntityRef[] = [];
			const next: ToolNextStepHint[] = [];
			for (const p of snapshot.dormantSpells.slice(0, 3)) {
				entities.push(toSpellPathRef(p));
				next.push(manageSpellNext('shelve', p));
			}
			const topCluster = snapshot.orphanClusters[0];
			if (topCluster && topCluster.suggestedTerms.length > 0) {
				next.push(
					useToolNext(
						inscribeSpellToolName,
						`Consider inscribing a spell for "${topCluster.suggestedTerms[0]}".`,
						{ name: topCluster.suggestedTerms[0] ?? '' },
					),
				);
			}
			next.push(reviewViewNext('health'));
			return toolSuccess(
				`Catalogue complete: ${snapshot.totalSpells} spells, ${snapshot.notesRouted} notes routed, ${snapshot.orphanClusters.length} orphan cluster(s).`,
				snapshot,
				{ entities, next },
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
