import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TestSpellLayout {
	name: string;
	content?: string;
}

export interface TestChapterLayout {
	name: string;
	spells: TestSpellLayout[];
}

export interface TestRootLayout {
	chapters?: TestChapterLayout[];
}

function skillMd(name: string): string {
	return `---\nname: ${name}\ndescription: A test spell named ${name}\n---\n\n# ${name}\n\nBody content for ${name}.\n`;
}

export function createTestRoot(layout?: TestRootLayout): {
	root: string;
	cleanup: () => void;
} {
	const root = mkdtempSync(join(tmpdir(), 'grimoire-test-root-'));

	if (layout?.chapters) {
		for (const chapter of layout.chapters) {
			for (const spell of chapter.spells) {
				const spellDir = join(root, chapter.name, spell.name);
				mkdirSync(spellDir, { recursive: true });
				writeFileSync(join(spellDir, 'SKILL.md'), spell.content ?? skillMd(spell.name));
			}
		}
	}

	return {
		root,
		cleanup: () => rmSync(root, { recursive: true, force: true }),
	};
}
