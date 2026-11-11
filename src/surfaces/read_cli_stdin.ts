import type { Readable } from 'node:stream';

export async function readCliStdin(stdin: Readable): Promise<string> {
	let text = '';
	for await (const chunk of stdin) text += String(chunk);
	return text;
}
