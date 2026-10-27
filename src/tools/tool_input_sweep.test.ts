import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { grimoireToolExamples } from '../surface/grimoire_tool_examples.ts';
import type { ToolDefinitionRegistry } from './tool_metadata.ts';
import { grimoireTools } from './tool_registry.ts';

test('all tools and action variants reject malformed input without throwing or system errors', async () => {
	const { root, cleanup } = createTestRoot();
	const db = createTestDb();
	try {
		for (const tool of grimoireTools as ToolDefinitionRegistry) {
			const properties = tool.inputSchema.properties ?? {};
			const discriminator = properties.action ? 'action' : properties.view ? 'view' : undefined;
			const actions = (discriminator ? properties[discriminator]?.enum : undefined) ?? [undefined];
			const actionInputs: Record<string, Record<string, unknown>> = {
				submit: { title: 'Title', rationale: 'Evidence', chapter: 'ops', noteIds: [1] },
				approve: { draftId: 1 },
				dismiss: { draftId: 1 },
				shelve: { path: 'ops/example' },
				unshelve: { path: 'ops/example' },
				move: { path: 'ops/example', target: 'ops/other' },
				delete: { path: 'ops/example' },
				repair: { path: 'ops/example' },
				rollback: { path: 'ops/example', ref: 'deadbeef' },
				search: { query: 'pdf' },
				adopt: { source: '/nonexistent/fixture' },
				apply_update: { path: 'ops/example' },
			};
			for (const action of actions) {
				const base: Record<string, unknown> = {
					...grimoireToolExamples[tool.name],
					...(action === undefined || !discriminator ? {} : { [discriminator]: action }),
					...(discriminator === 'action' ? actionInputs[String(action)] : {}),
				};
				const cases: unknown[] = [{}, null, undefined, [], 'wrong', 42, false];
				for (const [name, property] of Object.entries(properties)) {
					for (const wrong of [null, '', ' ', [], {}, true, 1]) {
						if (
							(property.type === 'array' && Array.isArray(wrong)) ||
							typeof wrong === property.type ||
							(property.type === 'integer' && typeof wrong === 'number')
						) {
							if (wrong !== '' && wrong !== ' ') continue;
						}
						cases.push({ ...base, [name]: wrong });
					}
					if (property.enum) cases.push({ ...base, [name]: 'unknown-enum' });
				}
				const required = new Set([...(tool.inputSchema.required ?? []), ...Object.keys(base)]);
				for (const name of required) {
					const candidate = { ...base };
					delete candidate[name];
					// Only required fields are removed: optional omissions can perform valid writes or network requests.
					if (
						tool.inputSchema.required?.includes(name) ||
						(discriminator === 'action' && Object.hasOwn(actionInputs[String(action)] ?? {}, name))
					)
						cases.push(candidate);
				}
				for (const input of cases) {
					const result = await tool.handler({ root, db }, input);
					assert.ok(result && typeof result === 'object', `${tool.name}/${String(action)}`);
					assert.ok(['success', 'no_op', 'error', 'needs_clarification'].includes(result.outcome));
					if (result.outcome === 'error') {
						assert.notEqual(
							result.error.code,
							'system_error',
							`${tool.name}: ${JSON.stringify(input)}`,
						);
						assert.ok(result.error.recovery?.trim(), `${tool.name}: missing recovery`);
					} else if (result.outcome === 'needs_clarification')
						assert.ok(result.clarification.question.trim());
				}
			}
		}
	} finally {
		db.close();
		cleanup();
	}
});
