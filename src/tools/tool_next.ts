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
		message: `Inspect spell ${name ? `"${name}"` : path}; CLI --compact omits body.`,
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
	return useToolNext(
		honeSpellToolName,
		'Seal pending changes to evolve spell ranks.',
		paths ? { paths } : undefined,
	);
}

export function searchNext(query: string, message?: string): ToolNextStepHint {
	return useToolNext(searchGrimoireToolName, message ?? `Search for "${query}".`, { query });
}

export function catalogueNext(): ToolNextStepHint {
	return useToolNext(runCatalogueToolName, 'Run the catalogue maintenance pass.');
}

export function manageSpellNext(action: string, path?: string): ToolNextStepHint {
	return useToolNext(manageSpellToolName, `${action} the spell.`, {
		action,
		...(path ? { path } : {}),
	});
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
