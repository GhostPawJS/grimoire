import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateInput } from '../surfaces/validate_input.ts';
import { grimoireSurfaceTools } from './grimoire_surface_tools.ts';

const inputs: Record<string, Record<string, unknown>> = {
	search_grimoire: { query: 'release' },
	review_grimoire: { view: 'notes' },
	inspect_grimoire_item: { path: 'general/release' },
	inscribe_spell: { name: 'release', content: '# Release' },
	update_spell: { path: 'general/release', content: '# Release' },
	hone_spell: { paths: ['general/release'] },
	manage_spell: { action: 'delete', path: 'general/release' },
	drop_note: { content: 'Verify build', source: 'practice' },
	manage_draft: { action: 'dismiss', draftId: 1 },
	run_catalogue: {},
	scout_skills: { action: 'search', query: 'release' },
};
test('every Grimoire schema accepts representative handler inputs and rejects invalid shapes', () => {
	for (const tool of grimoireSurfaceTools) {
		assert.ok(inputs[tool.name], tool.name);
		assert.deepEqual(validateInput(tool.inputSchema, inputs[tool.name]), [], tool.name);
		assert.ok(validateInput(tool.inputSchema, []).length, tool.name);
		for (const required of tool.inputSchema.required ?? []) {
			const input = { ...inputs[tool.name] };
			delete input[required];
			assert.ok(validateInput(tool.inputSchema, input).length, `${tool.name}.${required}`);
		}
	}
});
