export interface GrimoireRunResult {
	lastInsertRowid: number | bigint;
	changes?: number | bigint | undefined;
}

export interface GrimoireStatement {
	run(...params: unknown[]): GrimoireRunResult;
	get<TRecord extends Record<string, unknown>>(...params: unknown[]): TRecord | undefined;
	all<TRecord extends Record<string, unknown>>(...params: unknown[]): TRecord[];
}

/**
 * SQLite dependency injected into every grimoire operation.
 */
export type GrimoireDb = {
	exec(sql: string): void;
	prepare(sql: string): GrimoireStatement;
	close(): void;
};
