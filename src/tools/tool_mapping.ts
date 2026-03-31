import {
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
	updateSpellToolName,
} from './tool_names.ts';

export interface ToolMappingEntry {
	api: string;
	tool: string;
	action?: string | undefined;
	view?: string | undefined;
}

export const toolMapping: readonly ToolMappingEntry[] = [
	// Read — search / index
	{ api: 'buildIndex', tool: searchGrimoireToolName },
	{ api: 'formatIndex', tool: reviewGrimoireToolName, view: 'index' },
	{ api: 'searchIndex', tool: searchGrimoireToolName },

	// Read — chapters / spells
	{ api: 'listChapters', tool: reviewGrimoireToolName, view: 'chapters' },
	{ api: 'listSpells', tool: reviewGrimoireToolName, view: 'chapters' },
	{ api: 'getSpell', tool: inspectGrimoireItemToolName },
	{ api: 'getContent', tool: inspectGrimoireItemToolName },
	{ api: 'renderContent', tool: inspectGrimoireItemToolName },

	// Read — git
	{ api: 'rank', tool: inspectGrimoireItemToolName },
	{ api: 'tier', tool: inspectGrimoireItemToolName },
	{ api: 'tierInfo', tool: inspectGrimoireItemToolName },
	{ api: 'allRanks', tool: reviewGrimoireToolName, view: 'index' },
	{ api: 'history', tool: inspectGrimoireItemToolName },
	{ api: 'pendingChanges', tool: honeSpellToolName },
	{ api: 'diff', tool: inspectGrimoireItemToolName },
	{ api: 'isGitAvailable', tool: inspectGrimoireItemToolName },

	// Read — events / resonance
	{ api: 'resonance', tool: inspectGrimoireItemToolName },
	{ api: 'allResonance', tool: reviewGrimoireToolName, view: 'resonance' },
	{ api: 'eventsSince', tool: reviewGrimoireToolName, view: 'health' },

	// Read — health
	{ api: 'catalogueReadiness', tool: runCatalogueToolName },
	{ api: 'readCatalogue', tool: reviewGrimoireToolName, view: 'health' },

	// Read — notes
	{ api: 'pendingNotes', tool: reviewGrimoireToolName, view: 'notes' },
	{ api: 'pendingNoteCount', tool: reviewGrimoireToolName, view: 'notes' },
	{ api: 'noteCounts', tool: reviewGrimoireToolName, view: 'notes' },
	{ api: 'listNotes', tool: reviewGrimoireToolName, view: 'notes' },

	// Read — drafts
	{ api: 'pendingDrafts', tool: reviewGrimoireToolName, view: 'drafts' },

	// Read — validation
	{ api: 'validate', tool: inspectGrimoireItemToolName },
	{ api: 'validateAll', tool: reviewGrimoireToolName, view: 'validation' },
	{ api: 'checkTierRequirements', tool: inspectGrimoireItemToolName },

	// Read — provenance
	{ api: 'getProvenance', tool: inspectGrimoireItemToolName },
	{ api: 'allProvenance', tool: reviewGrimoireToolName, view: 'provenance' },

	// Read — spec
	{ api: 'parseSkillMd', tool: inspectGrimoireItemToolName },
	{ api: 'serializeSkillMd', tool: inscribeSpellToolName },
	{ api: 'validateSkillMd', tool: inspectGrimoireItemToolName },
	{ api: 'countBodyLines', tool: inspectGrimoireItemToolName },

	// Write — spells
	{ api: 'inscribe', tool: inscribeSpellToolName },
	{ api: 'updateSpell', tool: updateSpellToolName },
	{ api: 'shelve', tool: manageSpellToolName, action: 'shelve' },
	{ api: 'unshelve', tool: manageSpellToolName, action: 'unshelve' },
	{ api: 'moveSpell', tool: manageSpellToolName, action: 'move' },
	{ api: 'deleteSpell', tool: manageSpellToolName, action: 'delete' },
	{ api: 'repair', tool: manageSpellToolName, action: 'repair' },
	{ api: 'repairAll', tool: manageSpellToolName, action: 'repair_all' },

	// Write — git
	{ api: 'seal', tool: honeSpellToolName },
	{ api: 'rollback', tool: manageSpellToolName, action: 'rollback' },

	// Write — events
	{ api: 'logEvent', tool: inspectGrimoireItemToolName },

	// Write — notes
	{ api: 'dropNote', tool: dropNoteToolName },
	{ api: 'dropNotes', tool: dropNoteToolName },
	{ api: 'distill', tool: honeSpellToolName },
	{ api: 'enforceNoteCap', tool: runCatalogueToolName },
	{ api: 'expireNotes', tool: runCatalogueToolName },

	// Write — drafts
	{ api: 'submitDraft', tool: manageDraftToolName, action: 'submit' },
	{ api: 'approveDraft', tool: manageDraftToolName, action: 'approve' },
	{ api: 'dismissDraft', tool: manageDraftToolName, action: 'dismiss' },

	// Write — catalogue
	{ api: 'catalogue', tool: runCatalogueToolName },

	// Network — scouting
	{ api: 'scout', tool: scoutSkillsToolName, action: 'adopt' },
	{ api: 'adoptSpell', tool: scoutSkillsToolName, action: 'adopt' },
	{ api: 'adoptSpells', tool: scoutSkillsToolName, action: 'adopt' },
	{ api: 'fetchSkills', tool: scoutSkillsToolName, action: 'adopt' },
	{ api: 'checkUpdates', tool: scoutSkillsToolName, action: 'check_updates' },
	{ api: 'applyUpdate', tool: scoutSkillsToolName, action: 'apply_update' },

	// Network — registry
	{ api: 'searchSkills', tool: scoutSkillsToolName, action: 'search' },
	{ api: 'analyzeRepo', tool: scoutSkillsToolName, action: 'search' },
	{ api: 'refreshIndex', tool: scoutSkillsToolName, action: 'search' },
] as const;
