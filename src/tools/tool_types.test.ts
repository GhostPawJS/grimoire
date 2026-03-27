import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	toolFailure,
	toolNeedsClarification,
	toolNoOp,
	toolSuccess,
	toolWarning,
} from './tool_types.ts';

describe('toolWarning', () => {
	it('creates a warning with code and message', () => {
		const w = toolWarning('empty_result', 'no items found');
		assert.equal(w.code, 'empty_result');
		assert.equal(w.message, 'no items found');
	});
});

describe('toolSuccess', () => {
	it('creates a success result with correct shape', () => {
		const result = toolSuccess('created spell', { id: 1 });
		assert.equal(result.ok, true);
		assert.equal(result.outcome, 'success');
		assert.equal(result.summary, 'created spell');
		assert.deepEqual(result.data, { id: 1 });
		assert.deepEqual(result.entities, []);
		assert.equal(result.warnings, undefined);
		assert.equal(result.next, undefined);
	});

	it('includes entities when provided', () => {
		const entities = [{ kind: 'spell' as const, id: 1, title: 'fireball' }];
		const result = toolSuccess('ok', null, { entities });
		assert.deepEqual(result.entities, entities);
	});

	it('includes warnings when non-empty', () => {
		const warnings = [toolWarning('stale', 'data is stale')];
		const result = toolSuccess('ok', null, { warnings });
		assert.deepEqual(result.warnings, warnings);
	});

	it('omits warnings when empty array', () => {
		const result = toolSuccess('ok', null, { warnings: [] });
		assert.equal(result.warnings, undefined);
	});

	it('includes next when non-empty', () => {
		const next = [{ kind: 'ask_user' as const, message: 'confirm?' }];
		const result = toolSuccess('ok', null, { next });
		assert.deepEqual(result.next, next);
	});

	it('omits next when empty array', () => {
		const result = toolSuccess('ok', null, { next: [] });
		assert.equal(result.next, undefined);
	});
});

describe('toolNoOp', () => {
	it('creates a no_op result', () => {
		const result = toolNoOp('nothing changed', { count: 0 });
		assert.equal(result.ok, true);
		assert.equal(result.outcome, 'no_op');
		assert.equal(result.summary, 'nothing changed');
		assert.deepEqual(result.data, { count: 0 });
	});
});

describe('toolFailure', () => {
	it('creates an error result with correct shape', () => {
		const result = toolFailure('domain', 'not_found', 'spell missing', 'Spell #42 not found');
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		assert.equal(result.summary, 'spell missing');
		assert.equal(result.error.kind, 'domain');
		assert.equal(result.error.code, 'not_found');
		assert.equal(result.error.message, 'Spell #42 not found');
		assert.equal(result.error.recovery, undefined);
		assert.equal(result.error.details, undefined);
	});

	it('includes recovery and details when provided', () => {
		const result = toolFailure('system', 'system_error', 'crash', 'disk full', {
			recovery: 'free space',
			details: { disk: '/dev/sda1' },
		});
		assert.equal(result.error.recovery, 'free space');
		assert.deepEqual(result.error.details, { disk: '/dev/sda1' });
	});
});

describe('toolNeedsClarification', () => {
	it('creates a clarification result with correct shape', () => {
		const result = toolNeedsClarification('ambiguous_target', 'Which spell?', ['spell_id']);
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'needs_clarification');
		assert.equal(result.summary, 'Which spell?');
		assert.equal(result.clarification.code, 'ambiguous_target');
		assert.equal(result.clarification.question, 'Which spell?');
		assert.deepEqual(result.clarification.missing, ['spell_id']);
		assert.equal(result.clarification.options, undefined);
	});

	it('includes options when provided', () => {
		const result = toolNeedsClarification('ambiguous_target', 'Which spell?', ['spell_id'], {
			options: [{ label: 'Fireball', value: 1 }],
		});
		assert.deepEqual(result.clarification.options, [{ label: 'Fireball', value: 1 }]);
	});

	it('omits options when empty array', () => {
		const result = toolNeedsClarification('ambiguous_target', 'Which spell?', ['spell_id'], {
			options: [],
		});
		assert.equal(result.clarification.options, undefined);
	});
});

describe('withOptionalFields', () => {
	it('only sets non-empty arrays on the result', () => {
		const result = toolSuccess('ok', null, {
			warnings: [],
			next: [],
		});
		assert.equal(result.warnings, undefined);
		assert.equal(result.next, undefined);

		const result2 = toolSuccess('ok', null, {
			warnings: [toolWarning('stale', 'stale')],
			next: [{ kind: 'ask_user' as const, message: 'confirm?' }],
		});
		assert.equal(result2.warnings?.length, 1);
		assert.equal(result2.next?.length, 1);
	});
});
