import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fetchSkills } from './fetch_skills.ts';

const validSkill = `---
name: fetched-skill
description: A skill for fetch testing
---

# fetched-skill

Body content.
`;

describe('fetchSkills', () => {
	it('discovers skills from a local path', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'grimoire-fetch-skills-'));
		try {
			const skillDir = join(dir, 'fetched-skill');
			mkdirSync(skillDir);
			writeFileSync(join(skillDir, 'SKILL.md'), validSkill);

			const handle = await fetchSkills(dir);
			assert.equal(handle.skills.length, 1);
			assert.equal(handle.skills[0]?.name, 'fetched-skill');
			assert.equal(handle.skills[0]?.valid, true);
			assert.equal(handle.source, dir);
			handle.cleanup();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('cleanup is a no-op for local sources', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'grimoire-fetch-skills-'));
		try {
			const skillDir = join(dir, 'fetched-skill');
			mkdirSync(skillDir);
			writeFileSync(join(skillDir, 'SKILL.md'), validSkill);

			const handle = await fetchSkills(dir);
			handle.cleanup();
			const handle2 = await fetchSkills(dir);
			assert.equal(handle2.skills.length, 1);
			handle2.cleanup();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('returns empty skills for empty directory', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'grimoire-fetch-skills-'));
		try {
			const handle = await fetchSkills(dir);
			assert.equal(handle.skills.length, 0);
			handle.cleanup();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('handles relative local path', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'grimoire-fetch-skills-'));
		try {
			const handle = await fetchSkills(dir);
			assert.equal(typeof handle.cleanup, 'function');
			handle.cleanup();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('discovers multiple skills from local path', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'grimoire-fetch-skills-'));
		try {
			for (const name of ['skill-a', 'skill-b']) {
				const skillDir = join(dir, name);
				mkdirSync(skillDir);
				writeFileSync(
					join(skillDir, 'SKILL.md'),
					`---\nname: ${name}\ndescription: Skill ${name}\n---\n\n# ${name}\n\nBody.\n`,
				);
			}

			const handle = await fetchSkills(dir);
			assert.equal(handle.skills.length, 2);
			handle.cleanup();
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

it('scans only the folder named by a GitHub tree URL', async (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-subpath-'));
	try {
		for (const name of ['pdf', 'other']) {
			mkdirSync(join(dir, 'repo-HEAD', 'skills', name), { recursive: true });
			writeFileSync(
				join(dir, 'repo-HEAD', 'skills', name, 'SKILL.md'),
				`---\nname: ${name}\ndescription: Skill ${name}.\n---\n# ${name}\n`,
			);
		}
		execFileSync('tar', ['czf', join(dir, 'a.tgz'), '-C', dir, 'repo-HEAD']);
		const archive = readFileSync(join(dir, 'a.tgz'));
		t.mock.method(globalThis, 'fetch', async () => new Response(archive));
		const handle = await fetchSkills('https://github.com/o/r/tree/HEAD/skills/pdf');
		try {
			assert.deepEqual(
				handle.skills.map((skill) => skill.name),
				['pdf'],
			);
		} finally {
			handle.cleanup();
		}
		await assert.rejects(fetchSkills('https://github.com/o/r/tree/HEAD/..%2F..%2Fetc'));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
