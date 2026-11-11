/** Exit codes shared by the command and tool-call CLI syntaxes. */
export function cliErrorCode(code: string | undefined): number | undefined {
	switch (code) {
		case 'validation_failed':
		case 'invalid_input':
			return 2;
		case 'not_found':
			return 3;
		case 'conflict':
			return 4;
		case 'system_error':
			return 70;
	}
}
