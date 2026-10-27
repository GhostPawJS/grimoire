import { validateInput } from '../surfaces/validate_input.ts';
import type { JsonSchema } from './tool_metadata.ts';
import { type ToolFailure, toolFailure } from './tool_types.ts';

export function validateToolInput(schema: JsonSchema, input: unknown): ToolFailure | undefined {
	const errors = validateInput(schema, input);
	if (input && typeof input === 'object') {
		const record = input as Record<string, unknown>;
		for (const [key, value] of Object.entries(record))
			if (typeof value === 'string' && !value.trim()) errors.push(`${key}: must not be empty`);
		const required: Record<string, string[]> = {
			submit: ['title', 'rationale', 'chapter'],
			approve: ['draftId'],
			dismiss: ['draftId'],
			shelve: ['path'],
			unshelve: ['path'],
			move: ['path', 'target'],
			delete: ['path'],
			repair: ['path'],
			rollback: ['path', 'ref'],
			search: ['query'],
			adopt: ['source'],
			apply_update: ['path'],
		};
		for (const key of required[String(record.action)] ?? [])
			if (record[key] === undefined) errors.push(`${key}: required for ${record.action}`);
		if (
			record.action === 'submit' &&
			![record.noteIds, record.note_ids].some((v) => Array.isArray(v) && v.length > 0)
		)
			errors.push('noteIds or note_ids: at least one note is required');
	}
	if (!errors.length) return;
	return toolFailure('protocol', 'invalid_input', 'Invalid tool input.', errors.join('; '), {
		recovery: `Correct ${errors.join('; ')}. Inspect the tool schema for valid fields and action-specific requirements.`,
	});
}
