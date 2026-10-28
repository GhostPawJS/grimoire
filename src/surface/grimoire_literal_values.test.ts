import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('CLI values are literal except spell content, where @path reads a file and @@ escapes', () => {
	const directory = mkdtempSync(join(tmpdir(), 'grimoire-literal-'));
	const secret = join(directory, 'secret.txt');
	writeFileSync(secret, 'do-not-read');
	const run = (...args: string[]) => {
		const result = spawnSync(
			process.execPath,
			[
				'--no-warnings',
				'--experimental-strip-types',
				fileURLToPath(new URL('../cli.ts', import.meta.url)),
				...args,
				'--db',
				join(directory, 'state.db'),
				'--root',
				join(directory, 'root'),
				'--json',
			],
			{ encoding: 'utf8' },
		);
		assert.ifError(result.error);
		return { code: result.status, json: result.stdout ? JSON.parse(result.stdout) : undefined };
	};
	const body = (name: string, line: string) =>
		`---\nname: ${name}\ndescription: Literal value procedure\n---\n${line}\n`;
	try {
		const note = run('note', 'drop', `@${secret}`, '--source', '@alice');
		assert.equal(note.code, 0);
		const notes = run('review', 'notes');
		const dropped = JSON.stringify(notes.json);
		assert.ok(dropped.includes(`@${secret}`));
		assert.ok(!dropped.includes('do-not-read'));
		assert.ok(dropped.includes('@alice'));

		for (const literal of [`@${secret}`, '@/etc/passwd']) {
			assert.equal(run('note', 'drop', literal, '--source', 'test').code, 0);
			const stored = run('review', 'notes').json.data.notes;
			assert.equal(
				stored.at(-1)?.content === literal ||
					stored.some((entry: { content: string }) => entry.content === literal),
				true,
			);
			const noteId = note.json.data.noteId;
			assert.equal(
				run(
					'draft',
					'submit',
					'literal-draft',
					'--rationale',
					literal,
					'--note-ids',
					String(noteId),
					'--chapter',
					'general',
				).code,
				0,
			);
			assert.ok(
				run('review', 'drafts').json.data.drafts.some(
					(draft: { rationale: string }) => draft.rationale === literal,
				),
			);
			const name = literal === '@/etc/passwd' ? 'system-literal' : 'marker-literal';
			assert.equal(run('spell', 'inscribe', name, '--content', body(name, 'initial')).code, 0);
			writeFileSync(join(directory, 'root', 'general', name, 'SKILL.md'), body(name, 'changed'));
			assert.equal(run('spell', 'hone', `general/${name}`, '--message', literal).code, 0);
			assert.equal(run('inspect', `general/${name}`).json.data.history[0].message, literal);
		}

		const file = join(directory, 'SKILL.md');
		writeFileSync(file, body('from-file', 'Body read from a file'));
		assert.equal(run('spell', 'inscribe', 'from-file', '--content', `@${file}`).code, 0);
		const legacy = join(directory, 'legacy.md');
		writeFileSync(legacy, body('legacy-file', 'Legacy form reads a file'));
		assert.equal(run('inscribe_spell', '--name', 'legacy-file', '--content', `@${legacy}`).code, 0);
		const escaped = run(
			'spell',
			'inscribe',
			'escaped',
			'--content',
			`@@${body('escaped', 'Starts with an at sign')}`,
		);
		assert.equal(escaped.code, 0);
		assert.ok(
			readFileSync(join(directory, 'root', 'general', 'escaped', 'SKILL.md'), 'utf8').startsWith(
				'@---',
			),
		);
		const missing = run('spell', 'update', 'general/from-file', '--content', '@does-not-exist.md');
		assert.equal(missing.code, 2);
		assert.match(JSON.stringify(missing.json), /use @@ for a literal leading @/);
		assert.match(
			readFileSync(join(directory, 'root', 'general', 'from-file', 'SKILL.md'), 'utf8'),
			/Body read from a file/,
		);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
