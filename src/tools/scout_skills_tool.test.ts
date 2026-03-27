import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scoutSkillsTool } from './scout_skills_tool.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';
import { scoutSkillsToolName } from './tool_names.ts';

const ctxWithoutDb: GrimoireToolContext = { root: '/tmp/grimoire' };

describe('scoutSkillsTool metadata', () => {
	it('has the correct name', () => {
		assert.equal(scoutSkillsTool.name, scoutSkillsToolName);
	});

	it('writes state and is not read-only', () => {
		assert.equal(scoutSkillsTool.sideEffects, 'writes_state');
		assert.equal(scoutSkillsTool.readOnly, false);
	});

	it('does not support clarification', () => {
		assert.equal(scoutSkillsTool.supportsClarification, false);
	});

	it('targets spell and provenance kinds', () => {
		assert.deepEqual(scoutSkillsTool.targetKinds, ['spell', 'provenance']);
	});

	it('has a oneOf input schema with four variants', () => {
		assert.equal(scoutSkillsTool.inputSchema.oneOf?.length, 4);
	});
});

describe('scoutSkillsTool handler – adopt without db', () => {
	it('returns a system error failure', async () => {
		const result = await scoutSkillsTool.handler(ctxWithoutDb, {
			action: 'adopt',
			source: 'https://example.com/skill.md',
		});
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		assert.ok('error' in result);
		if ('error' in result) {
			assert.equal(result.error.kind, 'system');
			assert.equal(result.error.code, 'system_error');
			assert.match(result.summary, /without a database/);
		}
	});
});

describe('scoutSkillsTool handler – check_updates without db', () => {
	it('returns a system error failure', async () => {
		const result = await scoutSkillsTool.handler(ctxWithoutDb, { action: 'check_updates' });
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		assert.ok('error' in result);
		if ('error' in result) {
			assert.equal(result.error.kind, 'system');
			assert.equal(result.error.code, 'system_error');
			assert.match(result.summary, /without a database/);
		}
	});
});

describe('scoutSkillsTool handler – apply_update without db', () => {
	it('returns a system error failure', async () => {
		const result = await scoutSkillsTool.handler(ctxWithoutDb, {
			action: 'apply_update',
			path: 'spells/my-spell.md',
		});
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		assert.ok('error' in result);
		if ('error' in result) {
			assert.equal(result.error.kind, 'system');
			assert.equal(result.error.code, 'system_error');
			assert.match(result.summary, /without a database/);
		}
	});
});
