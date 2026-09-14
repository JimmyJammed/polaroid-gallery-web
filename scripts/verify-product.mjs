import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
assert.match(readFileSync('dist/index.html', 'utf8'), /Tactile Photo Gallery/);
for (const file of ['dist/library/index.js', 'dist/library/index.d.ts', 'dist/library/react.js', 'dist/library/scroll.js', 'dist/examples/react/index.html', 'dist/images/scene-1.svg']) assert.ok(existsSync(file), `Missing ${file}`);
if (process.env.VERIFY_BASE_URL) {
  for (const path of ['/images/scene-1.svg', '/images/scene-12.svg', '/examples/react/']) assert.equal((await fetch(process.env.VERIFY_BASE_URL + path)).status, 200, path);
}
console.log('Gallery library, declarations, React example and sample images verified.');
