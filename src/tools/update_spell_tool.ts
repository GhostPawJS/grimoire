import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GrimoireValidationError } from '../errors.ts';
import { assertSpellExists } from '../spells/assert_spell_exists.ts';
import { updateSpell } from '../spells/update_spell.ts';
import { spellWriteData } from './spell_write_data.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, objectSchema, stringSchema } from './tool_metadata.ts';
import { honeSpellToolName, updateSpellToolName } from './tool_names.ts';
import { inspectSpellNext, useToolNext } from './tool_next.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess } from './tool_types.ts';

type UpdateSpellInput = {
	strict?: boolean;
	path: string;
	content?: string;
	replace?: { old: string; with: string }[];
	appendSection?: { heading: string; body: string };
	verbose?: boolean;
};
type UpdateSpellData = ReturnType<typeof spellWriteData> & {
	commitHash?: string;
	rollbackHash?: string;
};

export const updateSpellTool = defineGrimoireTool<UpdateSpellInput, ToolResult<UpdateSpellData>>({
	name: updateSpellToolName,
	description: 'Write new content to an existing spell, leaving the change uncommitted.',
	whenToUse: 'Edit existing content, then seal with hone_spell.',
	whenNotToUse: 'Create with inscribe_spell; checkpoint with hone_spell.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		path: 'chapter/name',
		content: 'Full SKILL.md with YAML frontmatter and Markdown; inspect first.',
	},
	outputDescription: 'Uncommitted spell metadata; hone_spell seals edits.',
	inputSchema: objectSchema(
		{
			strict: {
				type: 'boolean',
				description: 'Reject invalid YAML and unknown frontmatter.',
			},
			path: stringSchema('Spell path'),
			verbose: { type: 'boolean', description: 'Include full spell.' },
			content: stringSchema('Full SKILL.md'),
			replace: {
				type: 'array',
				items: objectSchema(
					{ old: stringSchema('Exact text'), with: stringSchema('Replacement') },
					['old', 'with'],
				),
			},
			appendSection: objectSchema(
				{ heading: stringSchema('Heading'), body: stringSchema('Markdown') },
				['heading', 'body'],
			),
		},
		['path'],
	),
	handler(ctx, input) {
		try {
			if (
				input.content !== undefined &&
				(input.replace !== undefined || input.appendSection !== undefined)
			)
				throw new GrimoireValidationError('content conflicts with replace or appendSection');
			if (input.content === undefined && !input.replace?.length && !input.appendSection)
				throw new GrimoireValidationError('Provide content, replace, or appendSection');
			assertSpellExists(ctx.root, input.path);
			let content = input.content ?? readFileSync(join(ctx.root, input.path, 'SKILL.md'), 'utf8');
			for (const pair of input.replace ?? []) {
				const count = pair.old ? content.split(pair.old).length - 1 : content.length + 1;
				if (count !== 1)
					throw new GrimoireValidationError(
						`--replace text matched ${count} times${count > 1 ? '; make it unique' : ''}`,
					);
				content = content.replace(pair.old, () => pair.with);
			}
			if (input.appendSection) {
				const { heading, body } = input.appendSection;
				if (!heading.trim() || /[\r\n]/.test(heading))
					throw new GrimoireValidationError('Invalid section heading');
				if (content.split(/\r?\n/).some((line) => line === `## ${heading}`))
					throw new GrimoireValidationError(`Section already exists: ${heading}`);
				content = `${content.trimEnd()}\n\n## ${heading}\n\n${body}\n`;
			}
			updateSpell(ctx.root, input.path, content, {
				...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}),
				...(input.strict !== undefined ? { strict: input.strict } : {}),
			});
			return toolSuccess(
				`Updated spell \`${input.path}\`. Call hone_spell to seal and advance rank.`,
				{ ...spellWriteData(ctx, input.path, input.verbose), commit: '' },
				{
					next: [
						useToolNext(honeSpellToolName, 'Seal the update to advance spell rank.', {
							paths: [input.path],
						}),
						inspectSpellNext(input.path),
					],
				},
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
