import { defineConfig } from 'vite';
export default defineConfig({ build: { manifest: true, rollupOptions: { input: { demo: 'index.html', react: 'examples/react/index.html', hydration: 'examples/react/hydrate.tsx' } } } });
