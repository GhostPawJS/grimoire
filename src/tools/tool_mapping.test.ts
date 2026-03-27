import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toolMapping } from './tool_mapping.ts';
import * as names from './tool_names.ts';

describe('toolMapping', () => {
	const validToolNames: Set<string> = new Set(Object.values(names));

	it('contains entries for all tool names', () => {
		const mapped = new Set(toolMapping.map((e) => e.tool));
		for (const name of validToolNames) {
			assert.ok(mapped.has(name), `Missing mapping for tool "${name}".`);
		}
	});

	it('references only valid tool names', () => {
		for (const entry of toolMapping) {
			assert.ok(
				validToolNames.has(entry.tool),
				`Invalid tool name "${entry.tool}" in mapping for API "${entry.api}".`,
			);
		}
	});

	it('has unique API names', () => {
		const apis = toolMapping.map((e) => e.api);
		const unique = new Set(apis);
		assert.equal(apis.length, unique.size, 'Duplicate API entries in mapping.');
	});

	it('has at least 60 entries', () => {
		assert.ok(toolMapping.length >= 60, `Expected >= 60 entries, got ${toolMapping.length}.`);
	});
});
