import { distillNoteTool } from './distill_note_tool.ts';
import { dropNoteTool } from './drop_note_tool.ts';
import { honeSpellTool } from './hone_spell_tool.ts';
import { inscribeSpellTool } from './inscribe_spell_tool.ts';
import { inspectGrimoireItemTool } from './inspect_grimoire_item_tool.ts';
import { manageDraftTool } from './manage_draft_tool.ts';
import { manageSpellTool } from './manage_spell_tool.ts';
import { reviewGrimoireTool } from './review_grimoire_tool.ts';
import { runCatalogueTool } from './run_catalogue_tool.ts';
import { scoutSkillsTool } from './scout_skills_tool.ts';
import { searchGrimoireTool } from './search_grimoire_tool.ts';
import type { ToolDefinitionRegistry } from './tool_metadata.ts';
import { updateSpellTool } from './update_spell_tool.ts';

export const grimoireTools = [
	searchGrimoireTool,
	reviewGrimoireTool,
	inspectGrimoireItemTool,
	inscribeSpellTool,
	updateSpellTool,
	honeSpellTool,
	manageSpellTool,
	dropNoteTool,
	distillNoteTool,
	manageDraftTool,
	runCatalogueTool,
	scoutSkillsTool,
] as const satisfies ToolDefinitionRegistry;

export function listGrimoireToolDefinitions(): ToolDefinitionRegistry {
	return grimoireTools;
}

export function getGrimoireToolByName(name: string) {
	return grimoireTools.find((t) => t.name === name);
}
