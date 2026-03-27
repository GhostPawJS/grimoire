import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { adoptSpells } from './adopt_spells.ts';

function stageSkill(root: string, name: string): string {
	const dir = join(root, '.staging', name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, 'SKILL.md'),
		`---\nname: ${name}\ndescription: Skill ${name} for batch adopt\n---\n\n# ${name}\n\nBody.\n`,
	);
	return dir;
}

describe('adoptSpells', () => {
	it('adopts multiple spells', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const paths = [stageSkill(root, 'skill-a'), stageSkill(root, 'skill-b')];

			const result = adoptSpells(root, undefined, paths);
			assert.equal(result.adopted.length, 2);
			assert.equal(result.errors.length, 0);
			assert.equal(result.adopted[0]?.spell.name, 'skill-a');
			assert.equal(result.adopted[1]?.spell.name, 'skill-b');
		} finally {
			cleanup();
		}
	});

	it('handles partial failure without blocking others', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const goodPath = stageSkill(root, 'skill-good');
			const badPath = join(root, '.staging', 'skill-bad');
			mkdirSync(badPath, { recursive: true });
			writeFileSync(join(badPath, 'SKILL.md'), 'invalid content');

			const result = adoptSpells(root, undefined, [goodPath, badPath]);
			assert.equal(result.adopted.length, 1);
			assert.equal(result.errors.length, 1);
			assert.equal(result.adopted[0]?.spell.name, 'skill-good');
			assert.ok(result.errors[0]?.path.includes('skill-bad'));
		} finally {
			cleanup();
		}
	});

	it('returns empty result for empty input', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = adoptSpells(root, undefined, []);
			assert.equal(result.adopted.length, 0);
			assert.equal(result.errors.length, 0);
			assert.equal(result.skipped.length, 0);
		} finally {
			cleanup();
		}
	});
});
