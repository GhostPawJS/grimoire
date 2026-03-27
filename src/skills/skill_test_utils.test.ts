import { ok, strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import {
	createSkillTestCtx,
	createSkillTestCtxWithGit,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('skill_test_utils', () => {
	it('createSkillTestCtx returns a usable context', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			ok(ctx.root);
			ok(ctx.db);
			const result = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'chapters' }));
			strictEqual(result.ok, true);
		} finally {
			cleanup();
		}
	});

	it('createSkillTestCtxWithGit provides git context and seal', () => {
		const { ctx, seal, cleanup } = createSkillTestCtxWithGit();
		try {
			ok(ctx.root);
			ok(ctx.db);
			ok(ctx.gitDir);
			ok(typeof seal === 'function');
		} finally {
			cleanup();
		}
	});

	it('expectSkillMentionsTools passes for present tools and throws for missing', () => {
		const skill = {
			name: 'test',
			description: 'Test.',
			content: 'Use `search_grimoire` then `inspect_grimoire_item`.',
		};
		expectSkillMentionsTools(skill, ['search_grimoire', 'inspect_grimoire_item']);
		throws(() => expectSkillMentionsTools(skill, ['inscribe_spell']));
	});

	it('expectSkillAvoidsDirectApi passes for clean content and throws for violations', () => {
		const clean = { name: 'c', description: 'C.', content: 'Use `search_grimoire`.' };
		expectSkillAvoidsDirectApi(clean, ['inscribe', 'listChapters']);

		const dirty = { name: 'd', description: 'D.', content: 'Call inscribe() directly.' };
		throws(() => expectSkillAvoidsDirectApi(dirty, ['inscribe']));
	});
});
