import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveSource } from './resolve_source.ts';

describe('resolveSource', () => {
	it('parses GitHub shorthand owner/repo', () => {
		const result = resolveSource('acme/spellbook');
		assert.equal(result.type, 'github');
		assert.equal(result.owner, 'acme');
		assert.equal(result.repo, 'spellbook');
		assert.equal(result.url, 'https://github.com/acme/spellbook');
	});

	it('parses GitHub URL', () => {
		const result = resolveSource('https://github.com/acme/spellbook');
		assert.equal(result.type, 'github');
		assert.equal(result.owner, 'acme');
		assert.equal(result.repo, 'spellbook');
		assert.equal(result.url, 'https://github.com/acme/spellbook');
	});

	it('parses GitHub deep path with tree/ref/subpath', () => {
		const result = resolveSource('https://github.com/acme/spellbook/tree/main/skills/my-skill');
		assert.equal(result.type, 'github');
		assert.equal(result.owner, 'acme');
		assert.equal(result.repo, 'spellbook');
		assert.equal(result.ref, 'main');
		assert.equal(result.subpath, 'skills/my-skill');
	});

	it('parses GitHub tree URL without subpath', () => {
		const result = resolveSource('https://github.com/acme/spellbook/tree/v2');
		assert.equal(result.type, 'github');
		assert.equal(result.ref, 'v2');
		assert.equal(result.subpath, undefined);
	});

	it('parses skhub:slug', () => {
		const result = resolveSource('skhub:my-skill');
		assert.equal(result.type, 'agentskillhub');
		assert.equal(result.slug, 'my-skill');
	});

	it('parses skhub:owner/name', () => {
		const result = resolveSource('skhub:acme/my-skill');
		assert.equal(result.type, 'agentskillhub');
		assert.equal(result.slug, 'acme/my-skill');
	});

	it('parses local absolute path', () => {
		const result = resolveSource('/home/user/skills/my-skill');
		assert.equal(result.type, 'local');
		assert.equal(result.url, '/home/user/skills/my-skill');
	});

	it('parses local relative path', () => {
		const result = resolveSource('./skills/my-skill');
		assert.equal(result.type, 'local');
		assert.equal(result.url, './skills/my-skill');
	});

	it('parses git@ URL', () => {
		const result = resolveSource('git@github.com:acme/spellbook.git');
		assert.equal(result.type, 'git');
		assert.equal(result.url, 'git@github.com:acme/spellbook.git');
	});

	it('parses generic .git URL', () => {
		const result = resolveSource('https://gitlab.com/acme/repo.git');
		assert.equal(result.type, 'git');
		assert.equal(result.url, 'https://gitlab.com/acme/repo.git');
	});
});
