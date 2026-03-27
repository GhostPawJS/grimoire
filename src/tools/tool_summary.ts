export function summarizeCount(count: number, singular: string, plural = `${singular}s`): string {
	if (count === 1) return `Found 1 ${singular}.`;
	return `Found ${count} ${plural}.`;
}

export function summarizeSpellAction(action: string, path: string): string {
	return `${action.charAt(0).toUpperCase()}${action.slice(1)} spell \`${path}\`.`;
}
