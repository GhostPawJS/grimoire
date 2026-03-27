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
	const now = Date.now();
	const DAY = 86_400_000;
	const HOUR = 3_600_000;

	const paths = store.listPaths().filter((p) => !p.startsWith('.shelved/'));

	// --- Events: spread reads to produce varied resonance colours ---
	// orange (>=6 weighted reads): heavily used spells with many recent reads
	const hotSpells = ['development/git-workflow', 'security/jwt-auth', 'data/postgres-indexing'];
	for (const spell of hotSpells) {
		for (let i = 0; i < 10; i++) {
			logEvent(db, { spell, event: 'read', now: now - i * 4 * HOUR });
		}
	}

	// yellow (3-6 weighted reads): moderately active spells
	const warmSpells = ['devops/ci-pipeline', 'testing/e2e-playwright', 'ai/prompt-engineering'];
	for (const spell of warmSpells) {
		for (let i = 0; i < 5; i++) {
			logEvent(db, { spell, event: 'read', now: now - i * DAY - 2 * HOUR });
		}
	}

	// green (1-3 weighted reads): lightly touched spells
	const coolSpells = [
		'development/code-review',
		'devops/docker-multi-stage',
		'testing/unit-testing',
		'data/redis-caching',
		'general/documentation',
	];
	for (const spell of coolSpells) {
		logEvent(db, { spell, event: 'read', now: now - 5 * DAY });
		logEvent(db, { spell, event: 'read', now: now - 12 * DAY });
	}

	// grey (<1 weighted read): dormant/untouched -- remaining spells get no reads or very old ones
	const touchedSet = new Set([...hotSpells, ...warmSpells, ...coolSpells]);
	for (const path of paths) {
		if (!touchedSet.has(path)) {
			logEvent(db, { spell: path, event: 'read', now: now - 120 * DAY });
		}
	}

	// --- Lifecycle events: inscribe, hone, seal, adopt, shelve, unshelve, move ---
	logEvent(db, { spell: 'development/git-workflow', event: 'inscribe', now: now - 60 * DAY });
	logEvent(db, { spell: 'development/git-workflow', event: 'hone', now: now - 30 * DAY });
	logEvent(db, { spell: 'development/git-workflow', event: 'seal', now: now - 28 * DAY });
	logEvent(db, { spell: 'development/git-workflow', event: 'hone', now: now - 2 * DAY });

	logEvent(db, { spell: 'security/jwt-auth', event: 'inscribe', now: now - 45 * DAY });
	logEvent(db, { spell: 'security/jwt-auth', event: 'seal', now: now - 40 * DAY });
	logEvent(db, { spell: 'security/jwt-auth', event: 'hone', now: now - 10 * DAY });

	logEvent(db, { spell: 'devops/ci-pipeline', event: 'inscribe', now: now - 55 * DAY });
	logEvent(db, { spell: 'devops/ci-pipeline', event: 'seal', now: now - 50 * DAY });

	logEvent(db, { spell: 'ai/rag-pipeline', event: 'adopt', now: now - 20 * DAY });
	logEvent(db, { spell: 'ai/mcp-server', event: 'adopt', now: now - 15 * DAY });

	logEvent(db, { spell: 'devops/kubernetes-pods', event: 'inscribe', now: now - 70 * DAY });
	logEvent(db, { spell: 'devops/kubernetes-pods', event: 'shelve', now: now - 35 * DAY });
	logEvent(db, { spell: 'devops/kubernetes-pods', event: 'unshelve', now: now - 10 * DAY });

	logEvent(db, { spell: 'testing/integration-testing', event: 'inscribe', now: now - 40 * DAY });
	logEvent(db, { spell: 'testing/integration-testing', event: 'move', now: now - 25 * DAY });

	logEvent(db, { spell: 'data/database-migrations', event: 'inscribe', now: now - 50 * DAY });
	logEvent(db, { spell: 'data/database-migrations', event: 'hone', now: now - 8 * DAY });

	logEvent(db, { spell: 'general/incident-response', event: 'inscribe', now: now - 30 * DAY });
	logEvent(db, { spell: 'general/incident-response', event: 'seal', now: now - 22 * DAY });

	logEvent(db, { spell: 'development/api-design', event: 'inscribe', now: now - 25 * DAY });
	logEvent(db, { spell: 'development/typescript-strict', event: 'inscribe', now: now - 35 * DAY });
	logEvent(db, { spell: 'development/typescript-strict', event: 'hone', now: now - 5 * DAY });

	logEvent(db, { spell: 'security/secrets-management', event: 'inscribe', now: now - 42 * DAY });
	logEvent(db, { spell: 'security/dependency-audit', event: 'inscribe', now: now - 38 * DAY });

	// --- Shelve 2 spells ---
	store.shelve('devops/terraform-modules');
	logEvent(db, { spell: 'devops/terraform-modules', event: 'shelve', now: now - 14 * DAY });

	store.shelve('security/dependency-audit');
	logEvent(db, { spell: 'security/dependency-audit', event: 'shelve', now: now - 7 * DAY });

	// --- Notes: 25 notes across all domains, varied sources ---
	const notes: Array<{ source: string; content: string; domain?: string }> = [
		{
			source: 'session',
			content: 'Add rollback section to git workflow spell.',
			domain: 'development',
		},
		{
			source: 'session',
			content: 'CI cache should key on lockfile hash, not branch name.',
			domain: 'devops',
		},
		{
			source: 'review',
			content: 'Expand unit test examples with async/await edge cases.',
			domain: 'testing',
		},
		{
			source: 'pair',
			content: 'Spell descriptions should stay under 200 chars for card layout.',
			domain: 'general',
		},
		{
			source: 'ops',
			content: 'Dockerfile should always use non-root USER directive.',
			domain: 'devops',
		},
		{
			source: 'review',
			content: 'Link to PR template from the code-review spell body.',
			domain: 'development',
		},
		{
			source: 'session',
			content: 'Integration tests need guidance on timeouts for slow CI runners.',
			domain: 'testing',
		},
		{
			source: 'pair',
			content: 'Consider splitting api-design spell into REST and GraphQL halves.',
			domain: 'development',
		},
		{
			source: 'ops',
			content: 'Document rollback procedure when Helm release fails mid-deploy.',
			domain: 'devops',
		},
		{
			source: 'review',
			content: 'Add sequence diagram for the JWT refresh rotation flow.',
			domain: 'security',
		},
		{
			source: 'agent',
			content: 'Prompt engineering spell should mention structured output schemas.',
			domain: 'ai',
		},
		{
			source: 'session',
			content: 'Redis caching spell is missing stampede protection pattern.',
			domain: 'data',
		},
		{
			source: 'agent',
			content: 'RAG pipeline needs a section on metadata filtering at retrieval time.',
			domain: 'ai',
		},
		{
			source: 'ops',
			content: 'Kubernetes liveness probe should not share endpoint with readiness.',
			domain: 'devops',
		},
		{
			source: 'review',
			content: 'Postgres indexing spell needs partial index examples for soft deletes.',
			domain: 'data',
		},
		{
			source: 'pair',
			content: 'E2E tests are flaking on date assertions; need deterministic clock.',
			domain: 'testing',
		},
		{
			source: 'session',
			content: 'Incident response should link to Grafana dashboard templates.',
			domain: 'general',
		},
		{
			source: 'agent',
			content: 'MCP server spell is too short; add transport negotiation details.',
			domain: 'ai',
		},
		{
			source: 'ops',
			content: 'Terraform state locking with DynamoDB should be mentioned explicitly.',
			domain: 'devops',
		},
		{
			source: 'review',
			content: 'Secrets management spell should cover OIDC for CI instead of long-lived keys.',
			domain: 'security',
		},
		{
			source: 'session',
			content: 'Documentation spell needs "last verified" convention for external links.',
			domain: 'general',
		},
		{
			source: 'pair',
			content: 'Playwright spell should warn about iframe content limitations.',
			domain: 'testing',
		},
		{
			source: 'agent',
			content: 'Database migration spell should show expand-contract timeline diagram.',
			domain: 'data',
		},
		{
			source: 'ops',
			content: 'Docker multi-stage spell should warn about COPY --chown vs numeric UID.',
			domain: 'devops',
		},
		{
			source: 'session',
			content: 'TypeScript strict mode spell needs note about project references for monorepos.',
			domain: 'development',
		},
	];
	let noteTime = now - 20 * DAY;
	const noteIds: number[] = [];
	for (const n of notes) {
		const result = dropNote(db, {
			source: n.source,
			content: n.content,
			...(n.domain !== undefined ? { domain: n.domain } : {}),
			now: noteTime,
		});
		noteIds.push(result.id);
		noteTime += 3 * HOUR;
	}

	// Route some notes (set domain after creation for notes that were domain-less, or update existing)
	// Mark a few notes as distilled by updating their status directly
	db.prepare("UPDATE spell_notes SET status = 'distilled', distilled_by = ? WHERE id = ?").run(
		'development/git-workflow',
		noteIds[0],
	);
	db.prepare("UPDATE spell_notes SET status = 'distilled', distilled_by = ? WHERE id = ?").run(
		'devops/ci-pipeline',
		noteIds[1],
	);
	db.prepare("UPDATE spell_notes SET status = 'distilled', distilled_by = ? WHERE id = ?").run(
		'testing/unit-testing',
		noteIds[2],
	);
	db.prepare("UPDATE spell_notes SET status = 'distilled', distilled_by = ? WHERE id = ?").run(
		'security/jwt-auth',
		noteIds[9],
	);

	const nid = (i: number): number => noteIds[i] as number;

	// --- Drafts: 5 drafts in varied states ---
	let draftTime = now - 15 * DAY;
	submitDraft(db, {
		title: 'api-error-handling',
		rationale:
			'Distill common HTTP error patterns (4xx vs 5xx, retries, idempotency) into a reusable spell.',
		noteIds: [nid(7)],
		chapter: 'development',
		now: draftTime,
	});
	draftTime += DAY;

	submitDraft(db, {
		title: 'observability-basics',
		rationale: 'Consolidate metrics, logs, and trace patterns from ops notes into one spell.',
		noteIds: [],
		chapter: 'devops',
		now: draftTime,
	});
	draftTime += DAY;

	submitDraft(db, {
		title: 'graphql-schema-design',
		rationale: 'Multiple review notes mention GraphQL patterns; worth a dedicated spell.',
		noteIds: [],
		chapter: 'development',
		now: draftTime,
	});
	draftTime += DAY;

	submitDraft(db, {
		title: 'container-security-hardening',
		rationale: 'Combine Docker non-root, image scanning, and secrets injection notes.',
		noteIds: [nid(4), nid(23)],
		chapter: 'security',
		now: draftTime,
	});
	draftTime += DAY;

	submitDraft(db, {
		title: 'llm-evaluation-framework',
		rationale:
			'Need a spell for evaluating LLM outputs beyond vibes -- golden sets, metrics, regression.',
		noteIds: [nid(10), nid(12)],
		chapter: 'ai',
		now: draftTime,
	});

	// --- Provenance: 5 records linking spells to external sources ---
	recordProvenance(db, {
		spellPath: 'development/git-workflow',
		sourceType: 'github',
		sourceRepo: 'ghostpawjs/grimoire',
		sourcePath: 'docs/HUMAN.md',
		sourceCommit: 'a1b2c3d',
	});
	recordProvenance(db, {
		spellPath: 'ai/rag-pipeline',
		sourceType: 'github',
		sourceRepo: 'langchain-ai/langchain',
		sourcePath: 'skills/rag-retrieval/SKILL.md',
		sourceCommit: 'f4e5d6c',
	});
	recordProvenance(db, {
		spellPath: 'ai/mcp-server',
		sourceType: 'github',
		sourceRepo: 'modelcontextprotocol/servers',
		sourcePath: 'src/fetch/SKILL.md',
	});
	recordProvenance(db, {
		spellPath: 'devops/docker-multi-stage',
		sourceType: 'agentskillhub',
		sourceRepo: 'cloudops-hub/container-recipes',
		sourcePath: 'skills/docker-multi-stage-builds/SKILL.md',
	});
	recordProvenance(db, {
		spellPath: 'security/jwt-auth',
		sourceType: 'agentskillhub',
		sourceRepo: 'securityfirst/jwt-hardening',
		sourcePath: 'skills/rotation-claims/SKILL.md',
		sourceVersion: '2.1.0',
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
