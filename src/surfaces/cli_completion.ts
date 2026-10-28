interface CompletionCommand {
	path: string;
	flags: string[];
}

export function cliCompletion(bin: string, shell: string, commands: CompletionCommand[]): string {
	const nouns = [...new Set(commands.map((command) => command.path.split(' ')[0]))];
	const globals = '--help --json --quiet --root --db --git-dir';
	const cases = nouns.map((noun) => {
		const verbs = commands
			.filter((command) => command.path.startsWith(`${noun} `))
			.map((command) => command.path.split(' ')[1]);
		return `    '${noun}') words='${verbs.length ? verbs.join(' ') : (commands.find((command) => command.path === noun)?.flags.join(' ') ?? '')} ${globals}' ;;`;
	});
	const flags = commands.map(
		(command) => `    '${command.path}') words='${command.flags.join(' ')} ${globals}' ;;`,
	);
	const aliases = [...new Set([bin, 'grimoire'])].join(' ');
	if (shell === 'bash')
		return `_grimoire_complete() {
  local cur="\${COMP_WORDS[COMP_CWORD]}" words='${nouns.join(' ')} completion completions ${globals}'
  if (( COMP_CWORD == 2 )); then
    case "\${COMP_WORDS[1]}" in
${cases.join('\n')}
    esac
  elif (( COMP_CWORD > 2 )); then
    case "\${COMP_WORDS[1]} \${COMP_WORDS[2]}" in
${flags.join('\n')}
    esac
  fi
  COMPREPLY=( $(compgen -W "$words" -- "$cur") )
}
complete -F _grimoire_complete ${aliases}
`;
	if (shell === 'zsh')
		return `#compdef ${aliases}
_grimoire_complete() {
  local words_list='${nouns.join(' ')} completion completions ${globals}'
  case "$CURRENT" in
    3) case "$words[2]" in
${cases.join('\n').replaceAll('words=', 'words_list=')}
    esac ;;
    *) case "$words[2] $words[3]" in
${flags.join('\n').replaceAll('words=', 'words_list=')}
    esac ;;
  esac
  compadd -- \${=words_list}
}
compdef _grimoire_complete ${aliases}
`;
	return `${aliases
		.split(' ')
		.map((name) => `complete -c ${name} -f -a '${nouns.join(' ')}'`)
		.join('\n')}\n`;
}
