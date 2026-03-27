import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { logEvent } from '../events/log_event.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

export function getContent(root: string, path: string, db?: GrimoireDb): string {
	assertSpellExists(root, path);

	const skillMdPath = join(root, path, 'SKILL.md');
	const content = readFileSync(skillMdPath, 'utf-8');

	if (db) {
		logEvent(db, { spell: path, event: 'read' });
	}

	return content;
}
