import { ok, strictEqual } from 'node:assert/strict';
import { createTestDb } from '../lib/test-db.ts';
import { createTestGitRoot } from '../lib/test-git.ts';
import { createTestRoot } from '../lib/test-root.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import type {
	ToolFailure,
	ToolNeedsClarification,
	ToolResult,
	ToolSuccess,
} from '../tools/tool_types.ts';
import type { GrimoireSkill } from './skill_types.ts';

export function createSkillTestCtx(): {
	ctx: GrimoireToolContext;
	cleanup: () => void;
} {
	const { root, cleanup: cleanupRoot } = createTestRoot();
	const db = createTestDb();
	return {
		ctx: { root, db },
		cleanup: cleanupRoot,
	};
}

export function createSkillTestCtxWithGit(): {
	ctx: GrimoireToolContext;
	seal: (paths?: string[], message?: string) => string;
	cleanup: () => void;
} {
	const { root, gitDir, seal, cleanup: cleanupGit } = createTestGitRoot();
	const db = createTestDb();
	return {
		ctx: { root, db, gitDir },
		seal,
		cleanup: cleanupGit,
	};
}

export function expectSuccess<T>(result: ToolResult<T>): ToolSuccess<T> {
	strictEqual(result.ok, true);
	ok(result.outcome === 'success' || result.outcome === 'no_op', 'expected success-like outcome');
	return result as ToolSuccess<T>;
}

export function expectNoOp<T>(result: ToolResult<T>): ToolSuccess<T> {
	strictEqual(result.ok, true);
	strictEqual(result.outcome, 'no_op');
	return result as ToolSuccess<T>;
}

export function expectClarification<T>(result: ToolResult<T>): ToolNeedsClarification {
	strictEqual(result.ok, false);
	strictEqual(result.outcome, 'needs_clarification');
	return result as ToolNeedsClarification;
}

export function expectError<T>(result: ToolResult<T>): ToolFailure {
	strictEqual(result.ok, false);
	strictEqual(result.outcome, 'error');
	return result as ToolFailure;
}

export function expectSkillMentionsTools(skill: GrimoireSkill, toolNames: string[]) {
	for (const toolName of toolNames) {
		ok(skill.content.includes(`\`${toolName}\``), `expected content to mention ${toolName}`);
	}
}

export function expectSkillAvoidsDirectApi(skill: GrimoireSkill, apiNames: string[]) {
	for (const apiName of apiNames) {
		strictEqual(
			skill.content.includes(`${apiName}(`),
			false,
			`skill content should not mention direct API ${apiName}()`,
		);
	}
}
