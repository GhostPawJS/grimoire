import { grimoireSkills } from '../skills/skill_registry.ts';
import { CliUsageError } from '../surfaces/cli_args.ts';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { grimoireSkillSpec } from './grimoire_skill_spec.ts';

export function renderGrimoireSkillCommand(args: string[]): string {
	if (!args.length) return renderSkillMarkdown(grimoireSkillSpec);
	if (args.length === 1 && ['--help', '-h'].includes(args[0] ?? ''))
		return 'Usage: ghostpaw-grimoire skill\n       ghostpaw-grimoire skill --list\n       ghostpaw-grimoire skill <guide>\n';
	if (args.length === 1 && args[0] === '--list')
		return `${grimoireSkills.map((guide) => `${guide.name}  ${guide.description}`).join('\n')}\n`;
	const guide = grimoireSkills.find((guide) => guide.name === args[0]);
	if (guide && args.length === 1) return guide.content;
	const name = args[0] ?? '';
	const distance = (candidate: string) => {
		let row = Array.from({ length: name.length + 1 }, (_, i) => i);
		for (const [i, char] of [...candidate].entries()) {
			const next = [i + 1];
			for (let j = 0; j < name.length; j++)
				next.push(
					Math.min(
						(next[j] ?? 0) + 1,
						(row[j + 1] ?? 0) + 1,
						(row[j] ?? 0) + (char === name[j] ? 0 : 1),
					),
				);
			row = next;
		}
		return row[name.length] ?? 0;
	};
	const closest = [...grimoireSkills].sort((a, b) => distance(a.name) - distance(b.name))[0];
	throw new CliUsageError(
		`Unknown guide: ${name}; did you mean ${closest?.name}? See ghostpaw-grimoire skill --list.`,
	);
}
