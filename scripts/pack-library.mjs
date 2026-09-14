import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const destination = resolve('artifacts');
const stage = resolve('.package-staging');
rmSync(stage, { recursive: true, force: true }); mkdirSync(stage, { recursive: true }); mkdirSync(destination, { recursive: true });
cpSync('dist/library', `${stage}/dist`, { recursive: true });
cpSync('src/styles.css', `${stage}/styles.css`);
for (const name of ['LICENSE.md', 'THIRD_PARTY_LICENSES.md']) {
  const source = name;
  cpSync(source, `${stage}/${name}`);
}
writeFileSync(`${stage}/README.md`, `# Tactile Photo Gallery\n\nInstall this archive with npm install ./tactile-photo-gallery-${version}.tgz. Import createPolaroidGallery from tactile-photo-gallery and import tactile-photo-gallery/styles.css. React: tactile-photo-gallery/react. Presets: tactile-photo-gallery/presets. See https://github.com/JimmyJammed/polaroid-gallery-web for the complete API, license and examples.\n`);
writeFileSync(`${stage}/package.json`, JSON.stringify({ name: 'tactile-photo-gallery', version, type: 'module', license: 'SEE LICENSE IN LICENSE.md', main: './dist/index.js', types: './dist/index.d.ts', sideEffects: ['*.css'], exports: {
  '.': { types: './dist/index.d.ts', import: './dist/index.js' }, './react': { types: './dist/react.d.ts', import: './dist/react.js' }, './scroll': { types: './dist/scroll.d.ts', import: './dist/scroll.js' }, './presets': { types: './dist/presets.d.ts', import: './dist/presets.js' }, './styles.css': './styles.css'
}, dependencies: { gsap: '3.15.0' }, peerDependencies: { react: '>=18 <20' }, peerDependenciesMeta: { react: { optional: true } }, files: ['dist', 'styles.css', '*.md'] }, null, 2));
execFileSync('npm', ['pack', '--pack-destination', destination], { cwd: stage, stdio: 'inherit' });
rmSync(stage, { recursive: true, force: true });

const archive = `tactile-photo-gallery-${version}.tgz`;
writeFileSync(`${destination}/${archive}.sha256`, `${createHash('sha256').update(readFileSync(`${destination}/${archive}`)).digest('hex')}  ${archive}\n`);
