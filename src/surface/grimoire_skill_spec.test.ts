import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { validateInput } from '../surfaces/validate_input.ts';
import { grimoireTools } from '../tools/tool_registry.ts';
import { validateToolInput } from '../tools/validate_tool_input.ts';
import { grimoireCheatCommands } from './grimoire_cheat_sheet.ts';
import { grimoireCliOptions } from './grimoire_cli_options.ts';
import { grimoireSkillSpec } from './grimoire_skill_spec.ts';
import { renderGrimoireSkillCommand } from './render_grimoire_skill_command.ts';

test('skill has exactly one valid example per tool and a binary-first opening', () => {
	const rendered = renderSkillMarkdown(grimoireSkillSpec);
	const opening = rendered.split('## Without the binary')[0] ?? '';
	assert.doesNotMatch(opening, /npx|Node\.js 24/);
	for (const tool of grimoireSkillSpec.tools) {
		const examples = rendered
			.split('\n')
			.filter((line) => line.startsWith(`Example: \`ghostpaw-grimoire call ${tool.name} `));
		assert.equal(examples.length, 1, tool.name);
		assert.deepEqual(validateInput(tool.inputSchema, tool.example), [], tool.name);
		const original = grimoireTools.find((candidate) => candidate.name === tool.name);
		assert.ok(original);
		assert.equal(validateToolInput(original.inputSchema, tool.example), undefined, tool.name);
	}
});

test('skill command returns generated guides byte for byte and gives usage or typo recovery', () => {
	assert.equal(
		renderGrimoireSkillCommand([]),
		readFileSync(new URL('../../skills/grimoire/SKILL.md', import.meta.url), 'utf8'),
	);
	for (const workflow of grimoireSkillSpec.workflows) {
		assert.equal(
			renderGrimoireSkillCommand([workflow.name]),
			readFileSync(
				new URL(`../../skills/grimoire/references/${workflow.name}.md`, import.meta.url),
				'utf8',
			),
		);
		assert.ok(
			renderGrimoireSkillCommand(['--list']).includes(`${workflow.name}  ${workflow.description}`),
		);
	}
	assert.match(renderGrimoireSkillCommand(['--help']), /Usage: ghostpaw-grimoire skill/);
	assert.throws(
		() => renderGrimoireSkillCommand(['search-and-retreve-spells']),
		/did you mean search-and-retrieve-spells.*skill --list/,
	);
});

test('every cheat-sheet command parses through the real CLI without usage errors', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-cheat-'));
	const content = '---\nname: verify-release\ndescription: Verify release\n---\nBody\n';
	writeFileSync(join(dir, 'SKILL.md'), content);
	try {
		for (const command of grimoireCheatCommands) {
			const args = command.map((arg) =>
				arg === '@SKILL.md' || arg === '@-' ? `@${join(dir, 'SKILL.md')}` : arg,
			);
			let err = '';
			const sink = new Writable({
				write(_chunk, _encoding, cb) {
					cb();
				},
			});
			const code = await runToolCli(args, {
				...grimoireCliOptions,
				tools: grimoireCliOptions.tools.map((tool) => ({
					...tool,
					handler: (_ctx, input) => {
						assert.deepEqual(validateInput(tool.inputSchema, input), []);
						return { ok: true, outcome: 'success', data: {} };
					},
				})),
				openContext: () => ({ root: dir }),
				closeContext: () => {},
				stdin: Readable.from([JSON.stringify({ content })]),
				stdout: sink,
				stderr: new Writable({
					write(chunk, _encoding, cb) {
						err += String(chunk);
						cb();
					},
				}),
			});
			assert.equal(code, 0, `${args.join(' ')}: ${err}`);
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
