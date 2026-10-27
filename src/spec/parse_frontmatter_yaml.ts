export function parseFrontmatterYaml(yamlBlock: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const lines = yamlBlock.replace(/\r/g, '').split('\n');
	let currentMap: Record<string, string> | undefined;
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index] ?? '';
		if (!line.trim() || line.trim().startsWith('#')) continue;
		const indented = /^\s/.test(line);
		const colon = line.indexOf(':');
		if (colon < 0) continue;
		const key = stripQuotes(line.slice(0, colon).trim());
		const raw = line.slice(colon + 1).trim();
		if (!indented) currentMap = undefined;
		if (!raw && !indented) {
			currentMap = {};
			result[key] = currentMap;
			continue;
		}
		const parentIndent = line.match(/^\s*/)?.[0].length ?? 0;
		let value: string | boolean;
		if (/^[>|][+-]?$/.test(raw)) {
			const block: string[] = [];
			while (index + 1 < lines.length) {
				const next = lines[index + 1] ?? '';
				if (next.trim() && (next.match(/^\s*/)?.[0].length ?? 0) <= parentIndent) break;
				block.push(next);
				index++;
			}
			const indent = Math.min(
				...block.filter((l) => l.trim()).map((l) => l.match(/^\s*/)?.[0].length ?? 0),
			);
			const text = block.map((l) => (l.trim() ? l.slice(indent) : ''));
			let scalar = '';
			for (let i = 0; i < text.length; i++) {
				const current = text[i] ?? '';
				const next = text[i + 1];
				scalar += current;
				if (i === text.length - 1) scalar += '\n';
				else if (raw[0] === '|' || /^\s/.test(current) || /^\s/.test(next ?? '')) scalar += '\n';
				else if (current && next) scalar += ' ';
				else if (current || !next) scalar += '\n';
			}
			value = raw.endsWith('-')
				? scalar.replace(/\n+$/, '')
				: raw.endsWith('+')
					? scalar
					: scalar.replace(/\n*$/, scalar ? '\n' : '');
		} else {
			let continued = raw;
			while (index + 1 < lines.length) {
				const next = lines[index + 1] ?? '';
				if (!next.trim() || (next.match(/^\s*/)?.[0].length ?? 0) <= parentIndent) break;
				continued += ` ${next.trim()}`;
				index++;
			}
			value = indented ? stripQuotes(continued) : parseScalar(continued);
		}
		if (indented && currentMap) currentMap[key] = String(value);
		else result[key] = value;
	}
	return result;
}

function stripQuotes(value: string): string {
	if (value.startsWith('"') && value.endsWith('"')) {
		try {
			return JSON.parse(value) as string;
		} catch {
			return value.slice(1, -1);
		}
	}
	if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
	return value;
}

function parseScalar(value: string): string | boolean {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return stripQuotes(value);
}
