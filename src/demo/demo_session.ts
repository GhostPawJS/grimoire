import type { GrimoireDb } from '../database.ts';
import { submitDraft } from '../drafts/submit_draft.ts';
import { logEvent } from '../events/log_event.ts';
import { initGrimoireTables } from '../init_grimoire_tables.ts';
import { dropNote } from '../notes/drop_note.ts';
import { recordProvenance } from '../provenance/record_provenance.ts';
import type { RegistrySource } from '../registry/types.ts';
import { upsertIndexEntry } from '../registry/upsert_index_entry.ts';
import { openBrowserGrimoireDb } from './browser_grimoire_db.ts';
import registrySnapshot from './demo_registry_snapshot.json' with { type: 'json' };
import seedSpells from './demo_seed_spell_content.json' with { type: 'json' };
import { VirtualSpellStore } from './virtual_spell_store.ts';

export type DemoSeedMode = 'blank' | 'seeded';

function seedRegistry(db: GrimoireDb): void {
	for (const row of registrySnapshot) {
		upsertIndexEntry(db, {
			source: row.source as RegistrySource,
			slug: row.slug,
			name: row.name,
			description: row.description,
			...(row.adoptionCount !== undefined ? { adoptionCount: row.adoptionCount } : {}),
			...(row.sourceRepo !== undefined && row.sourceRepo !== null
				? { sourceRepo: row.sourceRepo }
				: {}),
			...(row.sourcePath !== undefined && row.sourcePath !== null
				? { sourcePath: row.sourcePath }
				: {}),
			...(row.fetchUrl !== undefined ? { fetchUrl: row.fetchUrl } : {}),
		});
	}
}

function seedEventsAndNotes(db: GrimoireDb, store: VirtualSpellStore): void {
	const base = 1_700_000_000_000;
	let t = base;
	const paths = store.listPaths();
	for (const path of paths) {
		logEvent(db, { spell: path, event: 'read', now: t });
		t += 1000;
		logEvent(db, { spell: path, event: 'read', now: t });
		t += 1000;
	}
	logEvent(db, { spell: 'development/git-workflow', event: 'hone', now: t });
	t += 1;
	logEvent(db, { spell: 'development/typescript-patterns', event: 'seal', now: t });

	const notes: Array<{ source: string; content: string; domain?: string }> = [
		{ source: 'session', content: 'Add rollback section to git workflow.', domain: 'development' },
		{ source: 'session', content: 'CI should cache node_modules.', domain: 'devops' },
		{ source: 'review', content: 'Expand unit test examples with async cases.', domain: 'testing' },
		{
			source: 'pair',
			content: 'Spell descriptions should stay under 200 chars for cards.',
			domain: 'general',
		},
		{ source: 'ops', content: 'Dockerfile should use non-root user.', domain: 'devops' },
		{
			source: 'review',
			content: 'Link to PR template from code-review spell.',
			domain: 'development',
		},
		{ source: 'session', content: 'Integration tests need timeout guidance.', domain: 'testing' },
		{ source: 'pair', content: 'Consider adding a spell for API design.', domain: 'general' },
		{ source: 'ops', content: 'Document rollback for failed deploys.', domain: 'devops' },
		{ source: 'review', content: 'Add diagram for branch workflow.', domain: 'development' },
	];
	for (const n of notes) {
		dropNote(db, {
			source: n.source,
			content: n.content,
			...(n.domain !== undefined ? { domain: n.domain } : {}),
			now: t,
		});
		t += 1;
	}

	submitDraft(db, {
		title: 'api-error-handling',
		rationale: 'Distill common HTTP error patterns into a spell.',
		noteIds: [],
		chapter: 'development',
		now: t,
	});
	t += 1;
	submitDraft(db, {
		title: 'observability-basics',
		rationale: 'Metrics and logs for services.',
		noteIds: [],
		chapter: 'devops',
		now: t,
	});

	recordProvenance(db, {
		spellPath: 'development/git-workflow',
		sourceType: 'github',
		sourceRepo: 'ghostpawjs/grimoire',
		sourcePath: 'docs/HUMAN.md',
	});
	recordProvenance(db, {
		spellPath: 'devops/docker-deployment',
		sourceType: 'agentskillhub',
		sourceRepo: 'ghostpawjs/grimoire',
		sourcePath: 'docs/README.md',
	});
}

export async function createDemoSession(mode: DemoSeedMode): Promise<{
	db: GrimoireDb;
	store: VirtualSpellStore;
}> {
	const db = await openBrowserGrimoireDb();
	db.exec('PRAGMA foreign_keys = ON;');
	initGrimoireTables(db);
	const store = new VirtualSpellStore();
	if (mode === 'seeded') {
		store.seed(seedSpells);
		seedEventsAndNotes(db, store);
		seedRegistry(db);
	}
	return { db, store };
}
