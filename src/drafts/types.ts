export type DraftStatus = 'pending' | 'approved' | 'dismissed';

export type SpellDraftRow = {
	id: number;
	title: string;
	rationale: string;
	note_ids: string;
	chapter: string;
	status: string;
	created_at: number;
};

export interface SpellDraft {
	id: number;
	title: string;
	rationale: string;
	noteIds: number[];
	chapter: string;
	status: DraftStatus;
	createdAt: number;
}

export interface SubmitDraftInput {
	title: string;
	rationale: string;
	noteIds: number[];
	chapter: string;
	now?: number;
}
