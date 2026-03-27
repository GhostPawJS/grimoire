import type { IndexEntry } from './types.ts';

export function formatIndex(entries: IndexEntry[]): string {
	if (entries.length === 0) {
		return '## Grimoire\n\nYou have 0 spells.\n';
	}

	const lines = entries.map((e) => `- ${e.path} [${e.tier}]: ${e.description}`);

	return `## Grimoire\n\nYou have ${entries.length} spell${entries.length === 1 ? '' : 's'} — earned procedures from real experience.\n\n${lines.join('\n')}\n`;
}
