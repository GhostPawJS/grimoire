import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { GrimoireValidationError } from '../errors.ts';
import { assertChapter, assertSpellName, parseSpellPath, resolveInsideRoot } from './safe_path.ts';

test('strict segments enforce the name pattern and length', () => {
	for (const validate of [assertChapter, assertSpellName]) {
		for (const value of ['a', 'spell-123', 'a'.repeat(64)])
			assert.doesNotThrow(() => validate(value));
		for (const value of [
			'',
			'A',
			'a_b',
			'a.b',
			'-a',
			'a-',
			'a--b',
			'a'.repeat(65),
			'..',
			'a\n',
			'a\0',
			'a/b',
			'a\\b',
		])
			assert.throws(() => validate(value), GrimoireValidationError);
	}
});
test('existing paths accept legacy segments while destinations require strict segments', () => {
	assert.deepEqual(parseSpellPath('Ops/Legacy_name.v1'), ['Ops', 'Legacy_name.v1']);
	assert.throws(() => parseSpellPath('Ops/Legacy_name.v1', true), GrimoireValidationError);
	for (const path of [
		'../a',
		'a/..',
		'/a/b',
		'a',
		'a/b/c',
		'a//b',
		'a/b\\c',
		'a/\0b',
		'a/b\n',
		'a/.',
		'./a',
		`a/${'b'.repeat(129)}`,
	])
		assert.throws(() => parseSpellPath(path), GrimoireValidationError);
});
test('containment permits a linked root, refuses linked components and sibling prefixes', () => {
	const base = mkdtempSync(join(tmpdir(), 'grimoire-safe-path-'));
	try {
		const root = join(base, 'root');
		mkdirSync(root);
		const outside = join(base, 'root-other');
		mkdirSync(outside);
		symlinkSync(root, join(base, 'alias'), 'dir');
		assert.equal(
			resolveInsideRoot(join(base, 'alias'), 'ops', 'sample'),
			join(root, 'ops', 'sample'),
		);
		assert.equal(resolveInsideRoot(root), root);
		assert.equal(resolveInsideRoot(join(base, 'missing'), 'ops'), join(base, 'missing', 'ops'));
		for (const target of ['../root-other/sample', outside])
			assert.throws(() => resolveInsideRoot(root, target), GrimoireValidationError);
		symlinkSync(outside, join(root, 'ops'), 'dir');
		assert.throws(() => resolveInsideRoot(root, 'ops', 'sample'), /symbolic link/);
		symlinkSync(join(base, 'absent'), join(root, 'broken'), 'dir');
		assert.throws(() => resolveInsideRoot(root, 'broken', 'sample'), /symbolic link/);
		assert.equal(resolveInsideRoot(root, 'new'), resolve(root, 'new'));
	} finally {
		rmSync(base, { recursive: true, force: true });
	}
});
