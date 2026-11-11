import type { GrimoireDb } from '../database.ts';
import { mapHealthRow } from './map_health_row.ts';
import type { CatalogueSnapshot, CatalogueSnapshotRow } from './types.ts';

export function readCatalogue(db: GrimoireDb): CatalogueSnapshot | undefined {
	const row = db
		.prepare('SELECT * FROM grimoire_health ORDER BY id DESC LIMIT 1')
		.get<CatalogueSnapshotRow>();
	return row ? mapHealthRow(row) : undefined;
}
