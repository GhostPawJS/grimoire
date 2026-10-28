import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { cliCompletion } from './cli_completion.ts';

const commands = [
	{ path: 'spell hone', flags: ['--message', '--note-ids'] },
	{ path: 'spell move', flags: ['--target', '--force'] },
	{ path: 'note drop', flags: ['--source'] },
];
test('bash completion selects nouns, verbs, and flags and registers both names', () => {
	const script = cliCompletion('ghostpaw-grimoire', 'bash', commands);
	assert.match(script, /complete -F _grimoire_complete ghostpaw-grimoire grimoire/);
	const complete = (words: string[], index: number) => {
		const result = spawnSync(
			'bash',
			[
				'-c',
				`${script}\nCOMP_WORDS=(${words.map((word) => `'${word}'`).join(' ')}); COMP_CWORD=${index}; _grimoire_complete; printf '%s\\n' "\${COMPREPLY[@]}"`,
			],
			{ encoding: 'utf8' },
		);
		assert.equal(result.status, 0, result.stderr);
		return result.stdout.trim().split('\n');
	};
	assert.ok(complete(['grimoire', ''], 1).includes('spell'));
	assert.ok(complete(['grimoire', 'spell', ''], 2).includes('hone'));
	assert.ok(!complete(['grimoire', 'spell', ''], 2).includes('drop'));
	assert.ok(complete(['grimoire', 'spell', 'hone', '--'], 3).includes('--message'));
	assert.ok(!complete(['grimoire', 'spell', 'hone', '--'], 3).includes('--target'));
	assert.ok(complete(['grimoire', 'note', 'drop', '--s'], 3).includes('--source'));
});
test('zsh and fish completion register the alias and zsh includes command flags', () => {
	assert.match(cliCompletion('ghostpaw-grimoire', 'zsh', commands), /spell hone.*--message/);
	assert.match(
		cliCompletion('ghostpaw-grimoire', 'zsh', commands),
		/compdef _grimoire_complete ghostpaw-grimoire grimoire/,
	);
	assert.match(cliCompletion('ghostpaw-grimoire', 'fish', commands), /complete -c grimoire/);
});
