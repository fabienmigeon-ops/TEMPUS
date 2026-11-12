import { readFileSync, existsSync } from 'node:fs';
for (const file of ['dist/index.html','dist/timeline.css','dist/menu.css','dist/menu.js','dist/event-v2.js','dist/event-v2.css','dist/api.js']) {
 if (!existsSync(file) || !readFileSync(file).length) throw new Error('Missing '+file);
}
console.log('TEMPUS Sites static assets verified');