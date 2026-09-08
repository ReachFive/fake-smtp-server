import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Emit relative asset URLs (the old CRA `PUBLIC_URL=./`). The UI is served
  // from the express static root, which may sit behind a proxy prefix -- in
  // ciam-app nginx exposes it as /_emails.
  base: './',
  build: {
    // index.js serves path.join(__dirname, 'build'); both Dockerfiles copy it.
    outDir: 'build',
    emptyOutDir: true,
  },
  server: {
    // CRA's dev-server port; App.js talks to the backend on :1080 in dev.
    port: 3000,
  },
});
