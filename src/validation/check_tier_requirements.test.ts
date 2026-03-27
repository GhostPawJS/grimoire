import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkTierRequirements } from './check_tier_requirements.ts';

describe('checkTierRequirements', () => {
	it('returns empty for Uncheckpointed', () => {
		const issues = checkTierRequirements('# Heading\n\nContent', 'Uncheckpointed');
		assert.equal(issues.length, 0);
	});

	it('returns empty for Apprentice', () => {
		const issues = checkTierRequirements('# Heading\n\nContent', 'Apprentice');
		assert.equal(issues.length, 0);
	});

	it('warns Journeyman missing failure paths', () => {
		const issues = checkTierRequirements('# Usage\n\nSome content', 'Journeyman');
		assert.ok(issues.some((i) => i.code === 'missing-failure-paths'));
	});

	it('passes Journeyman with failure heading', () => {
		const body = '# Usage\n\n## Failure Recovery\n\nRecovery steps.';
		const issues = checkTierRequirements(body, 'Journeyman');
		assert.ok(!issues.some((i) => i.code === 'missing-failure-paths'));
	});

	it('passes Journeyman with error heading', () => {
		const body = '# Usage\n\n## Error Handling\n\nError steps.';
		const issues = checkTierRequirements(body, 'Journeyman');
		assert.ok(!issues.some((i) => i.code === 'missing-failure-paths'));
	});

	it('warns Expert missing edge cases', () => {
		const body = '# Usage\n\n## Failure Recovery\n\nSteps.';
		const issues = checkTierRequirements(body, 'Expert');
		assert.ok(issues.some((i) => i.code === 'missing-edge-cases'));
	});

	it('passes Expert with edge heading', () => {
		const body = '# Usage\n\n## Failure Recovery\n\nSteps.\n\n## Edge Cases\n\nEdge.';
		const issues = checkTierRequirements(body, 'Expert');
		assert.ok(!issues.some((i) => i.code === 'missing-edge-cases'));
	});

	it('passes Expert with caveat heading', () => {
		const body = '# Usage\n\n## Failure Recovery\n\nSteps.\n\n## Caveats\n\nCaveat details.';
		const issues = checkTierRequirements(body, 'Expert');
		assert.ok(!issues.some((i) => i.code === 'missing-edge-cases'));
	});

	it('warns Master missing compiled summary', () => {
		const body = '# Usage\n\n## Failure Recovery\n\nSteps.\n\n## Edge Cases\n\nEdge.';
		const issues = checkTierRequirements(body, 'Master');
		assert.ok(issues.some((i) => i.code === 'missing-compiled-summary'));
	});

	it('passes Master with compiled summary heading', () => {
		const body =
			'# Usage\n\n## Failure Recovery\n\nSteps.\n\n## Edge Cases\n\nEdge.\n\n## Compiled Summary\n\nSummary.';
		const issues = checkTierRequirements(body, 'Master');
		assert.ok(!issues.some((i) => i.code === 'missing-compiled-summary'));
	});

	it('all issues have warning severity', () => {
		const issues = checkTierRequirements('# Nothing useful', 'Master');
		for (const issue of issues) {
			assert.equal(issue.severity, 'warning');
		}
	});
});
