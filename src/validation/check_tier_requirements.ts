import type { Tier } from '../git/types.ts';
import type { ValidationIssue } from './types.ts';

const HEADING_RE = /^#{1,6}\s+/;

function hasHeadingMatching(headings: string[], pattern: RegExp): boolean {
	return headings.some((h) => pattern.test(h));
}

export function checkTierRequirements(body: string, t: Tier): ValidationIssue[] {
	if (t === 'Uncheckpointed' || t === 'Apprentice') return [];

	const headings = body.split('\n').filter((line) => HEADING_RE.test(line));
	const issues: ValidationIssue[] = [];

	if (t === 'Journeyman' || t === 'Expert' || t === 'Master') {
		if (!hasHeadingMatching(headings, /failure|recovery|error/i)) {
			issues.push({
				severity: 'warning',
				code: 'missing-failure-paths',
				message: 'Journeyman+ spells should include failure/recovery paths',
			});
		}
	}

	if (t === 'Expert' || t === 'Master') {
		if (!hasHeadingMatching(headings, /edge|caveat/i)) {
			issues.push({
				severity: 'warning',
				code: 'missing-edge-cases',
				message: 'Expert+ spells should include edge cases',
			});
		}
	}

	if (t === 'Master') {
		if (!hasHeadingMatching(headings, /compiled|summary/i)) {
			issues.push({
				severity: 'warning',
				code: 'missing-compiled-summary',
				message: 'Master spells should include a compiled summary',
			});
		}
	}

	return issues;
}
