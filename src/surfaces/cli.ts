import { type Readable, Writable } from 'node:stream';
import { errorMessage } from '../lib/error_message.ts';
import { CliUsageError, readFileValue } from './cli_args.ts';
import { runCliCommand } from './cli_commands.ts';
import { cliErrorCode } from './cli_error_code.ts';
import { cliVersionOutput } from './cli_version.ts';
import { jsonLine } from './json_line.ts';
import { readCliStdin } from './read_cli_stdin.ts';
import { isErrorResult, type JsonSchema, type SurfaceTool } from './surface_types.ts';
import { validateInput } from './validate_input.ts';

export interface ToolCliOptions<TCtx> {
	bin: string;
	version: string;
	description: string;
	describeDb?: (options: { db?: string; root?: string; gitDir?: string }) => string;
	formatResult?: (
		result: unknown,
		tool: SurfaceTool<TCtx>,
		input: Record<string, unknown>,
		quiet: boolean,
		compact?: boolean,
	) => string;
	tools: readonly SurfaceTool<TCtx>[];
	openContext(opts: {
		db?: string;
		root?: string;
		gitDir?: string;
		readOnly?: boolean;
	}): TCtx | Promise<TCtx>;
	closeContext?: (ctx: TCtx) => void | Promise<void>;
	commands?: {
		mcp?: (opts: { db?: string; root?: string; gitDir?: string }) => unknown | Promise<unknown>;
		skill?: (args: string[]) => string | Promise<string>;
	};
	stdin?: Readable & { isTTY?: boolean };
	stdout?: Writable;
	stderr?: Writable;
}
export async function runToolCli<TCtx>(
	argv: string[],
	options: ToolCliOptions<TCtx>,
): Promise<number> {
	const end = argv.indexOf('--');
	if (
		argv
			.slice(0, end < 0 ? argv.length : end)
			.some((arg) => ['--version', '-V', '-v'].includes(arg))
	) {
		if (!(argv.includes('--quiet') || argv.includes('-q')))
			(options.stdout ?? process.stdout).write(
				cliVersionOutput(options.version, argv, { bin: options.bin }),
			);
		return 0;
	}
	const modern = await runCliCommand(argv, options);
	if (modern !== undefined) return modern;
	const quiet = argv.includes('--quiet') || argv.includes('-q');
	const explicitJson = argv.includes('--json') && !argv.includes('tools');
	if (quiet)
		options = {
			...options,
			stdout: new Writable({
				write(_chunk, _encoding, cb) {
					cb();
				},
			}),
		};
	const stdout = options.stdout ?? process.stdout;
	const stderr = options.stderr ?? process.stderr;
	const stdin = options.stdin ?? process.stdin;
	const args = argv.filter(
		(arg) =>
			arg !== '--quiet' &&
			arg !== '-q' &&
			arg !== '--no-color' &&
			!(explicitJson && arg === '--json'),
	);
	let db: string | undefined;
	let root: string | undefined;
	let gitDir: string | undefined;
	let compact = false;
	const fail = (message: string, code = 2) => {
		stderr.write(`${message}\n`);
		if (explicitJson)
			stdout.write(`${JSON.stringify({ ok: false, error: { code: 'cli_error', message } })}\n`);
		return code;
	};
	const failCause = (cause: unknown) =>
		fail(errorMessage(cause), cause instanceof CliUsageError ? 2 : 70);
	for (let i = 0; i < args.length; i++) {
		const token = args[i] as string;
		if (token === '--') break;
		const key = token.split('=')[0];
		if (['--root', '--git-dir', '--db'].includes(key ?? '')) {
			const inline = token.includes('=');
			const value = inline ? token.slice(token.indexOf('=') + 1) : args[i + 1];
			if (!value || (!inline && value.startsWith('--'))) return fail(`${key} requires a path`);
			if (key === '--root') root = value;
			else if (key === '--git-dir') gitDir = value;
			else db = value;
			args.splice(i--, inline ? 1 : 2);
		} else if (token === '--compact') {
			compact = true;
			args.splice(i--, 1);
		}
	}
	const ctxOptions = {
		...(db === undefined ? {} : { db }),
		...(root === undefined ? {} : { root }),
		...(gitDir === undefined ? {} : { gitDir }),
	};
	const command = args.shift() ?? 'help';
	const normalize = (name: string) => name.replace(/[-_]/g, '').toLowerCase();
	if (['help', '--help', '-h'].includes(command)) {
		stdout.write(
			`${options.bin} ${options.version}\n${options.description}\n\nUsage: ${options.bin} [--db path] <command>\nCommands: tools [--json], describe <tool>, call <tool> [JSON|-], <tool> --parameter value, mcp, skill\nOptions: --help, --version [--short|--json], --compact\n\n${options.tools.map((tool) => `${tool.name}  ${tool.description}`).join('\n')}\n`,
		);
		return 0;
	}
	if (['--version', '-V', '-v', 'version'].includes(command)) {
		stdout.write(cliVersionOutput(options.version, argv, { bin: options.bin }));
		return 0;
	}
	if (command === 'tools') {
		stdout.write(
			args.includes('--json')
				? `${JSON.stringify(
						options.tools.map(({ handler: _handler, cli: _cli, ...tool }) => tool),
						null,
						2,
					)}\n`
				: `${options.tools.map((tool) => `${tool.name}\t${tool.description.replace(/\s+/g, ' ')}`).join('\n')}\n`,
		);
		return 0;
	}
	if (command === 'skill') {
		if (!options.commands?.skill) return fail('skill command unavailable');
		try {
			stdout.write(await options.commands.skill(args));
			return 0;
		} catch (error) {
			return fail(errorMessage(error));
		}
	}
	if (command === 'mcp') {
		if (!options.commands?.mcp) return fail('mcp command unavailable');
		await options.commands.mcp(ctxOptions);
		return 0;
	}
	const name = command === 'call' || command === 'describe' ? args.shift() : command;
	const tool = options.tools.find((tool) => normalize(tool.name) === normalize(name ?? ''));
	if (!tool) return fail(`Unknown tool: ${name ?? ''}`);
	if (command === 'describe') {
		stdout.write(
			`${tool.name}\n${tool.description}\nUse when: ${tool.whenToUse ?? ''}\nNot for: ${tool.whenNotToUse ?? ''}\nRead only: ${tool.readOnly ?? false}\n\nParameter | Type | Required | Description\n${Object.entries(
				tool.inputSchema.properties ?? {},
			)
				.map(
					([key, schema]) =>
						`${key} | ${schema.type ?? 'oneOf'} | ${tool.inputSchema.required?.includes(key) ?? false} | ${schema.description ?? ''}`,
				)
				.join('\n')}\n\n${JSON.stringify(tool.inputSchema, null, 2)}\n`,
		);
		return 0;
	}
	let input: unknown = {};
	try {
		if (command === 'call') {
			if (args.length > 1) return fail('Expected a single JSON argument');
			const raw = args[0];
			input = JSON.parse(
				raw === '-' || (raw === undefined && !stdin.isTTY)
					? await readCliStdin(stdin)
					: (raw ?? '{}'),
			);
		} else {
			const values: Record<string, unknown> = {};
			const coerce = (value: string, schema: JsonSchema, property?: string): unknown => {
				if (property && tool.cli?.valueParsers?.[property])
					return tool.cli.valueParsers[property](value);
				if (schema.type === 'number' || schema.type === 'integer') return Number(value);
				if (schema.type === 'boolean') {
					if (!['true', 'false'].includes(value)) throw new Error('Expected true or false');
					return value === 'true';
				}
				if (schema.type === 'object' || schema.type === 'array') return JSON.parse(value);
				if (schema.oneOf) {
					for (const branch of schema.oneOf) {
						try {
							const converted = coerce(value, branch);
							if (!validateInput(branch, converted).length) return converted;
						} catch {
							/* Try the next schema. */
						}
					}
				}
				return value;
			};
			while (args.length) {
				const flag = args.shift();
				if (!flag?.startsWith('--')) return fail(`Expected parameter flag: ${flag}`);
				const equal = flag.indexOf('=');
				const key = equal === -1 ? flag.slice(2) : flag.slice(2, equal);
				const property = Object.keys(tool.inputSchema.properties ?? {}).find(
					(name) => normalize(name) === normalize(key),
				);
				if (!property) return fail(`Unknown parameter: ${key}`);
				const schema = tool.inputSchema.properties?.[property] as JsonSchema;
				let raw =
					equal === -1
						? schema.type === 'boolean' && (!args[0] || args[0].startsWith('--'))
							? 'true'
							: args.shift()
						: flag.slice(equal + 1);
				if (raw === undefined) return fail(`Missing value: ${key}`);
				if (tool.cli?.fileArgs?.includes(property))
					raw = raw === '@-' ? await readCliStdin(stdin) : readFileValue(raw, key);
				if (schema.type === 'array' && !raw.startsWith('[')) {
					const prior = values[property];
					values[property] = [
						...(Array.isArray(prior) ? prior : []),
						coerce(raw, schema.items ?? {}),
					];
				} else values[property] = coerce(raw, schema, property);
			}
			input = values;
		}
	} catch (cause) {
		return fail(`Invalid input: ${errorMessage(cause)}`, 2);
	}
	const errors = validateInput(tool.inputSchema, input);
	if (errors.length) return fail(errors.join('\n'), 2);
	let context: TCtx;
	try {
		context = await options.openContext({
			...ctxOptions,
			...(tool.name === 'review_grimoire' && (input as Record<string, unknown>).view === 'check'
				? { readOnly: true }
				: {}),
		});
	} catch (cause) {
		return failCause(cause);
	}
	try {
		const result = await tool.handler(context, input as Record<string, unknown>);
		stdout.write(jsonLine(result, compact));
		if (
			typeof result === 'object' &&
			result !== null &&
			'outcome' in result &&
			result.outcome === 'needs_clarification'
		)
			return 3;
		if (!isErrorResult(result)) return 0;
		const code = (result as { error?: { code?: string } }).error?.code;
		return cliErrorCode(code) ?? 1;
	} catch (cause) {
		return failCause(cause);
	} finally {
		await options.closeContext?.(context);
	}
}
