export function frontmatterWarnings(block: string): string[] {
	const warnings: string[] = [];
	let continuationIndent: number | undefined;
	let map = false;
	let quote: string | undefined;
	for (const line of block.split('\n')) {
		if (!line.trim() || line.trim().startsWith('#')) continue;
		const indent = line.match(/^\s*/)?.[0].length ?? 0;
		if (continuationIndent !== undefined && indent > continuationIndent) {
			if (quote && line.trimEnd().endsWith(quote)) quote = undefined;
			continue;
		}
		continuationIndent = undefined;
		if (quote) {
			warnings.push('Unterminated quoted frontmatter scalar');
			quote = undefined;
		}
		const match = /^(?:[\w-]+|"[^"]+"|'[^']+'):\s*(.*)$/.exec(line.trim());
		if (!match || (indent > 0 && !map)) {
			warnings.push(`Unparsed frontmatter line: ${line.trim()}`);
			continue;
		}
		const raw = match[1] ?? '';
		if (!indent) map = !raw;
		if (raw) continuationIndent = indent;
		if ((/^[>|]/.test(raw) && !/^[>|][+-]?$/.test(raw)) || /^[[\]{&*!]/.test(raw))
			warnings.push(`Unsupported frontmatter value: ${raw}`);
		if ((raw[0] === '"' || raw[0] === "'") && (raw.length === 1 || !raw.endsWith(raw[0])))
			quote = raw[0];
	}
	if (quote) warnings.push('Unterminated quoted frontmatter scalar');
	return warnings;
}
