export type NoteStatus = 'pending' | 'distilled' | 'expired';

export type SpellNoteRow = {
	id: number;
	source: string;
	source_id: string | null;
	content: string;
	domain: string | null;
	status: string;
	distilled_by: string | null;
	created_at: number;
};

export interface SpellNote {
	id: number;
	source: string;
	sourceId: string | null;
	content: string;
	domain: string | null;
	status: NoteStatus;
	distilledBy: string | null;
	createdAt: number;
}

export interface DropNoteInput {
	source: string;
	sourceId?: string;
	content: string;
	domain?: string;
	now?: number;
}

export interface NoteListOptions {
	domain?: string;
	status?: NoteStatus;
	limit?: number;
	offset?: number;
}

export interface NoteCountRecord {
	source: string;
	domain: string | null;
	count: number;
}
