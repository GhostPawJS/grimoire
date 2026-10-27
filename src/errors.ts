export type GrimoireErrorCode =
	| 'GRIMOIRE_CONFLICT'
	| 'GRIMOIRE_NOT_FOUND'
	| 'GRIMOIRE_VALIDATION'
	| 'GRIMOIRE_STATE'
	| 'GRIMOIRE_INVARIANT';

export class GrimoireError extends Error {
	override readonly name: string = 'GrimoireError';
	readonly code: GrimoireErrorCode;

	constructor(code: GrimoireErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

export class GrimoireNotFoundError extends GrimoireError {
	override readonly name = 'GrimoireNotFoundError';

	constructor(message: string) {
		super('GRIMOIRE_NOT_FOUND', message);
	}
}

export class GrimoireValidationError extends GrimoireError {
	override readonly name = 'GrimoireValidationError';

	constructor(message: string) {
		super('GRIMOIRE_VALIDATION', message);
	}
}

export class GrimoireStateError extends GrimoireError {
	override readonly name = 'GrimoireStateError';

	constructor(message: string) {
		super('GRIMOIRE_STATE', message);
	}
}

export class GrimoireInvariantError extends GrimoireError {
	override readonly name = 'GrimoireInvariantError';

	constructor(message: string) {
		super('GRIMOIRE_INVARIANT', message);
	}
}

export function isGrimoireError(value: unknown): value is GrimoireError {
	return value instanceof GrimoireError;
}

export class GrimoireConflictError extends GrimoireError {
	override readonly name = 'GrimoireConflictError';
	constructor(path: string) {
		super(
			'GRIMOIRE_CONFLICT',
			`A spell already exists at ${path}. Use update_spell / \`spell update\` to change it, pick another name, or pass force: true to replace it.`,
		);
	}
}
