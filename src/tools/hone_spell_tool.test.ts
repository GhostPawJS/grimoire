import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { honeSpellTool } from './hone_spell_tool.ts';

describe('honeSpellTool', () => {
	it('has correct metadata', () => {
		assert.equal(honeSpellTool.name, 'hone_spell');
		assert.equal(honeSpellTool.readOnly, false);
		assert.equal(honeSpellTool.sideEffects, 'writes_state');
		assert.deepEqual(honeSpellTool.targetKinds, ['spell']);
		assert.ok(honeSpellTool.description.length > 0);
		assert.ok(honeSpellTool.whenToUse.length > 0);
		assert.ok(honeSpellTool.whenNotToUse && honeSpellTool.whenNotToUse.length > 0);
	});

	it('returns no-op when no git repo and no pending changes', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = await honeSpellTool.handler({ root, db: undefined }, {});
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.equal(result.outcome, 'no_op');
			assert.equal(result.summary, 'No pending changes to seal.');
			assert.deepEqual(result.data.sealedPaths, []);
			assert.deepEqual(result.data.ranks, {});
			assert.deepEqual(result.data.tiers, {});
		} finally {
			cleanup();
		}
	});

	it('has valid input schema', () => {
		assert.equal(honeSpellTool.inputSchema.type, 'object');
		assert.ok(honeSpellTool.inputSchema.properties);
		assert.ok('paths' in (honeSpellTool.inputSchema.properties ?? {}));
		assert.ok('message' in (honeSpellTool.inputSchema.properties ?? {}));
	});
});
