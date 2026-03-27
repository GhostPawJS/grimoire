export type ToolEntityKind = 'spell' | 'note' | 'draft' | 'provenance' | 'cluster';
export type ToolOutcomeKind = 'success' | 'no_op' | 'needs_clarification' | 'error';
export type ToolErrorCode =
	| 'not_found'
	| 'invalid_input'
	| 'invalid_state'
	| 'validation_failed'
	| 'system_error';
export type ToolErrorKind = 'domain' | 'protocol' | 'system';
export type ToolWarningCode =
	| 'empty_result'
	| 'duplication_detected'
	| 'degraded_no_db'
	| 'degraded_no_git'
	| 'oversize'
	| 'stale';
export type ToolClarificationCode =
	| 'ambiguous_action'
	| 'ambiguous_target'
	| 'missing_required_choice';
export type ToolNextStepHintKind =
	| 'ask_user'
	| 'inspect_item'
	| 'review_view'
	| 'retry_with'
	| 'use_tool';

export interface ToolEntityRef {
	kind: ToolEntityKind;
	id: number | string;
	title?: string | undefined;
	state?: string | undefined;
}

export interface ToolWarning {
	code: ToolWarningCode;
	message: string;
}

export interface ToolNextStepHint {
	kind: ToolNextStepHintKind;
	message: string;
	tool?: string | undefined;
	suggestedInput?: Record<string, unknown> | undefined;
}

export interface ToolBaseResult {
	ok: boolean;
	outcome: ToolOutcomeKind;
	summary: string;
	entities: ToolEntityRef[];
	warnings?: ToolWarning[] | undefined;
	next?: ToolNextStepHint[] | undefined;
}

export interface ToolSuccess<TData> extends ToolBaseResult {
	ok: true;
	outcome: 'success' | 'no_op';
	data: TData;
}

export interface ToolNeedsClarification extends ToolBaseResult {
	ok: false;
	outcome: 'needs_clarification';
	clarification: {
		code: ToolClarificationCode;
		question: string;
		missing: string[];
		options?: Array<{ label: string; value: number | string }> | undefined;
	};
}

export interface ToolFailure extends ToolBaseResult {
	ok: false;
	outcome: 'error';
	error: {
		kind: ToolErrorKind;
		code: ToolErrorCode;
		message: string;
		recovery?: string | undefined;
		details?: Record<string, unknown> | undefined;
	};
}

export type ToolResult<TData> = ToolFailure | ToolNeedsClarification | ToolSuccess<TData>;

interface ToolResultOptions {
	entities?: ToolEntityRef[] | undefined;
	next?: ToolNextStepHint[] | undefined;
	warnings?: ToolWarning[] | undefined;
}

interface ToolClarificationOptions extends ToolResultOptions {
	options?: Array<{ label: string; value: number | string }> | undefined;
}

interface ToolFailureOptions extends ToolResultOptions {
	details?: Record<string, unknown> | undefined;
	recovery?: string | undefined;
}

function withOptionalFields<T extends ToolBaseResult>(result: T, options: ToolResultOptions): T {
	if (options.next && options.next.length > 0) {
		result.next = options.next;
	}
	if (options.warnings && options.warnings.length > 0) {
		result.warnings = options.warnings;
	}
	return result;
}

export function toolWarning(code: ToolWarningCode, message: string): ToolWarning {
	return { code, message };
}

export function toolSuccess<TData>(
	summary: string,
	data: TData,
	options: ToolResultOptions = {},
): ToolSuccess<TData> {
	return withOptionalFields(
		{
			ok: true as const,
			outcome: 'success' as const,
			summary,
			entities: options.entities ?? [],
			data,
		},
		options,
	);
}

export function toolNoOp<TData>(
	summary: string,
	data: TData,
	options: ToolResultOptions = {},
): ToolSuccess<TData> {
	return withOptionalFields(
		{
			ok: true as const,
			outcome: 'no_op' as const,
			summary,
			entities: options.entities ?? [],
			data,
		},
		options,
	);
}

export function toolNeedsClarification(
	code: ToolClarificationCode,
	question: string,
	missing: string[],
	options: ToolClarificationOptions = {},
): ToolNeedsClarification {
	const clarification: ToolNeedsClarification['clarification'] = {
		code,
		question,
		missing,
	};
	if (options.options && options.options.length > 0) {
		clarification.options = options.options;
	}
	return withOptionalFields(
		{
			ok: false as const,
			outcome: 'needs_clarification' as const,
			summary: question,
			entities: options.entities ?? [],
			clarification,
		},
		options,
	);
}

export function toolFailure(
	kind: ToolErrorKind,
	code: ToolErrorCode,
	summary: string,
	message: string,
	options: ToolFailureOptions = {},
): ToolFailure {
	const error: ToolFailure['error'] = { kind, code, message };
	if (options.recovery !== undefined) {
		error.recovery = options.recovery;
	}
	if (options.details !== undefined) {
		error.details = options.details;
	}
	return withOptionalFields(
		{
			ok: false as const,
			outcome: 'error' as const,
			summary,
			entities: options.entities ?? [],
			error,
		},
		options,
	);
}
