export type GrimoireErrorCode =
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
