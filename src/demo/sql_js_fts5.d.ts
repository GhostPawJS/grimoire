declare module 'sql.js-fts5' {
	const initSqlJs: (config?: {
		locateFile?: (fileName: string) => string;
	}) => Promise<unknown>;
	export default initSqlJs;
}
