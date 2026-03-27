import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as names from './tool_names.ts';
import {
	getGrimoireToolByName,
	grimoireTools,
	listGrimoireToolDefinitions,
} from './tool_registry.ts';

describe('grimoireTools', () => {
	it('contains exactly 10 tools', () => {
		assert.equal(grimoireTools.length, 10);
	});

	it('has unique names', () => {
		const toolNames = grimoireTools.map((t) => t.name);
		assert.equal(new Set(toolNames).size, toolNames.length);
	});

	it('includes all declared tool names', () => {
		const registeredNames = new Set(grimoireTools.map((t) => t.name));
		for (const name of Object.values(names)) {
			assert.ok(registeredNames.has(name), `Tool "${name}" not in registry.`);
		}
	});
});

describe('listGrimoireToolDefinitions', () => {
	it('returns the tools array', () => {
		assert.equal(listGrimoireToolDefinitions(), grimoireTools);
	});
});

describe('getGrimoireToolByName', () => {
	it('finds a tool by name', () => {
		const tool = getGrimoireToolByName(names.searchGrimoireToolName);
		assert.ok(tool);
		assert.equal(tool.name, names.searchGrimoireToolName);
	});

	it('returns undefined for unknown name', () => {
		assert.equal(getGrimoireToolByName('nonexistent'), undefined);
	});
});
