import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	honeSpellToolName,
	inspectGrimoireItemToolName,
	manageSpellToolName,
	reviewGrimoireToolName,
	runCatalogueToolName,
	searchGrimoireToolName,
} from './tool_names.ts';
import {
	askUserNext,
	catalogueNext,
	honeNext,
	inspectSpellNext,
	manageSpellNext,
	retryNext,
	reviewViewNext,
	searchNext,
	useToolNext,
} from './tool_next.ts';

describe('inspectSpellNext', () => {
	it('returns inspect_item kind with path', () => {
		const hint = inspectSpellNext('ch/spell');
		assert.equal(hint.kind, 'inspect_item');
		assert.equal(hint.tool, inspectGrimoireItemToolName);
		assert.deepEqual(hint.suggestedInput, { path: 'ch/spell' });
	});

	it('includes name in message when provided', () => {
		const hint = inspectSpellNext('ch/spell', 'My Spell');
		assert.ok(hint.message.includes('My Spell'));
	});
});

describe('reviewViewNext', () => {
	it('returns review_view kind', () => {
		const hint = reviewViewNext('chapters');
		assert.equal(hint.kind, 'review_view');
		assert.equal(hint.tool, reviewGrimoireToolName);
		assert.deepEqual(hint.suggestedInput, { view: 'chapters' });
	});

	it('uses custom message when provided', () => {
		const hint = reviewViewNext('chapters', 'Look at chapters.');
		assert.equal(hint.message, 'Look at chapters.');
	});
});

describe('useToolNext', () => {
	it('returns use_tool kind with tool and message', () => {
		const hint = useToolNext('some_tool', 'Do something.');
		assert.equal(hint.kind, 'use_tool');
		assert.equal(hint.tool, 'some_tool');
		assert.equal(hint.message, 'Do something.');
	});

	it('omits suggestedInput when not provided', () => {
		const hint = useToolNext('some_tool', 'Do something.');
		assert.equal(hint.suggestedInput, undefined);
	});

	it('includes suggestedInput when provided', () => {
		const hint = useToolNext('t', 'msg', { q: 'val' });
		assert.deepEqual(hint.suggestedInput, { q: 'val' });
	});
});

describe('honeNext', () => {
	it('returns use_tool kind for hone_spell', () => {
		const hint = honeNext();
		assert.equal(hint.kind, 'use_tool');
		assert.equal(hint.tool, honeSpellToolName);
		assert.equal(hint.suggestedInput, undefined);
	});

	it('includes paths in suggestedInput', () => {
		const hint = honeNext(['a/b']);
		assert.deepEqual(hint.suggestedInput, { paths: ['a/b'] });
	});
});

describe('searchNext', () => {
	it('returns use_tool kind for search_grimoire', () => {
		const hint = searchNext('fireball');
		assert.equal(hint.kind, 'use_tool');
		assert.equal(hint.tool, searchGrimoireToolName);
		assert.deepEqual(hint.suggestedInput, { query: 'fireball' });
	});

	it('uses custom message', () => {
		const hint = searchNext('fireball', 'Find it.');
		assert.equal(hint.message, 'Find it.');
	});
});

describe('catalogueNext', () => {
	it('returns use_tool kind for run_catalogue', () => {
		const hint = catalogueNext();
		assert.equal(hint.kind, 'use_tool');
		assert.equal(hint.tool, runCatalogueToolName);
	});
});

describe('manageSpellNext', () => {
	it('returns use_tool kind for manage_spell', () => {
		const hint = manageSpellNext('shelve', 'ch/spell');
		assert.equal(hint.kind, 'use_tool');
		assert.equal(hint.tool, manageSpellToolName);
		assert.deepEqual(hint.suggestedInput, { action: 'shelve', path: 'ch/spell' });
	});

	it('omits path when not provided', () => {
		const hint = manageSpellNext('repair');
		assert.deepEqual(hint.suggestedInput, { action: 'repair' });
	});
});

describe('askUserNext', () => {
	it('returns ask_user kind without tool', () => {
		const hint = askUserNext('What should I do?');
		assert.equal(hint.kind, 'ask_user');
		assert.equal(hint.message, 'What should I do?');
		assert.equal(hint.tool, undefined);
	});
});

describe('retryNext', () => {
	it('returns retry_with kind', () => {
		const hint = retryNext('Try again.');
		assert.equal(hint.kind, 'retry_with');
		assert.equal(hint.message, 'Try again.');
	});

	it('includes suggestedInput when provided', () => {
		const hint = retryNext('Try again.', { name: 'fix' });
		assert.deepEqual(hint.suggestedInput, { name: 'fix' });
	});
});
