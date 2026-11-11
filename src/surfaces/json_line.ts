export function jsonLine(value: unknown, compact = false): string {
	return `${JSON.stringify(value, null, compact ? undefined : 2)}\n`;
}
