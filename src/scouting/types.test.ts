import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AdoptResult, DiscoveredSkill, ResolvedSource } from './types.ts';

describe('scouting/types', () => {
	it('loads the module', () => {
		const source: ResolvedSource = { type: 'github', owner: 'test', repo: 'repo' };
		assert.ok(source !== undefined);
	});

	it('DiscoveredSkill has expected shape', () => {
		const skill: DiscoveredSkill = {
			name: 'test-skill',
			description: 'A test skill',
			localPath: '/tmp/skills/test-skill',
			valid: true,
			errors: [],
			warnings: [],
		};
		assert.equal(skill.name, 'test-skill');
	});

	it('AdoptResult has expected shape', () => {
		const result: AdoptResult = {
			adopted: [],
			skipped: [],
			errors: [],
		};
		assert.equal(result.adopted.length, 0);
	});
});
