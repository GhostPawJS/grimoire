import { rmSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { deleteProvenance } from '../provenance/delete_provenance.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

export function deleteSpell(root: string, path: string, db?: GrimoireDb): void {
	assertSpellExists(root, path);
	const absolutePath = join(root, path);
	rmSync(absolutePath, { recursive: true, force: true });

	if (db) {
		try {
			deleteProvenance(db, path);
		} catch {
			// Provenance may not exist; ignore.
		}
	}
}
