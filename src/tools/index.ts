// Tool definitions
export { dropNoteTool } from './drop_note_tool.ts';
export { honeSpellTool } from './hone_spell_tool.ts';
export { inscribeSpellTool } from './inscribe_spell_tool.ts';
export { inspectGrimoireItemTool } from './inspect_grimoire_item_tool.ts';
export { manageDraftTool } from './manage_draft_tool.ts';
export { manageSpellTool } from './manage_spell_tool.ts';
export { reviewGrimoireTool } from './review_grimoire_tool.ts';
export { runCatalogueTool } from './run_catalogue_tool.ts';
export { scoutSkillsTool } from './scout_skills_tool.ts';
export { searchGrimoireTool } from './search_grimoire_tool.ts';
// Infrastructure — errors
export { translateToolError, withToolHandling } from './tool_errors.ts';
// Mapping + registry
export type { ToolMappingEntry } from './tool_mapping.ts';
export { toolMapping } from './tool_mapping.ts';
// Infrastructure — metadata + schema helpers
export type {
	GrimoireToolContext,
	GrimoireToolDefinition,
	JsonSchema,
	JsonSchemaType,
	ToolDefinitionRegistry,
	ToolEntityKindSet,
	ToolInputDescriptions,
	ToolOutputDescription,
	ToolSideEffects,
} from './tool_metadata.ts';
export {
	arraySchema,
	booleanSchema,
	defineGrimoireTool,
	enumSchema,
	integerSchema,
	literalSchema,
	numberSchema,
	objectSchema,
	oneOfSchema,
	stringSchema,
} from './tool_metadata.ts';

// Infrastructure — names
export {
	dropNoteToolName,
	honeSpellToolName,
	inscribeSpellToolName,
	inspectGrimoireItemToolName,
	manageDraftToolName,
	manageSpellToolName,
	reviewGrimoireToolName,
	runCatalogueToolName,
	scoutSkillsToolName,
	searchGrimoireToolName,
} from './tool_names.ts';

// Infrastructure — next-step hints
export {
	askUserNext,
	catalogueNext,
	honeNext,
	inspectSpellNext,
	manageSpellNext,
	retryNext,
	reviewViewNext,
	searchNext,
	useToolNext,
} from './tool_next.ts';

// Infrastructure — entity refs
export {
	toDraftRef,
	toIndexEntryRef,
	toNoteRef,
	toProvenanceRef,
	toSpellPathRef,
	toSpellRef,
} from './tool_ref.ts';
export {
	getGrimoireToolByName,
	grimoireTools,
	listGrimoireToolDefinitions,
} from './tool_registry.ts';
// Infrastructure — summary helpers
export { summarizeCount, summarizeSpellAction } from './tool_summary.ts';
// Infrastructure — types + constructors
export type {
	ToolBaseResult,
	ToolClarificationCode,
	ToolEntityKind,
	ToolEntityRef,
	ToolErrorCode,
	ToolErrorKind,
	ToolFailure,
	ToolNeedsClarification,
	ToolNextStepHint,
	ToolNextStepHintKind,
	ToolOutcomeKind,
	ToolResult,
	ToolSuccess,
	ToolWarning,
	ToolWarningCode,
} from './tool_types.ts';
export {
	toolFailure,
	toolNeedsClarification,
	toolNoOp,
	toolSuccess,
	toolWarning,
} from './tool_types.ts';
