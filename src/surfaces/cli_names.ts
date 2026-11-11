export const cliFlagName = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
export const cliPropertyName = (name: string) =>
	name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
