import assert from 'node:assert/strict';
import { test } from 'node:test';
import { manageDraftTool } from './manage_draft_tool.ts';
import { validateToolInput } from './validate_tool_input.ts';

test('action-specific missing fields and whitespace produce protocol errors with recovery', () => {
	const schema = manageDraftTool.inputSchema;
	for (const input of [
		null,
		{},
		{ action: 'submit' },
		{ action: 'approve', draftId: '1' },
		{ action: 'submit', title: ' ' },
	]) {
		const failure = validateToolInput(schema, input);
		assert.equal(failure?.error.code, 'invalid_input');
		assert.ok(failure?.error.recovery);
	}
	assert.equal(
		validateToolInput(schema, {
			action: 'submit',
			title: 'Title',
			rationale: 'Evidence',
			chapter: 'ops',
			note_ids: [1],
		}),
		undefined,
	);
});
