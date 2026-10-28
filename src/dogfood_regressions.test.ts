import assert from 'node:assert/strict';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { history } from './git/history.ts';
import { rank } from './git/rank.ts';
import { rollback } from './git/rollback.ts';
import { createTestGitRoot } from './lib/test-git.ts';
import { parseSkillMd } from './spec/parse_skill_md.ts';
import { serializeSkillMd } from './spec/serialize_skill_md.ts';
import { moveSpell } from './spells/move_spell.ts';
import { readFileValue } from './surfaces/cli_args.ts';
import { honeSpellTool } from './tools/hone_spell_tool.ts';

test('renaming and forced replacement retain source identity and rollback across moves', () => {
	const { root, gitDir, seal, cleanup } = createTestGitRoot({
		chapters: [{ name: 'ops', spells: [{ name: 'alpha' }, { name: 'beta' }] }],
	});
	const ctx = { root, gitDir };
	try {
		const first = seal();
		const original = readFileSync(join(root, 'ops/alpha/SKILL.md'), 'utf8');
		writeFileSync(
			join(root, 'ops/beta/SKILL.md'),
			`${original.replaceAll('alpha', 'beta')}\nReplacement history`,
		);
		const replaced = seal(['ops/beta'], 'replacement update');
		const before = rank(ctx, 'ops/alpha');
		moveSpell(root, 'ops/alpha', 'general/gamma', undefined, { gitDir });
		assert.equal(rank(ctx, 'general/gamma'), before);
		const parsed = parseSkillMd(readFileSync(join(root, 'general/gamma/SKILL.md'), 'utf8'));
		assert.ok(parsed.ok);
		assert.equal(parsed.frontmatter.name, 'gamma');
		assert.equal(
			readFileSync(join(root, 'general/gamma/SKILL.md'), 'utf8'),
			original.replace('name: alpha', 'name: gamma'),
		);
		moveSpell(root, 'general/gamma', 'ops/beta', undefined, { gitDir, force: true });
		assert.equal(rank(ctx, 'ops/beta'), before);
		assert.ok(!history(ctx, 'ops/beta').some((entry) => entry.hash === replaced));
		assert.ok(history(ctx, 'ops/beta').some((entry) => entry.hash === first));
		assert.equal(rollback(ctx, 'ops/beta', first).success, true);
		assert.equal(rank(ctx, 'ops/beta'), before);
		assert.equal(
			readFileSync(join(root, 'ops/beta/SKILL.md'), 'utf8'),
			serializeSkillMd(
				{ name: 'beta', description: 'A test spell named alpha' },
				(parseSkillMd(original) as { body: string }).body,
			),
		);
	} finally {
		cleanup();
	}
});

test('unscoped hone succeeds and reports a manually deleted spell', async () => {
	const { root, gitDir, seal, cleanup } = createTestGitRoot({
		chapters: [{ name: 'ops', spells: [{ name: 'alpha' }] }],
	});
	try {
		seal();
		rmSync(join(root, 'ops/alpha'), { recursive: true });
		const result = await honeSpellTool.handler({ root, gitDir }, { message: 'delete' });
		assert.ok(result.ok);
		assert.deepEqual(result.data.sealedPaths, ['ops/alpha']);
		assert.deepEqual(result.data.spells, []);
		assert.ok(history({ root, gitDir }, 'ops/alpha')[0]?.message.includes('delete'));
	} finally {
		cleanup();
	}
});

test('literal @@ strips exactly one @ and malformed opening delimiters are rejected', () => {
	const content = '---\nname: alpha\ndescription: Test\n---\nBody';
	assert.equal(readFileValue(`@@${content}`, 'content'), `@${content}`);
	for (const prefix of ['@', 'text\n', ' ', '\n'])
		assert.equal(parseSkillMd(prefix + content).ok, false);
	assert.equal(parseSkillMd(content.replace('---\n', '---extra\n')).ok, false);
	assert.equal(parseSkillMd(content).ok, true);
});
