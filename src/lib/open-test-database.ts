import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { GrimoireDb, GrimoireRunResult, GrimoireStatement } from '../database.ts';

export function openTestDatabase(): GrimoireDb {
	const raw = new DatabaseSync(':memory:');
	raw.exec('PRAGMA journal_mode = WAL');
	raw.exec('PRAGMA foreign_keys = ON');

	return {
		exec(sql: string): void {
			raw.exec(sql);
		},
		prepare(sql: string): GrimoireStatement {
			const stmt = raw.prepare(sql);
			return {
				run(...params: unknown[]): GrimoireRunResult {
					return stmt.run(...(params as SQLInputValue[])) as GrimoireRunResult;
				},
				get<TRecord extends Record<string, unknown>>(...params: unknown[]): TRecord | undefined {
					const row = stmt.get(...(params as SQLInputValue[]));
					return row ? ({ ...row } as TRecord) : undefined;
				},
				all<TRecord extends Record<string, unknown>>(...params: unknown[]): TRecord[] {
					return stmt.all(...(params as SQLInputValue[])).map((r) => ({ ...r }) as TRecord);
				},
			};
		},
		close(): void {
			raw.close();
		},
	};
}
