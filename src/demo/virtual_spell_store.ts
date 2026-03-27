import type { DiscoveredSpell } from '../spells/discover_spells.ts';

/**
 * In-memory spell filesystem: keys are `chapter/spell-name` (SKILL.md body as value).
 */
export class VirtualSpellStore {
	private readonly files = new Map<string, string>();

	get(path: string): string | undefined {
		return this.files.get(path);
	}

	set(path: string, content: string): void {
		this.files.set(path, content);
	}

	has(path: string): boolean {
		return this.files.has(path);
	}

	delete(path: string): boolean {
		return this.files.delete(path);
	}

	clear(): void {
		this.files.clear();
	}

	/** Active spells (not under `.shelved/`). */
	listPaths(): string[] {
		return [...this.files.keys()].filter((p) => !p.startsWith('.shelved/'));
	}

	discoverSpells(): DiscoveredSpell[] {
		const results: DiscoveredSpell[] = [];
		for (const path of this.listPaths()) {
			const sep = path.indexOf('/');
			if (sep === -1) continue;
			const chapter = path.slice(0, sep);
			const name = path.slice(sep + 1);
			results.push({ name, chapter, path });
		}
		return results.sort((a, b) => a.path.localeCompare(b.path));
	}

	listChapters(): string[] {
		const chapters = new Set<string>();
		for (const s of this.discoverSpells()) {
			chapters.add(s.chapter);
		}
		return [...chapters].sort((a, b) => a.localeCompare(b));
	}

	shelve(path: string): string {
		const content = this.files.get(path);
		if (content === undefined) {
			throw new Error(`Spell not found: ${path}`);
		}
		this.files.delete(path);
		const shelvedKey = `.shelved/${path}`;
		this.files.set(shelvedKey, content);
		return shelvedKey;
	}

	unshelve(shelvedRelativePath: string): string {
		const key = `.shelved/${shelvedRelativePath}`;
		const content = this.files.get(key);
		if (content === undefined) {
			throw new Error(`Shelved spell not found: ${key}`);
		}
		this.files.delete(key);
		this.files.set(shelvedRelativePath, content);
		return shelvedRelativePath;
	}

	moveSpell(fromPath: string, toChapter: string): string {
		const sep = fromPath.indexOf('/');
		if (sep === -1) throw new Error(`Invalid path: ${fromPath}`);
		const name = fromPath.slice(sep + 1);
		const newPath = `${toChapter}/${name}`;
		const content = this.files.get(fromPath);
		if (content === undefined) {
			throw new Error(`Spell not found: ${fromPath}`);
		}
		this.files.delete(fromPath);
		this.files.set(newPath, content);
		return newPath;
	}

	seed(entries: ReadonlyArray<{ path: string; content: string }>): void {
		for (const e of entries) {
			this.files.set(e.path, e.content);
		}
	}
}
