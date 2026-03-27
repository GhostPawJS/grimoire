import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { init, read, write } from './index.ts';
import { openTestDatabase } from './lib/open-test-database.ts';

const initialContent = `---
name: deploy-vercel
description: Deploy to Vercel safely with rollback and minimal downtime
allowed-tools: bash git
---

# deploy-vercel

Use this spell to deploy to Vercel safely.

## Failure

Rollback quickly if the health checks fail.

## Recovery

Redeploy the previous known-good version.

## Error

Stop if migrations are incompatible.

## Edge Cases

Watch for preview versus production environment drift.

## Caveats

Secrets must already exist in the target environment.

## Compiled Summary

Deploy, verify, rollback if needed.
`;

describe('full grimoire flow', () => {
	it('runs the real tmp-root lifecycle with git, sqlite, and cleanup', () => {
		const tempBase = mkdtempSync(join(tmpdir(), 'grimoire-full-flow-'));
		const root = join(tempBase, 'grimoire');
		const gitDir = join(tempBase, '.grimoire-git');
		const db = openTestDatabase();

		try {
			init(root, db, { gitDir });

			assert.ok(existsSync(root));
			assert.ok(existsSync(join(root, 'general')));
			assert.ok(existsSync(gitDir));

			const inscribed = write.inscribe(root, db, {
				name: 'deploy-vercel',
				content: initialContent,
			});
			assert.equal(inscribed.spell.path, 'general/deploy-vercel');
			assert.ok(existsSync(join(root, 'general', 'deploy-vercel', 'SKILL.md')));

			for (let i = 1; i <= 5; i++) {
				const skillMdPath = join(root, 'general', 'deploy-vercel', 'SKILL.md');
				const current = readFileSync(skillMdPath, 'utf-8');
				writeFileSync(skillMdPath, `${current}\nUpdate ${String(i)}\n`);
				const sealed = write.seal(
					{ root, gitDir },
					db,
					['general/deploy-vercel'],
					`hone deploy-vercel ${String(i)}`,
				);
				assert.ok(sealed.commitHash.length > 0);
			}

			const spell = read.getSpell(root, 'general/deploy-vercel', db);
			assert.equal(spell.name, 'deploy-vercel');

			const rendered = read.renderContent(root, 'general/deploy-vercel', db);
			assert.equal(rendered.allowedTools, 'bash git');

			const currentRank = read.rank({ root, gitDir }, 'general/deploy-vercel');
			assert.ok(currentRank >= 6);

			const history = read.history({ root, gitDir }, 'general/deploy-vercel');
			assert.ok(history.length >= 6);

			const indexEntries = read.buildIndex(root);
			assert.equal(indexEntries.length, 1);
			assert.equal(indexEntries[0]?.path, 'general/deploy-vercel');

			write.dropNote(db, {
				source: 'chat',
				content: 'Deploy to Vercel safely with rollback and minimal downtime',
			});

			const snapshot = write.catalogue(root, db, { now: Date.now() });
			assert.equal(snapshot.totalSpells, 1);
			assert.ok(snapshot.notesRouted >= 1);

			const routedNotes = read.listNotes(db, { domain: 'general/deploy-vercel' });
			assert.equal(routedNotes.length, 1);

			const spellResonance = read.resonance(db, 'general/deploy-vercel', { now: Date.now() });
			assert.ok(spellResonance.readCount >= 2);
			assert.notEqual(spellResonance.color, 'grey');

			const latestCatalogue = read.readCatalogue(db);
			assert.ok(latestCatalogue);
			assert.equal(latestCatalogue?.id, snapshot.id);

			const shelved = write.shelve(root, 'general/deploy-vercel', db);
			assert.equal(shelved.path, '.shelved/general/deploy-vercel');
			assert.ok(existsSync(join(root, '.shelved', 'general', 'deploy-vercel', 'SKILL.md')));
			assert.equal(read.buildIndex(root).length, 0);

			const restored = write.unshelve(root, 'general/deploy-vercel', db);
			assert.equal(restored.path, 'general/deploy-vercel');
			assert.ok(existsSync(join(root, 'general', 'deploy-vercel', 'SKILL.md')));
			assert.ok(read.rank({ root, gitDir }, 'general/deploy-vercel') >= currentRank);

			const events = read.eventsSince(db, 0);
			const eventKinds = new Set(events.map((event) => event.event));
			assert.ok(eventKinds.has('inscribe'));
			assert.ok(eventKinds.has('seal'));
			assert.ok(eventKinds.has('read'));
			assert.ok(eventKinds.has('shelve'));
			assert.ok(eventKinds.has('unshelve'));
		} finally {
			db.close();
			rmSync(tempBase, { recursive: true, force: true });
		}

		assert.ok(!existsSync(tempBase));
	});
});
