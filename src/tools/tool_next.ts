import {
	honeSpellToolName,
	inspectGrimoireItemToolName,
	manageSpellToolName,
	reviewGrimoireToolName,
	runCatalogueToolName,
	searchGrimoireToolName,
} from './tool_names.ts';
import type { ToolNextStepHint } from './tool_types.ts';

export function inspectSpellNext(path: string, name?: string): ToolNextStepHint {
	return {
		kind: 'inspect_item',
		message: name ? `Inspect spell "${name}".` : `Inspect spell ${path}.`,
		tool: inspectGrimoireItemToolName,
		suggestedInput: { path },
	};
}

export function reviewViewNext(view: string, message?: string): ToolNextStepHint {
	return {
		kind: 'review_view',
		message: message ?? `Review the \`${view}\` view.`,
		tool: reviewGrimoireToolName,
		suggestedInput: { view },
	};
}

export function useToolNext(
	tool: string,
	message: string,
	suggestedInput?: Record<string, unknown>,
): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message,
		tool,
		...(suggestedInput ? { suggestedInput } : {}),
	};
}

export function honeNext(paths?: string[]): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message: 'Seal pending changes to evolve spell ranks.',
		tool: honeSpellToolName,
		...(paths ? { suggestedInput: { paths } } : {}),
	};
}

export function searchNext(query: string, message?: string): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message: message ?? `Search for "${query}".`,
		tool: searchGrimoireToolName,
		suggestedInput: { query },
	};
}

export function catalogueNext(): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message: 'Run the catalogue maintenance pass.',
		tool: runCatalogueToolName,
	};
}

export function manageSpellNext(action: string, path?: string): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message: `${action} the spell.`,
		tool: manageSpellToolName,
		suggestedInput: { action, ...(path ? { path } : {}) },
	};
}

export function askUserNext(message: string): ToolNextStepHint {
	return { kind: 'ask_user', message };
}

export function retryNext(
	message: string,
	suggestedInput?: Record<string, unknown>,
): ToolNextStepHint {
	return { kind: 'retry_with', message, ...(suggestedInput ? { suggestedInput } : {}) };
}
