import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { unshelve } from './unshelve.ts';

function shelvedLayout(root: string, path: string, content: string): void {
	const dir = join(root, '.shelved', path);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'SKILL.md'), content);
}

const skillContent = `---
name: restored-spell
description: A spell that was shelved
---

# restored-spell

Body content.
`;

describe('unshelve', () => {
	it('restores spell from .shelved to root', () => {
		const { root, cleanup } = createTestRoot();
		try {
			shelvedLayout(root, 'general/restored-spell', skillContent);
			const result = unshelve(root, 'general/restored-spell');
			assert.equal(result.path, 'general/restored-spell');
			assert.ok(existsSync(join(root, 'general', 'restored-spell', 'SKILL.md')));
			assert.ok(!existsSync(join(root, '.shelved', 'general', 'restored-spell')));
		} finally {
			cleanup();
		}
	});

	it('preserves content after unshelve', () => {
		const { root, cleanup } = createTestRoot();
		try {
			shelvedLayout(root, 'general/restored-spell', skillContent);
			unshelve(root, 'general/restored-spell');
			const content = readFileSync(join(root, 'general', 'restored-spell', 'SKILL.md'), 'utf-8');
			assert.equal(content, skillContent);
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireNotFoundError for missing shelved spell', () => {
		const { root, cleanup } = createTestRoot();
		try {
			assert.throws(() => unshelve(root, 'general/nonexistent'), GrimoireNotFoundError);
		} finally {
			cleanup();
		}
	});
});
