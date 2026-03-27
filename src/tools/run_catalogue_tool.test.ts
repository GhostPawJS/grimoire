import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runCatalogueTool } from './run_catalogue_tool.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';

describe('runCatalogueTool', () => {
	it('returns failure when no database is available', async () => {
		const ctx: GrimoireToolContext = { root: '/tmp' };
		const result = await runCatalogueTool.handler(ctx, {});
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		if (!result.ok && result.outcome === 'error') {
			assert.equal(result.error.code, 'system_error');
			assert.match(result.error.message, /database/i);
			assert.ok(result.error.recovery);
		}
	});

	it('has correct metadata', () => {
		assert.equal(runCatalogueTool.name, 'run_catalogue');
		assert.equal(runCatalogueTool.readOnly, false);
		assert.equal(runCatalogueTool.sideEffects, 'writes_state');
		assert.deepEqual(runCatalogueTool.targetKinds, ['spell', 'note', 'cluster']);
		assert.equal(runCatalogueTool.supportsClarification, false);
	});

	it('has valid input schema', () => {
		const schema = runCatalogueTool.inputSchema;
		assert.equal(schema.type, 'object');
		assert.ok(schema.properties);
		assert.ok('now' in schema.properties);
		assert.deepEqual(schema.required, []);
	});

	it('includes description fields', () => {
		assert.ok(runCatalogueTool.description.length > 0);
		assert.ok(runCatalogueTool.whenToUse.length > 0);
		assert.ok(runCatalogueTool.whenNotToUse);
		assert.ok(runCatalogueTool.outputDescription.length > 0);
	});
});
