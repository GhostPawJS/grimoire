import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { SpellFiles } from './types.ts';

const SUBDIRS = ['scripts', 'references', 'assets'] as const;

export function scanSpellDir(absolutePath: string): SpellFiles {
	const files: SpellFiles = { scripts: [], references: [], assets: [] };

	for (const subdir of SUBDIRS) {
		const dirPath = join(absolutePath, subdir);
		if (!existsSync(dirPath)) continue;

		const entries = readdirSync(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isFile()) {
				files[subdir].push(join(dirPath, entry.name));
			}
		}
	}

	return files;
}
