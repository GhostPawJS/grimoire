import { resonance } from '../events/resonance.ts';
import type { ResonanceResult } from '../events/types.ts';
import { history } from '../git/history.ts';
import { tierInfo } from '../git/tier_info.ts';
import type { HistoryEntry, TierInfo } from '../git/types.ts';
import { getProvenance } from '../provenance/get_provenance.ts';
import type { Provenance } from '../provenance/types.ts';
import { getSpell } from '../spells/get_spell.ts';
import type { Spell } from '../spells/types.ts';
import type { SpellValidationResult } from '../validation/types.ts';
import { validate } from '../validation/validate.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, objectSchema, stringSchema } from './tool_metadata.ts';
import { inspectGrimoireItemToolName } from './tool_names.ts';
import { honeNext, manageSpellNext, reviewViewNext } from './tool_next.ts';
import { toProvenanceRef, toSpellRef } from './tool_ref.ts';
import type { ToolNextStepHint, ToolResult, ToolWarning } from './tool_types.ts';
import { toolSuccess, toolWarning } from './tool_types.ts';

type InspectInput = { path: string };

type InspectData = {
	spell: Spell;
	tierInfo: TierInfo;
	validation: SpellValidationResult;
	resonance?: ResonanceResult;
	provenance?: Provenance;
	history?: HistoryEntry[];
};

export const inspectGrimoireItemTool = defineGrimoireTool<InspectInput, ToolResult<InspectData>>({
	name: inspectGrimoireItemToolName,
	description:
		'Inspect a single spell in detail, including tier, resonance, validation, provenance, and history.',
	whenToUse: 'When you need full details about a specific spell by its path.',
	whenNotToUse: 'When you want a broad overview — use review_grimoire instead.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		path: 'The spell path (e.g. "chapter/spell-name").',
	},
	outputDescription:
		'Full spell details including tier info, resonance, validation, provenance, and git history.',
	inputSchema: objectSchema(
		{
			path: stringSchema('Spell path'),
		},
		['path'],
	),
	handler(ctx, input) {
		try {
			const spell = getSpell(ctx.root, input.path, ctx.db, ctx.gitDir);
			const ti = tierInfo(spell.rank);
			const validationResult = validate(ctx.root, input.path);

			const res = ctx.db ? resonance(ctx.db, input.path) : undefined;
			const prov = ctx.db ? getProvenance(ctx.db, input.path) : undefined;
			const hist = ctx.gitDir
				? history({ root: ctx.root, gitDir: ctx.gitDir }, input.path)
				: undefined;

			const data: InspectData = {
				spell,
				tierInfo: ti,
				validation: validationResult,
			};
			if (res !== undefined) {
				data.resonance = res;
			}
			if (prov !== undefined) {
				data.provenance = prov;
			}
			if (hist !== undefined && hist.length > 0) {
				data.history = hist;
			}

			const entities = [toSpellRef(spell)];
			if (prov !== undefined) {
				entities.push(toProvenanceRef(prov));
			}

			const next: ToolNextStepHint[] = [];
			if (spell.tier === 'Uncheckpointed') {
				next.push(honeNext([input.path]));
			}
			if (!validationResult.valid) {
				next.push(manageSpellNext('repair', input.path));
			}
			next.push(reviewViewNext('health'));

			const warnings: ToolWarning[] = [];
			if (!ctx.db) {
				warnings.push(
					toolWarning(
						'degraded_no_db',
						'Database not available; resonance and provenance data omitted.',
					),
				);
			}
			if (!ctx.gitDir) {
				warnings.push(
					toolWarning('degraded_no_git', 'Git directory not configured; history omitted.'),
				);
			}

			return toolSuccess(`Inspected spell \`${input.path}\` (${ti.tier}, rank ${ti.rank}).`, data, {
				entities,
				next,
				warnings,
			});
		} catch (error) {
			return translateToolError(error);
		}
	},
});
