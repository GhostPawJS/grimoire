import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseFrontmatterYaml } from './parse_frontmatter_yaml.ts';

describe('parseFrontmatterYaml', () => {
	it('parses basic key-value pairs', () => {
		const result = parseFrontmatterYaml('name: my-skill\ndescription: A cool skill');
		assert.equal(result.name, 'my-skill');
		assert.equal(result.description, 'A cool skill');
	});

	it('parses single-quoted strings', () => {
		const result = parseFrontmatterYaml("name: 'my-skill'");
		assert.equal(result.name, 'my-skill');
	});

	it('parses double-quoted strings', () => {
		const result = parseFrontmatterYaml('name: "my-skill"');
		assert.equal(result.name, 'my-skill');
	});

	it('parses boolean true', () => {
		const result = parseFrontmatterYaml('disable-model-invocation: true');
		assert.equal(result['disable-model-invocation'], true);
	});

	it('parses boolean false', () => {
		const result = parseFrontmatterYaml('disable-model-invocation: false');
		assert.equal(result['disable-model-invocation'], false);
	});

	it('parses nested maps', () => {
		const result = parseFrontmatterYaml('metadata:\n  source: github\n  version: 1.0');
		assert.deepEqual(result.metadata, { source: 'github', version: '1.0' });
	});

	it('returns empty object for empty input', () => {
		assert.deepEqual(parseFrontmatterYaml(''), {});
	});

	it('ignores comment lines', () => {
		const result = parseFrontmatterYaml('# this is a comment\nname: test');
		assert.equal(result.name, 'test');
		assert.equal(Object.keys(result).length, 1);
	});

	it('ignores blank lines', () => {
		const result = parseFrontmatterYaml('name: test\n\ndescription: hello');
		assert.equal(result.name, 'test');
		assert.equal(result.description, 'hello');
	});

	it('handles nested map followed by top-level key', () => {
		const yaml = 'metadata:\n  k: v\nname: after';
		const result = parseFrontmatterYaml(yaml);
		assert.deepEqual(result.metadata, { k: 'v' });
		assert.equal(result.name, 'after');
	});
});
