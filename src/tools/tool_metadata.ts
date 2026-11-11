import type { GrimoireDb } from '../database.ts';
import { history } from '../git/history.ts';
import type { ToolResult } from './tool_types.ts';
import { validateToolInput } from './validate_tool_input.ts';
import { writeHashes } from './write_hashes.ts';

export type GrimoireToolContext = {
	root: string;
	db?: GrimoireDb | undefined;
	gitDir?: string | undefined;
	/** Whether gitDir came from explicit configuration rather than automatic resolution. */
	gitDirExplicit?: boolean;
};

export type JsonSchemaType =
	| 'array'
	| 'boolean'
	| 'integer'
	| 'null'
	| 'number'
	| 'object'
	| 'string';

export interface JsonSchema {
	pattern?: string | undefined;
	maxLength?: number | undefined;
	type?: JsonSchemaType | undefined;
	description?: string | undefined;
	enum?: ReadonlyArray<boolean | number | string | null> | undefined;
	const?: boolean | number | string | null;
	items?: JsonSchema | undefined;
	properties?: Readonly<Record<string, JsonSchema>> | undefined;
	required?: ReadonlyArray<string> | undefined;
	additionalProperties?: boolean | undefined;
	oneOf?: ReadonlyArray<JsonSchema> | undefined;
}

export type ToolSideEffects = 'none' | 'writes_state';
export type ToolInputDescriptions = Readonly<Record<string, string>>;
export type ToolOutputDescription = string;

export type ToolEntityKindSet = readonly ('spell' | 'note' | 'draft' | 'provenance' | 'cluster')[];

export interface GrimoireToolDefinition<
	TInput = Record<string, unknown>,
	TResult extends ToolResult<unknown> = ToolResult<unknown>,
> {
	name: string;
	description: string;
	whenToUse: string;
	whenNotToUse?: string | undefined;
	sideEffects: ToolSideEffects;
	readOnly: boolean;
	supportsClarification: boolean;
	targetKinds: ToolEntityKindSet;
	inputDescriptions: ToolInputDescriptions;
	outputDescription: ToolOutputDescription;
	inputSchema: JsonSchema;
	handler: {
		bivarianceHack(ctx: GrimoireToolContext, input: TInput): TResult | Promise<TResult>;
	}['bivarianceHack'];
}

// biome-ignore lint/suspicious/noExplicitAny: registry needs to hold heterogeneous tool definitions
export type ToolDefinitionRegistry = readonly GrimoireToolDefinition<any, any>[];

export function defineGrimoireTool<TInput, TResult extends ToolResult<unknown>>(
	tool: GrimoireToolDefinition<TInput, TResult>,
): GrimoireToolDefinition<TInput, TResult> {
	const handler = tool.handler;
	return {
		...tool,
		handler(ctx, input) {
			const failure = validateToolInput(tool.inputSchema, input);
			if (failure) return failure as TResult;
			const action = (input as { action?: string }).action;
			const writesSpell =
				['inscribe_spell', 'update_spell', 'hone_spell', 'manage_spell'].includes(tool.name) ||
				(tool.name === 'scout_skills' && ['adopt', 'apply_update'].includes(action ?? ''));
			if (!writesSpell) return handler(ctx, input);
			const git = { root: ctx.root, ...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}) };
			const before = history(git)[0]?.hash;
			const finish = (result: TResult): TResult => {
				if (
					!result.ok ||
					!('data' in result) ||
					typeof result.data !== 'object' ||
					result.data === null
				)
					return result;
				const data = result.data as Record<string, unknown>;
				const path = [data.to, data.restoredPath, data.path, data.shelvedPath].find(
					(value) => typeof value === 'string',
				) as string | undefined;
				const hashes = writeHashes(ctx, before, path);
				return { ...result, data: { ...data, ...hashes } };
			};
			const result = handler(ctx, input);
			return result instanceof Promise ? result.then(finish) : finish(result);
		},
	};
}

export function stringSchema(description: string, options: Partial<JsonSchema> = {}): JsonSchema {
	return { type: 'string', description, ...options };
}

export function numberSchema(description: string, options: Partial<JsonSchema> = {}): JsonSchema {
	return { type: 'number', description, ...options };
}

export function integerSchema(description: string, options: Partial<JsonSchema> = {}): JsonSchema {
	return { type: 'integer', description, ...options };
}

export function booleanSchema(description: string, options: Partial<JsonSchema> = {}): JsonSchema {
	return { type: 'boolean', description, ...options };
}

export function enumSchema(
	description: string,
	values: ReadonlyArray<boolean | number | string | null>,
): JsonSchema {
	const schema: JsonSchema = { description, enum: values };
	if (values.every((v) => typeof v === 'string')) schema.type = 'string';
	return schema;
}

export function literalSchema(
	value: boolean | number | string | null,
	description?: string,
): JsonSchema {
	const schema: JsonSchema = { const: value };
	if (description !== undefined) schema.description = description;
	return schema;
}

export function arraySchema(items: JsonSchema, description: string): JsonSchema {
	return { type: 'array', description, items };
}

export function objectSchema(
	properties: Record<string, JsonSchema>,
	required: ReadonlyArray<string>,
	description?: string,
): JsonSchema {
	const schema: JsonSchema = { type: 'object', properties, required, additionalProperties: false };
	if (description !== undefined) schema.description = description;
	return schema;
}

export function oneOfSchema(schemas: ReadonlyArray<JsonSchema>, description?: string): JsonSchema {
	const schema: JsonSchema = { type: 'object', oneOf: schemas };
	if (description !== undefined) schema.description = description;
	return schema;
}
