/** Preserve SQL NULL while normalizing non-null values returned by database adapters. */
export function nullableString(value: unknown): string | null {
	return value === null ? null : String(value);
}
