import { CliUsageError } from '../surfaces/cli_args.ts';

export function parseCliTime(raw: string): number {
	raw = raw.trim();
	const value = /^[+-]?\d+$/.test(raw)
		? Number(raw)
		: /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(raw)
			? Date.parse(raw)
			: Number.NaN;
	if (!Number.isSafeInteger(value) || !Number.isFinite(new Date(value).getTime()))
		throw new CliUsageError(
			'Expected epoch milliseconds, ISO 8601 date-time, or YYYY-MM-DD for now',
		);
	return value;
}
