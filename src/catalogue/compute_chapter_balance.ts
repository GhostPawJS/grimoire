import type { ChapterBalance } from './types.ts';

export function computeChapterBalance(
	spellsByChapter: Map<string, number>,
	notesByChapter: Map<string, number>,
): ChapterBalance[] {
	const chapters = new Set([...spellsByChapter.keys(), ...notesByChapter.keys()]);
	const result: ChapterBalance[] = [];

	for (const chapter of chapters) {
		const spellCount = spellsByChapter.get(chapter) ?? 0;
		const pendingNotes = notesByChapter.get(chapter) ?? 0;
		const noteLoadRatio = spellCount > 0 ? pendingNotes / spellCount : 0;

		result.push({ chapter, spellCount, pendingNotes, noteLoadRatio });
	}

	return result.sort((a, b) => a.chapter.localeCompare(b.chapter));
}
