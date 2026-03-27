import type { SpellDraft } from '../drafts/types.ts';
import type { IndexEntry } from '../indexing/types.ts';
import type { SpellNote } from '../notes/types.ts';
import type { Provenance } from '../provenance/types.ts';
import type { Spell } from '../spells/types.ts';
import type { ToolEntityRef } from './tool_types.ts';

export function toSpellRef(spell: Spell): ToolEntityRef {
	return { kind: 'spell', id: spell.path, title: spell.name, state: spell.tier };
}

export function toSpellPathRef(path: string, name?: string, tier?: string): ToolEntityRef {
	const ref: ToolEntityRef = { kind: 'spell', id: path };
	if (name !== undefined) ref.title = name;
	if (tier !== undefined) ref.state = tier;
	return ref;
}

export function toNoteRef(note: SpellNote): ToolEntityRef {
	return { kind: 'note', id: note.id, title: note.content.slice(0, 60), state: note.status };
}

export function toDraftRef(draft: SpellDraft): ToolEntityRef {
	return { kind: 'draft', id: draft.id, title: draft.title, state: draft.status };
}

export function toProvenanceRef(prov: Provenance): ToolEntityRef {
	return {
		kind: 'provenance',
		id: prov.spellPath,
		title: prov.sourceType,
		state: prov.sourceRepo ?? prov.sourceUrl ?? undefined,
	};
}

export function toIndexEntryRef(entry: IndexEntry): ToolEntityRef {
	return { kind: 'spell', id: entry.path, title: entry.name, state: entry.tier };
}
