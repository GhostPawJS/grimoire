import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { GrimoireValidationError } from '../errors.ts';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { adoptSpell } from '../scouting/adopt_spell.ts';
import { fetchSkills } from '../scouting/fetch_skills.ts';
import { scanStaging } from '../scouting/scan_staging.ts';
import { scout } from '../scouting/scout.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { inscribe } from '../spells/inscribe.ts';
import { updateSpell } from '../spells/update_spell.ts';
import { grimoireCliOptions } from '../surface/grimoire_cli_options.ts';
import { grimoireToolExamples } from '../surface/grimoire_tool_examples.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { grimoireTools } from '../tools/tool_registry.ts';
import { validateToolInput } from '../tools/validate_tool_input.ts';
import { validate } from './validate.ts';
import { validateAll } from './validate_all.ts';

const content =
	'---\nname: example\ndescription: Example\nlicense: [MIT]\ncustom: surprise\n---\nBody';

test('strict frontmatter validation promotes only YAML value and unknown field warnings', () => {
	const ordinary = validateSkillMd(content);
	assert.equal(ordinary.valid, true);
	assert.equal(ordinary.warnings.length, 2);
	assert.deepEqual(validateSkillMd(content, { strict: false }), ordinary);
	const strict = validateSkillMd(content, { strict: true });
	assert.equal(strict.valid, false);
	assert.ok(strict.errors.some((e) => e.includes('license') && e.includes('[MIT]')));
	assert.ok(strict.errors.some((e) => e.includes('custom') && e.includes('surprise')));
	assert.deepEqual(strict.warnings, []);
	const long = validateSkillMd(content.replace('Body', 'Body\n'.repeat(502)), { strict: true });
	assert.ok(long.warnings.includes('body exceeds 500 lines'));
	const clean = content.replace('license: [MIT]\ncustom: surprise\n', '');
	assert.equal(validateSkillMd(clean, { strict: true }).valid, true);
	assert.equal(
		validateSkillMd(clean.replace('Body', 'Body\n'.repeat(502)), { strict: true }).valid,
		true,
	);
});

test('library and CLI validation preserve warnings by default and fail in strict mode', async () => {
	const { root, cleanup } = createTestRoot();
	try {
		mkdirSync(join(root, 'general/example'), { recursive: true });
		writeFileSync(join(root, 'general/example/SKILL.md'), content);
		assert.equal(validate(root, 'general/example').valid, true);
		assert.equal(validate(root, 'general/example', { strict: true }).valid, false);
		assert.equal(validateAll(root, { strict: true })[0]?.valid, false);
		assert.ok(
			validate(root, 'general/example', { strict: true }).issues.some(
				(i) => i.code === 'unknown-frontmatter-field' && i.severity === 'error',
			),
		);
		for (const args of [
			['review', 'validation'],
			['inspect', 'general/example'],
		]) {
			for (const strict of [false, true]) {
				let output = '';
				const code = await runToolCli(
					[
						...args,
						'--root',
						root,
						'--db',
						join(root, 'test.db'),
						'--json',
						...(strict ? ['--strict'] : []),
					],
					{
						...grimoireCliOptions,
						stdin: Readable.from([]),
						stdout: new Writable({
							write(chunk, _encoding, cb) {
								output += String(chunk);
								cb();
							},
						}),
						stderr: new Writable({
							write(_chunk, _encoding, cb) {
								cb();
							},
						}),
					},
				);
				assert.equal(code, strict ? 2 : 0, output);
				assert.match(output, /license|Unsupported frontmatter/);
			}
		}
	} finally {
		cleanup();
	}
});

test('strict errors identify malformed values, including quoted scalars and nested values', () => {
	for (const [field, value] of [
		['license', '>2'],
		['license', '"unterminated'],
		['metadata', '\n  nested: [bad]'],
	] as const) {
		const text = `---\nname: example\ndescription: Example\n${field}: ${value}\n---\nBody`;
		assert.equal(validateSkillMd(text).valid, true);
		const result = validateSkillMd(text, { strict: true });
		assert.equal(result.valid, false);
		assert.ok(
			result.errors.some(
				(e) => e.includes(field === 'metadata' ? 'nested' : field) && e.includes(value.trim()),
			),
			result.errors.join('; '),
		);
	}
});

test('strict write and scouting validation rejects before changing spell content', async () => {
	const { root, cleanup } = createTestRoot();
	const db = createTestDb();
	try {
		const source = join(root, 'source');
		const target = join(root, 'target');
		mkdirSync(source);
		writeFileSync(join(source, 'SKILL.md'), content);
		assert.equal(scanStaging(source)[0]?.valid, true);
		assert.equal(scanStaging(source, { strict: true })[0]?.valid, false);
		const handle = await fetchSkills(source, { strict: true });
		try {
			assert.equal(handle.skills[0]?.valid, false);
		} finally {
			handle.cleanup();
		}
		assert.throws(
			() => inscribe(target, undefined, { name: 'example', content, strict: true }),
			GrimoireValidationError,
		);
		assert.throws(
			() => adoptSpell(target, undefined, source, { strict: true }),
			GrimoireValidationError,
		);
		assert.equal(existsSync(join(target, 'general/example/SKILL.md')), false);
		const path = join(target, 'general/example');
		mkdirSync(path, { recursive: true });
		const clean = content.replace('license: [MIT]\ncustom: surprise\n', '');
		writeFileSync(join(path, 'SKILL.md'), clean);
		assert.throws(
			() => updateSpell(target, 'general/example', content, { strict: true }),
			GrimoireValidationError,
		);
		assert.equal(readFileSync(join(path, 'SKILL.md'), 'utf8'), clean);
		updateSpell(target, 'general/example', content);
		assert.equal(readFileSync(join(path, 'SKILL.md'), 'utf8'), content);
		// Strict scouting rejects the invalid source before adoption.
		await assert.rejects(
			() => scout(target, db, source, { strict: true }),
			GrimoireValidationError,
		);
		for (const name of [
			'inscribe_spell',
			'update_spell',
			'inspect_grimoire_item',
			'review_grimoire',
			'scout_skills',
		]) {
			const tool = grimoireTools.find((tool) => tool.name === name);
			assert.ok(tool);
			assert.equal(tool.inputSchema.properties?.strict?.type, 'boolean');
			const example = grimoireToolExamples[name];
			assert.equal(validateToolInput(tool.inputSchema, { ...example, strict: true }), undefined);
			assert.ok(validateToolInput(tool.inputSchema, { ...example, strict: 'true' }));
		}
		for (const args of [
			['spell', 'inscribe', 'example', '--content', content],
			['spell', 'update', 'general/example', '--content', content],
			['scout', 'adopt', source],
		]) {
			let output = '';
			const code = await runToolCli(
				[...args, '--root', target, '--db', join(root, 'test.db'), '--strict', '--json'],
				{
					...grimoireCliOptions,
					stdin: Readable.from([]),
					stdout: new Writable({
						write(chunk, _encoding, cb) {
							output += String(chunk);
							cb();
						},
					}),
					stderr: new Writable({
						write(chunk, _encoding, cb) {
							output += String(chunk);
							cb();
						},
					}),
				},
			);
			assert.equal(code, 2, output);
			assert.match(output, /license/);
			assert.match(output, /custom/);
		}
	} finally {
		db.close();
		cleanup();
	}
});
