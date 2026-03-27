import { type GrimoireError, isGrimoireError } from '../errors.ts';
import { reviewViewNext, searchNext } from './tool_next.ts';
import type {
	ToolEntityRef,
	ToolErrorCode,
	ToolErrorKind,
	ToolFailure,
	ToolNextStepHint,
} from './tool_types.ts';
import { toolFailure } from './tool_types.ts';

interface TranslateToolErrorOptions {
	entities?: ToolEntityRef[];
	next?: ToolNextStepHint[];
	summary?: string;
}

function mapGrimoireErrorCode(code: string): { kind: ToolErrorKind; toolCode: ToolErrorCode } {
	switch (code) {
		case 'GRIMOIRE_NOT_FOUND':
			return { kind: 'domain', toolCode: 'not_found' };
		case 'GRIMOIRE_VALIDATION':
			return { kind: 'protocol', toolCode: 'validation_failed' };
		case 'GRIMOIRE_STATE':
			return { kind: 'domain', toolCode: 'invalid_state' };
		case 'GRIMOIRE_INVARIANT':
			return { kind: 'system', toolCode: 'system_error' };
		default:
			return { kind: 'system', toolCode: 'system_error' };
	}
}

function buildRecoveryHints(error: GrimoireError): ToolNextStepHint[] {
	if (error.code === 'GRIMOIRE_NOT_FOUND') {
		return [
			searchNext('', 'Search for the spell by name to find the correct path.'),
			reviewViewNext('chapters', 'Browse chapters to find the spell.'),
		];
	}
	return [];
}

export function translateToolError(
	error: unknown,
	options: TranslateToolErrorOptions = {},
): ToolFailure {
	if (isGrimoireError(error)) {
		const { kind, toolCode } = mapGrimoireErrorCode(error.code);
		const next = options.next ?? buildRecoveryHints(error);
		const result = toolFailure(kind, toolCode, options.summary ?? error.message, error.message, {
			...(options.entities ? { entities: options.entities } : {}),
			...(next.length > 0 ? { next } : {}),
		});
		if (error.code === 'GRIMOIRE_NOT_FOUND') {
			result.error.recovery =
				'The spell may have been moved or shelved. Search by name to locate it.';
		}
		if (error.code === 'GRIMOIRE_VALIDATION') {
			result.error.recovery = 'Fix the invalid input fields and retry.';
		}
		return result;
	}
	const message = error instanceof Error ? error.message : String(error);
	return toolFailure(
		'system',
		'system_error',
		options.summary ?? 'An unexpected error occurred.',
		message,
	);
}

export function withToolHandling<TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => TResult,
	options: TranslateToolErrorOptions = {},
): (...args: TArgs) => TResult | ToolFailure {
	return (...args: TArgs) => {
		try {
			return fn(...args);
		} catch (error) {
			return translateToolError(error, options) as TResult | ToolFailure;
		}
	};
}
