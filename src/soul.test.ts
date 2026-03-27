import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	grimoireSoul,
	grimoireSoulEssence,
	grimoireSoulTraits,
	renderGrimoireSoulPromptFoundation,
} from './soul.ts';

describe('grimoireSoul', () => {
	it('has the expected slug', () => {
		assert.equal(grimoireSoul.slug, 'librarian');
	});

	it('has a non-empty name', () => {
		assert.ok(grimoireSoul.name.length > 0);
	});

	it('has a non-empty description', () => {
		assert.ok(grimoireSoul.description.length > 0);
	});
});

describe('grimoireSoulEssence', () => {
	it('is a non-empty string', () => {
		assert.ok(grimoireSoulEssence.length > 0);
	});
});

describe('grimoireSoulTraits', () => {
	it('has at least one trait', () => {
		assert.ok(grimoireSoulTraits.length > 0);
	});

	it('each trait has principle and provenance', () => {
		for (const trait of grimoireSoulTraits) {
			assert.ok(trait.principle.length > 0);
			assert.ok(trait.provenance.length > 0);
		}
	});
});

describe('renderGrimoireSoulPromptFoundation', () => {
	it('returns a non-empty string containing the soul name', () => {
		const result = renderGrimoireSoulPromptFoundation();
		assert.ok(result.length > 0);
		assert.ok(result.includes('Librarian'));
	});

	it('includes the essence', () => {
		const result = renderGrimoireSoulPromptFoundation();
		assert.ok(result.includes('Essence:'));
	});

	it('includes all traits', () => {
		const result = renderGrimoireSoulPromptFoundation();
		for (const trait of grimoireSoulTraits) {
			assert.ok(result.includes(trait.principle));
		}
	});

	it('accepts a custom soul', () => {
		const custom: typeof grimoireSoul = { ...grimoireSoul, name: 'Custom', slug: 'custom' };
		const result = renderGrimoireSoulPromptFoundation(custom);
		assert.ok(result.includes('Custom'));
		assert.ok(!result.includes('Librarian (librarian)'));
	});
});
