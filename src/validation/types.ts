export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = {
	severity: ValidationSeverity;
	code: string;
	message: string;
};

export type SpellValidationResult = {
	path: string;
	valid: boolean;
	issues: ValidationIssue[];
};
