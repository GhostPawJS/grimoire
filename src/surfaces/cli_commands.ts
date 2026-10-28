import type { ToolCliOptions } from './cli.ts';
import {
	type CliArgument,
	type CliSpec,
	CliUsageError,
	parseCliArgs,
	renderCliHelp,
} from './cli_args.ts';
import { cliCompletion } from './cli_completion.ts';
import { cliVersionOutput } from './cli_version.ts';
import type { JsonSchema, SurfaceTool } from './surface_types.ts';
import { validateInput } from './validate_input.ts';

export function cliCommands<T>(tools: readonly SurfaceTool<T>[]) {
	return tools.flatMap((tool) => {
		const split = tool.name.indexOf('_');
		const cli = tool.cli ?? { noun: tool.name.slice(split + 1), verb: tool.name.slice(0, split) };
		const action =
			cli.action ??
			(tool.inputSchema.properties?.action?.enum ? { property: 'action' } : undefined);
		const actions = action
			? (tool.inputSchema.properties?.[action.property]?.enum ?? [])
			: [undefined];
		return actions.map((value) => {
			const verb =
				value === undefined ? cli.verb : (action?.verbs?.[String(value)] ?? String(value));
			return {
				tool,
				description: action?.descriptions?.[String(value)] ?? tool.description,
				path: [cli.noun, verb].filter(Boolean).join(' '),
				fixed: action && value !== undefined ? { [action.property]: value } : {},
				positionals: action?.positionals?.[String(value)] ?? cli.positionals ?? [],
				flags: action?.flags?.[String(value)],
			};
		});
	});
}
export async function runCliCommand<T>(
	argv: string[],
	options: ToolCliOptions<T>,
): Promise<number | undefined> {
	const stdout = options.stdout ?? process.stdout;
	const stderr = options.stderr ?? process.stderr;
	const stdin = options.stdin ?? process.stdin;
	const args = [...argv];
	const tree = cliCommands(options.tools);
	let json = argv.includes('--json'),
		quiet = argv.includes('--quiet'),
		compact = false,
		help = false;
	let db: string | undefined;
	let root: string | undefined;
	let gitDir: string | undefined;
	const contextOptions = () => ({
		...(db === undefined ? {} : { db }),
		...(root === undefined ? {} : { root }),
		...(gitDir === undefined ? {} : { gitDir }),
	});
	const fail = (
		message: string,
		code: number,
		errorCode = code === 2 ? 'usage_error' : 'internal_error',
	) => {
		stderr.write(`${message}\n`);
		if (json && !quiet)
			stdout.write(`${JSON.stringify({ ok: false, error: { code: errorCode, message } })}\n`);
		return code;
	};
	const legacy = ['tools', 'describe', 'call', 'mcp', 'skill'];
	let first: string | undefined;
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i] as string;
		if (['--db', '--root', '--git-dir'].includes(token)) {
			i++;
			continue;
		}
		if (token.startsWith('-')) continue;
		first = token;
		break;
	}
	if (
		legacy.includes(first ?? '') ||
		options.tools.some((tool) => tool.name.replace(/[-_]/g, '') === first?.replace(/[-_]/g, ''))
	)
		return undefined;
	try {
		for (let i = 0; i < args.length; i++) {
			const flag = args[i];
			if (flag === '--') break;
			if (
				flag === '--root' ||
				flag === '--git-dir' ||
				flag?.startsWith('--root=') ||
				flag?.startsWith('--git-dir=')
			) {
				const key = flag.split('=')[0];
				const value = flag.includes('=')
					? flag.slice(flag.indexOf('=') + 1)
					: args.splice(i + 1, 1)[0];
				if (!value || value.startsWith('--')) throw new CliUsageError(`${key} requires a path`);
				if (key === '--root') root = value;
				else gitDir = value;
			} else if (flag === '--db' || flag?.startsWith('--db=')) {
				db = flag === '--db' ? args.splice(i + 1, 1)[0] : flag.slice(5);
				if (!db || /^--[a-z]/i.test(db)) throw new CliUsageError('--db requires a path');
			} else if (flag === '--json') json = true;
			else if (flag === '--quiet') quiet = true;
			else if (flag === '--compact') compact = true;
			else if (flag === '--help' || flag === '-h') help = true;
			else if (['--version', '-V', '-v'].includes(flag ?? '')) {
				if (!quiet) stdout.write(cliVersionOutput(options.version, argv, { bin: options.bin }));
				return 0;
			} else if (flag !== '--no-color') continue;
			args.splice(i--, 1);
		}
		if (args[0] === 'version') {
			if (!quiet) stdout.write(cliVersionOutput(options.version, argv, { bin: options.bin }));
			return 0;
		}
		if (args[0] === 'help') {
			help = true;
			args.shift();
		}
		if (!args.length) help = true;
		const entry = tree.find((command) =>
			command.path.split(' ').every((part, i) => args[i] === part),
		);
		const specFor = (command: (typeof tree)[number]): CliSpec => {
			const argument = (name: string, schema: JsonSchema): CliArgument => ({
				name,
				type:
					schema.type === 'object' || !schema.type ? 'json' : (schema.type as CliArgument['type']),
				description: schema.description,
				enum: schema.enum,
				parseValue:
					command.tool.cli?.valueParsers?.[
						name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
					],
				...(command.tool.cli?.fileArgs?.includes(
					name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()),
				)
					? { file: true }
					: {}),
				...(schema.items?.type ? { itemType: schema.items.type as CliArgument['type'] } : {}),
			});
			const properties = command.tool.inputSchema.properties ?? {};
			return {
				command: `${options.bin} ${command.path}`,
				description: command.tool.description,
				positionals: command.positionals.map((name) => ({
					...argument(name, properties[name] ?? {}),
					...(properties[name]?.type === 'array'
						? {
								type: (properties[name]?.items?.type as CliArgument['type']) ?? 'string',
								variadic: true,
							}
						: {}),
				})),
				flags: Object.entries(properties)
					.filter(
						([name]) =>
							!(name in command.fixed) && (!command.flags || command.flags.includes(name)),
					)
					.map(([name, schema]) => ({
						...argument(
							name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
							schema,
						),
						required: false,
						description: `${schema.description ?? ''}${command.tool.inputSchema.required?.includes(name) ? ' (required)' : ''}`,
					})),
			};
		};
		if (
			!entry &&
			args.length === 1 &&
			tree.some((command) => command.path.startsWith(`${args[0]} `))
		)
			help = true;
		const positionalChoices =
			entry?.tool.inputSchema.properties?.[entry.positionals[0] ?? '']?.enum;
		if (
			!help &&
			entry &&
			args.length === entry.path.split(' ').length &&
			positionalChoices?.length
		) {
			if (!quiet)
				stdout.write(
					`Usage: ${options.bin} ${entry.path} <view>\n${positionalChoices.map((value) => `  ${entry.path} ${String(value)}  Review the ${String(value)} view.`).join('\n')}\n`,
				);
			return 0;
		}
		if (help) {
			const matches = tree.filter((command) => command.path.startsWith(args.join(' ')));
			if (!entry && !matches.length) throw new CliUsageError(`Unknown command: ${args.join(' ')}`);
			if (!quiet)
				stdout.write(
					entry
						? renderCliHelp(specFor(entry))
						: `${options.bin} ${options.version}\n${options.description}\n${options.describeDb ? `\n${options.describeDb(contextOptions())}\n` : ''}\nCommands:\n${matches.map((command) => `  ${command.path}  ${command.description}`).join('\n')}\n  mcp, skill, tools [--json], describe <tool>, call <tool> [JSON|-], completions <bash|zsh|fish>, version\nGlobal flags: --db <path>, --root <path>, --git-dir <path>, --json, --quiet, --compact, --help/-h, --version/-V/-v, --no-color\n`,
				);
			return 0;
		}
		if (args[0] === 'completions' || args[0] === 'completion') {
			const shell = args[1];
			if (!['bash', 'zsh', 'fish'].includes(shell ?? ''))
				throw new CliUsageError('Expected completion shell: bash, zsh or fish');
			if (quiet) return 0;
			stdout.write(
				cliCompletion(
					options.bin,
					shell as string,
					tree.flatMap((command) => {
						const flags = (specFor(command).flags ?? []).map((flag) => `--${flag.name}`);
						const choices =
							command.tool.inputSchema.properties?.[command.positionals[0] ?? '']?.enum ?? [];
						return [
							{ path: command.path, flags },
							...choices.map((choice) => ({ path: `${command.path} ${String(choice)}`, flags })),
						];
					}),
				),
			);
			return 0;
		}
		if (!entry) throw new CliUsageError(`Unknown command: ${args.join(' ')}`);
		const rest = args.slice(entry.path.split(' ').length);
		let base: unknown = {};
		const spec = specFor(entry);
		const positionalIndexes: number[] = [];
		let ended = false;
		for (let i = 0; i < rest.length; i++) {
			const token = rest[i] as string;
			if (!ended && token === '--') {
				ended = true;
				continue;
			}
			if (!ended && token.startsWith('--')) {
				const flag = spec.flags?.find((arg) => `--${arg.name}` === token);
				if (!token.includes('=') && flag && flag.type !== 'boolean') i++;
			} else positionalIndexes.push(i);
		}
		const stdinIndex =
			rest[positionalIndexes.at(-1) as number] === '-' ? positionalIndexes.at(-1) : undefined;
		if (stdinIndex !== undefined || (!rest.length && !stdin.isTTY)) {
			if (stdinIndex !== undefined) rest.splice(stdinIndex, 1);
			let raw = '';
			for await (const chunk of stdin) raw += String(chunk);
			try {
				base = raw.trim() ? JSON.parse(raw) : {};
			} catch {
				throw new CliUsageError('Invalid stdin JSON');
			}
			if (!base || typeof base !== 'object' || Array.isArray(base))
				throw new CliUsageError('Expected stdin JSON object');
		}
		const input = { ...(base as object), ...parseCliArgs(rest, spec), ...entry.fixed };
		const errors = validateInput(entry.tool.inputSchema, input);
		if (errors.length) {
			const missing = errors
				.map((error) => /^\$\.([^:]+): required$/.exec(error)?.[1])
				.filter(Boolean);
			throw new CliUsageError(
				`${missing.length ? `Missing required argument: ${missing.join(', ')}.` : errors.join('\n')} Usage: ${spec.command} ${entry.positionals.map((name) => `<${name}>`).join(' ')} [flags]. See ${spec.command} --help.`,
			);
		}
		const context = await options.openContext(contextOptions());
		try {
			const result = await entry.tool.handler(context, input);
			const record = result as {
				ok?: boolean;
				outcome?: string;
				error?: { code?: string; message?: string; recovery?: string };
				clarification?: { question: string; missing: string[] };
				summary?: string;
				data?: unknown;
			};
			const code =
				record.outcome === 'needs_clarification' || record.error?.code === 'not_found'
					? 3
					: ['conflict', 'version_mismatch'].includes(record.error?.code ?? '')
						? 4
						: ['validation_failed', 'invalid_input'].includes(record.error?.code ?? '')
							? 2
							: record.error?.code === 'system_error'
								? 70
								: record.ok === false
									? 1
									: 0;
			if (code) {
				const missing = record.clarification?.missing.map(
					(name) => `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
				);
				stderr.write(
					`${record.clarification?.question ?? record.error?.message ?? record.summary ?? 'Tool failed'}\n${missing?.length ? `Missing: ${missing.join(', ')}\n` : ''}${record.error?.recovery ? `${record.error.recovery}\n` : ''}`,
				);
			}
			if ((json || !(stdout as { isTTY?: boolean }).isTTY) && !quiet)
				stdout.write(`${JSON.stringify(result, null, compact ? undefined : 2)}\n`);
			else if (!code && options.formatResult) {
				stdout.write(options.formatResult(result, entry.tool, input, quiet));
				const warnings = (result as { warnings?: { code?: string; message?: string }[] }).warnings;
				if (!quiet)
					for (const warning of warnings ?? [])
						if (warning.code !== 'empty_result') stderr.write(`warning: ${warning.message}\n`);
			} else if (!quiet && !code)
				stdout.write(`${JSON.stringify(result, null, compact ? undefined : 2)}\n`);
			return code;
		} finally {
			await options.closeContext?.(context);
		}
	} catch (error) {
		return fail(
			error instanceof Error ? error.message : String(error),
			error instanceof CliUsageError ? 2 : 70,
			error instanceof CliUsageError ? error.errorCode : 'internal_error',
		);
	}
}
