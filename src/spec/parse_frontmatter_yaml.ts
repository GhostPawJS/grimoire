export function parseFrontmatterYaml(yamlBlock: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const lines = yamlBlock.split('\n');
	let currentMapKey: string | undefined;
	let currentMap: Record<string, string> | undefined;

	for (const line of lines) {
		if (line.trim() === '' || line.trim().startsWith('#')) {
			continue;
		}

		const indented = line.startsWith('  ') || line.startsWith('\t');

		if (indented && currentMapKey !== undefined && currentMap !== undefined) {
			const trimmed = line.trim();
			const colonIdx = trimmed.indexOf(':');
			if (colonIdx === -1) {
				continue;
			}
			const key = trimmed.slice(0, colonIdx).trim();
			const value = trimmed.slice(colonIdx + 1).trim();
			currentMap[key] = stripQuotes(value);
			continue;
		}

		if (currentMapKey !== undefined && currentMap !== undefined) {
			result[currentMapKey] = currentMap;
			currentMapKey = undefined;
			currentMap = undefined;
		}

		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) {
			continue;
		}

		const key = line.slice(0, colonIdx).trim();
		const rawValue = line.slice(colonIdx + 1);

		if (rawValue.trim() === '') {
			currentMapKey = key;
			currentMap = {};
			continue;
		}

		const value = rawValue.trim();
		result[key] = parseScalar(value);
	}

	if (currentMapKey !== undefined && currentMap !== undefined) {
		result[currentMapKey] = currentMap;
	}

	return result;
}

function stripQuotes(value: string): string {
	if (
		(value.startsWith("'") && value.endsWith("'")) ||
		(value.startsWith('"') && value.endsWith('"'))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function parseScalar(value: string): string | boolean {
	if (value === 'true') {
		return true;
	}
	if (value === 'false') {
		return false;
	}
	return stripQuotes(value);
}
