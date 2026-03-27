import type { GrimoireDb } from './database.ts';
import { initDraftTables } from './drafts/init_draft_tables.ts';
import { initEventTables } from './events/init_event_tables.ts';
import { initHealthTables } from './health/init_health_tables.ts';
import { initNoteTables } from './notes/init_note_tables.ts';
import { initProvenanceTables } from './provenance/init_provenance_tables.ts';
import { initRegistryTables } from './registry/init_registry_tables.ts';

export function initGrimoireTables(db: GrimoireDb): void {
	initEventTables(db);
	initNoteTables(db);
	initHealthTables(db);
	initDraftTables(db);
	initProvenanceTables(db);
	initRegistryTables(db);
}
