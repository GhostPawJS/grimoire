import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { isDirectEdit, recordWrite } from './write_state.ts';

test('write state persists exact content and isolates spell paths', () => {
	const { root, cleanup } = createTestRoot({
		chapters: [{ name: 'cantrips', spells: [{ name: 'sample' }] }],
	});
	const ctx = { root };
	const path = 'cantrips/sample';
	const file = join(root, path, 'SKILL.md');
	try {
		recordWrite(ctx, path, 'exact\n');
		writeFileSync(file, 'exact\n');
		assert.equal(isDirectEdit(ctx, path), false);
		writeFileSync(file, 'exact\n\n');
		assert.equal(isDirectEdit(ctx, path), true);
		recordWrite(ctx, path, 'exact\n\n');
		assert.equal(isDirectEdit(ctx, path), false);
		assert.equal(isDirectEdit(ctx, 'cantrips/missing'), false);
		recordWrite(ctx, 'cantrips/other', 'unrelated');
		assert.equal(isDirectEdit(ctx, path), false);
	} finally {
		cleanup();
	}
});
