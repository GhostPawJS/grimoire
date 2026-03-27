export function normalizeNoteContent(content: string): string {
	return content.trim().replace(/\s+/g, ' ');
}
