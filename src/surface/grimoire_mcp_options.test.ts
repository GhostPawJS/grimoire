import assert from 'node:assert/strict';
import { test } from 'node:test';
import { grimoireMcpOptions } from './grimoire_mcp_options.ts';

test('annotations identify network access and destructive tool variants', () => {
	const options = grimoireMcpOptions(() => ({ root: '.' }));
	for (const tool of options.tools) {
		const annotations = options.annotations?.(tool);
		assert.equal(annotations?.readOnlyHint, tool.readOnly);
		assert.equal(annotations?.openWorldHint, tool.name === 'scout_skills');
		assert.equal(
			annotations?.destructiveHint,
			['manage_spell', 'manage_draft', 'run_catalogue'].includes(tool.name),
		);
	}
});
