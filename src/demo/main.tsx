import { render } from 'preact';
import { App } from './app.tsx';

const host = document.getElementById('app');
if (host === null) {
	throw new Error('Spell Forge root #app not found.');
}

render(<App />, host);
