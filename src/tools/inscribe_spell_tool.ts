import { history } from '../git/history.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { inscribe } from '../spells/inscribe.ts';
import type { DuplicationWarning, Spell } from '../spells/types.ts';
import { sharedGitWarning } from './shared_git_warning.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, objectSchema, stringSchema } from './tool_metadata.ts';
import { inscribeSpellToolName } from './tool_names.ts';
import { inspectSpellNext, searchNext } from './tool_next.ts';
import { toSpellRef } from './tool_ref.ts';
import type { ToolResult } from './tool_types.ts';
import { toolFailure, toolNoOp, toolSuccess, toolWarning } from './tool_types.ts';

type InscribeToolInput = {
	name: string;
	strict?: boolean;
	content: string;
	chapter?: string;
	force?: boolean;
	verbose?: boolean;
};
type InscribeToolData = {
	path: string;
	chapter: string;
	name: string;
	strict?: boolean;
	rank: number;
	tier: string;
	commit?: string;
	commitHash?: string;
	rollbackHash?: string;
	spell?: Spell;
	warnings: DuplicationWarning[];
};

export const inscribeSpellTool = defineGrimoireTool<
	InscribeToolInput,
	ToolResult<InscribeToolData>
>({
	name: inscribeSpellToolName,
	description: 'Create a spell from SKILL.md content (YAML frontmatter and Markdown).',
	whenToUse: 'Create a spell.',
	whenNotToUse: 'Edit with update_spell, then seal with hone_spell.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		force: 'Overwrite the target spell.',
		name: 'Spell name in kebab-case.',
		content: 'Full SKILL.md content.',
		chapter: 'Chapter; defaults to general.',
	},
	outputDescription: 'Spell metadata and duplication warnings; verbose adds content.',
	inputSchema: objectSchema(
		{
			strict: {
				type: 'boolean',
				description: 'Reject invalid YAML and unknown frontmatter.',
			},
			name: { ...stringSchema('Spell name'), pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 64 },
			content: stringSchema('Spell body content in markdown'),
			chapter: {
				...stringSchema('Chapter name'),
				pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
				maxLength: 64,
			},
			verbose: { type: 'boolean', description: 'Include full spell.' },
			force: {
				type: 'boolean',
				description: 'Overwrite the target spell.',
			},
		},
		['name', 'content'],
	),
	handler(ctx, input) {
		try {
			const parsed = parseSkillMd(input.content);
			if (parsed.ok && parsed.frontmatter.name !== input.name)
				return toolFailure(
					'protocol',
					'invalid_input',
					'Spell name differs from frontmatter.',
					'Frontmatter name must match name.',
					{ recovery: 'Change name or the frontmatter name so they match.' },
				);
			const result = inscribe(ctx.root, ctx.db, {
				...(input.force !== undefined ? { force: input.force } : {}),
				...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}),
				...(input.strict !== undefined ? { strict: input.strict } : {}),
				name: input.name,
				content: input.content,
				...(input.chapter !== undefined ? { chapter: input.chapter } : {}),
			});
			const entities = [toSpellRef(result.spell)];
			const next = [inspectSpellNext(result.spell.path, result.spell.name)];
			const warnings = [
				...sharedGitWarning(ctx),
				...result.warnings.map((w) =>
					toolWarning(
						'duplication_detected',
						`Similar spell exists at "${w.existingPath}" (${Math.round(w.similarity * 100)}% similar).`,
					),
				),
			];
			if (warnings.length > 0) {
				next.push(searchNext(input.name, 'Search for potentially duplicate spells.'));
			}
			return (result.noOp ? toolNoOp : toolSuccess)(
				result.noOp
					? `Spell \`${result.spell.path}\` is unchanged.`
					: `Inscribed spell \`${result.spell.path}\`.`,
				{
					path: result.spell.path,
					chapter: result.spell.chapter,
					name: result.spell.name,
					rank: result.spell.rank,
					tier: result.spell.tier,
					commit:
						history(
							{ root: ctx.root, ...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}) },
							result.spell.path,
						)[0]?.hash.slice(0, 8) ?? '',
					...(input.verbose ? { spell: result.spell } : {}),
					warnings: result.warnings,
				},
				{ entities, next, warnings },
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
