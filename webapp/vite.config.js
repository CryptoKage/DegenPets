// webapp/vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // root: '.' // Setting root to '.' means 'webapp/' IS the root for Vite's perspective
             // This should be correct.
  // base: '/', // Keep this commented out for now

  // publicDir: 'public' // This tells Vite to look for 'webapp/public/'
                        // This should also be correct by default, but let's be explicit.

  resolve: { alias: { 'ethers5': 'ethers' } },
  build: {
    outDir: 'dist', // Output relative to root, so 'webapp/dist/'
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        checker: resolve(__dirname, 'checker.html'),
        presale: resolve(__dirname, 'presale.html'),
      },
    },
  },
  // Explicitly ensure public dir is handled correctly
  publicDir: 'public', // ADD OR CONFIRM THIS LINE
});