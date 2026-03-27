export type SpellEventType =
	| 'read'
	| 'seal'
	| 'inscribe'
	| 'shelve'
	| 'unshelve'
	| 'move'
	| 'hone'
	| 'adopt';

export type SpellEventRow = {
	id: number;
	spell: string;
	event: string;
	context_id: string | null;
	ts: number;
};

export interface SpellEvent {
	id: number;
	spell: string;
	event: SpellEventType;
	contextId: string | null;
	ts: number;
}

export interface LogEventInput {
	spell: string;
	event: SpellEventType;
	contextId?: string;
	now?: number;
}

export type ResonanceColor = 'grey' | 'green' | 'yellow' | 'orange';

export type ResonanceResult = {
	color: ResonanceColor;
	weightedReads: number;
	readCount: number;
	lastSealTs: number | null;
};

export type ResonanceOptions = {
	resonanceHalfLife?: number;
	now?: number;
};
