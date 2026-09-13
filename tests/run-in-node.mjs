import { JSDOM } from '/tmp/user/1000/opencode/node_modules/jsdom/lib/api.js';
import { readFileSync } from 'node:fs';

const base = '/home/mb_pc/Bureau/Open_code_memoire_neuronation';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'https://example.com/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;

const harness = await import(`${base}/tests/harness.js`);
const mod = await import(`${base}/js/storage/local.js`);
const storageTest = await import(`${base}/tests/storage.test.js`);

const runner = harness.createRunner();
storageTest.register(runner);
runner.render(document.body);

const text = document.body.textContent;
const summary = text.match(/(\d+) réussis, (\d+) échoués/);
console.log('RÉSULTAT:', summary ? summary[0] : 'pas de résumé');
if (summary && summary[2] !== '0') {
  console.log(text);
  process.exit(1);
}
console.log('TOUS LES TESTS PASSENT');
