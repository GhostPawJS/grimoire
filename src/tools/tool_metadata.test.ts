import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	arraySchema,
	booleanSchema,
	defineGrimoireTool,
	enumSchema,
	integerSchema,
	literalSchema,
	numberSchema,
	objectSchema,
	oneOfSchema,
	stringSchema,
} from './tool_metadata.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess } from './tool_types.ts';

describe('stringSchema', () => {
	it('produces a string schema', () => {
		const s = stringSchema('a name');
		assert.equal(s.type, 'string');
		assert.equal(s.description, 'a name');
	});

	it('merges extra options', () => {
		const s = stringSchema('a name', { enum: ['a', 'b'] });
		assert.deepEqual(s.enum, ['a', 'b']);
	});
});

describe('numberSchema', () => {
	it('produces a number schema', () => {
		const s = numberSchema('a score');
		assert.equal(s.type, 'number');
		assert.equal(s.description, 'a score');
	});
});

describe('integerSchema', () => {
	it('produces an integer schema', () => {
		const s = integerSchema('a count');
		assert.equal(s.type, 'integer');
		assert.equal(s.description, 'a count');
	});
});

describe('booleanSchema', () => {
	it('produces a boolean schema', () => {
		const s = booleanSchema('is active');
		assert.equal(s.type, 'boolean');
		assert.equal(s.description, 'is active');
	});
});

describe('enumSchema', () => {
	it('produces an enum schema with string type for all-string values', () => {
		const s = enumSchema('a tier', ['bronze', 'silver', 'gold']);
		assert.equal(s.type, 'string');
		assert.deepEqual(s.enum, ['bronze', 'silver', 'gold']);
		assert.equal(s.description, 'a tier');
	});

	it('omits type for mixed values', () => {
		const s = enumSchema('mixed', ['a', 1]);
		assert.equal(s.type, undefined);
		assert.deepEqual(s.enum, ['a', 1]);
	});
});

describe('literalSchema', () => {
	it('produces a const schema', () => {
		const s = literalSchema('fixed');
		assert.equal(s.const, 'fixed');
		assert.equal(s.description, undefined);
	});

	it('includes description when provided', () => {
		const s = literalSchema(42, 'the answer');
		assert.equal(s.const, 42);
		assert.equal(s.description, 'the answer');
	});
});

describe('arraySchema', () => {
	it('produces an array schema', () => {
		const items = stringSchema('tag');
		const s = arraySchema(items, 'list of tags');
		assert.equal(s.type, 'array');
		assert.equal(s.description, 'list of tags');
		assert.deepEqual(s.items, items);
	});
});

describe('objectSchema', () => {
	it('produces an object schema with additionalProperties false', () => {
		const props = { name: stringSchema('the name') };
		const s = objectSchema(props, ['name'], 'a thing');
		assert.equal(s.type, 'object');
		assert.equal(s.description, 'a thing');
		assert.deepEqual(s.properties, props);
		assert.deepEqual(s.required, ['name']);
		assert.equal(s.additionalProperties, false);
	});

	it('omits description when not provided', () => {
		const s = objectSchema({}, []);
		assert.equal(s.description, undefined);
	});
});

describe('oneOfSchema', () => {
	it('produces a oneOf schema', () => {
		const a = stringSchema('option a');
		const b = numberSchema('option b');
		const s = oneOfSchema([a, b], 'either');
		assert.deepEqual(s.oneOf, [a, b]);
		assert.equal(s.description, 'either');
	});

	it('omits description when not provided', () => {
		const s = oneOfSchema([stringSchema('x')]);
		assert.equal(s.description, undefined);
	});
});

describe('defineGrimoireTool', () => {
	it('is an identity function', () => {
		const tool = defineGrimoireTool({
			name: 'test_tool',
			description: 'a test',
			whenToUse: 'always',
			sideEffects: 'none',
			readOnly: true,
			supportsClarification: false,
			targetKinds: ['spell'],
			inputDescriptions: { id: 'spell id' },
			outputDescription: 'the spell',
			inputSchema: objectSchema({ id: integerSchema('spell id') }, ['id']),
			handler: (_ctx, _input: { id: number }): ToolResult<{ name: string }> => {
				return toolSuccess('found', { name: 'fireball' });
			},
		});
		assert.equal(tool.name, 'test_tool');
		assert.equal(tool.readOnly, true);
		assert.equal(typeof tool.handler, 'function');
	});
});
