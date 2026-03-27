import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeFrontmatter } from './normalize_frontmatter.ts';

describe('normalizeFrontmatter', () => {
	it('converts hyphenated keys to camelCase', () => {
		const result = normalizeFrontmatter({
			name: 'test',
			description: 'desc',
			'allowed-tools': 'tool1 tool2',
			'disable-model-invocation': true,
		});
		assert.equal(result.allowedTools, 'tool1 tool2');
		assert.equal(result.disableModelInvocation, true);
	});

	it('passes through camelCase keys', () => {
		const result = normalizeFrontmatter({
			name: 'test',
			description: 'desc',
			allowedTools: 'tool1',
			disableModelInvocation: false,
		});
		assert.equal(result.allowedTools, 'tool1');
		assert.equal(result.disableModelInvocation, false);
	});

	it('coerces metadata values to strings', () => {
		const result = normalizeFrontmatter({
			name: 'test',
			description: 'desc',
			metadata: { source: 'github', count: 42, valid: true },
		});
		assert.deepEqual(result.metadata, { source: 'github' });
	});

	it('handles missing optional fields', () => {
		const result = normalizeFrontmatter({
			name: 'test',
			description: 'desc',
		});
		assert.equal(result.name, 'test');
		assert.equal(result.description, 'desc');
		assert.equal(result.license, undefined);
		assert.equal(result.compatibility, undefined);
		assert.equal(result.allowedTools, undefined);
		assert.equal(result.disableModelInvocation, undefined);
		assert.equal(result.metadata, undefined);
	});

	it('defaults name and description to empty string when missing', () => {
		const result = normalizeFrontmatter({});
		assert.equal(result.name, '');
		assert.equal(result.description, '');
	});
});
