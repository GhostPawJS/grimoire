import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SpellDraft } from '../drafts/types.ts';
import type { IndexEntry } from '../indexing/types.ts';
import type { SpellNote } from '../notes/types.ts';
import type { Provenance } from '../provenance/types.ts';
import type { Spell } from '../spells/types.ts';
import {
	toDraftRef,
	toIndexEntryRef,
	toNoteRef,
	toProvenanceRef,
	toSpellPathRef,
	toSpellRef,
} from './tool_ref.ts';

const stubSpell: Spell = {
	name: 'Fireball',
	chapter: 'combat',
	path: 'combat/fireball',
	absolutePath: '/g/combat/fireball',
	skillMdPath: '/g/combat/fireball/SKILL.md',
	description: 'A fiery blast.',
	body: '',
	bodyLines: 0,
	rank: 3,
	tier: 'Apprentice',
	files: { scripts: [], references: [], assets: [] },
	frontmatter: { name: 'Fireball', description: 'A fiery blast.' },
};

const stubNote: SpellNote = {
	id: 42,
	source: 'agent',
	sourceId: null,
	content: 'This spell needs more range.',
	domain: null,
	status: 'pending',
	distilledBy: null,
	createdAt: 1000,
};

const stubDraft: SpellDraft = {
	id: 7,
	title: 'Ice Shield',
	rationale: 'Defense needed.',
	noteIds: [1],
	chapter: 'defense',
	status: 'pending',
	createdAt: 2000,
};

const stubProvenance: Provenance = {
	spellPath: 'combat/fireball',
	sourceType: 'github',
	sourceUrl: 'https://example.com',
	sourceRepo: 'org/repo',
	sourcePath: null,
	sourceCommit: null,
	sourceVersion: null,
	importedAt: '2025-01-01',
	updatedAt: null,
};

const stubIndex: IndexEntry = {
	path: 'combat/fireball',
	chapter: 'combat',
	name: 'Fireball',
	tier: 'Apprentice',
	rank: 3,
	description: 'A fiery blast.',
};

describe('toSpellRef', () => {
	it('returns spell kind with path as id', () => {
		const ref = toSpellRef(stubSpell);
		assert.equal(ref.kind, 'spell');
		assert.equal(ref.id, 'combat/fireball');
		assert.equal(ref.title, 'Fireball');
		assert.equal(ref.state, 'Apprentice');
	});
});

describe('toSpellPathRef', () => {
	it('returns spell ref from path only', () => {
		const ref = toSpellPathRef('ch/spell');
		assert.equal(ref.kind, 'spell');
		assert.equal(ref.id, 'ch/spell');
		assert.equal(ref.title, undefined);
		assert.equal(ref.state, undefined);
	});

	it('includes optional name and tier', () => {
		const ref = toSpellPathRef('ch/spell', 'Spell', 'gold');
		assert.equal(ref.title, 'Spell');
		assert.equal(ref.state, 'gold');
	});
});

describe('toNoteRef', () => {
	it('returns note kind with numeric id', () => {
		const ref = toNoteRef(stubNote);
		assert.equal(ref.kind, 'note');
		assert.equal(ref.id, 42);
		assert.equal(ref.state, 'pending');
	});

	it('truncates title to 60 chars', () => {
		const longNote = { ...stubNote, content: 'A'.repeat(100) };
		const ref = toNoteRef(longNote);
		assert.equal(ref.title?.length, 60);
	});
});

describe('toDraftRef', () => {
	it('returns draft kind with correct fields', () => {
		const ref = toDraftRef(stubDraft);
		assert.equal(ref.kind, 'draft');
		assert.equal(ref.id, 7);
		assert.equal(ref.title, 'Ice Shield');
		assert.equal(ref.state, 'pending');
	});
});

describe('toProvenanceRef', () => {
	it('returns provenance kind with repo as state', () => {
		const ref = toProvenanceRef(stubProvenance);
		assert.equal(ref.kind, 'provenance');
		assert.equal(ref.id, 'combat/fireball');
		assert.equal(ref.title, 'github');
		assert.equal(ref.state, 'org/repo');
	});

	it('falls back to sourceUrl when sourceRepo is null', () => {
		const prov = { ...stubProvenance, sourceRepo: null };
		const ref = toProvenanceRef(prov);
		assert.equal(ref.state, 'https://example.com');
	});

	it('uses undefined when both sourceRepo and sourceUrl are null', () => {
		const prov = { ...stubProvenance, sourceRepo: null, sourceUrl: null };
		const ref = toProvenanceRef(prov);
		assert.equal(ref.state, undefined);
	});
});

describe('toIndexEntryRef', () => {
	it('returns spell kind from index entry', () => {
		const ref = toIndexEntryRef(stubIndex);
		assert.equal(ref.kind, 'spell');
		assert.equal(ref.id, 'combat/fireball');
		assert.equal(ref.title, 'Fireball');
		assert.equal(ref.state, 'Apprentice');
	});
});
