// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path'; // Import the 'resolve' function from 'path'

export default defineConfig({
  // Set the root relative to the vite.config.js file itself
  // Since vite.config.js is in webapp/, root should be '.'
  root: '.',
  //base: '/', // Keep base path explicit
  resolve: {
    alias: {
      'ethers5': 'ethers',
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Define each HTML page as an entry point
        // The key is the logical name, the value is the path relative to the 'root' defined above
        main: resolve(__dirname, 'index.html'), // Landing page
        checker: resolve(__dirname, 'checker.html'),
        presale: resolve(__dirname, 'presale.html'),
      },
    },
    outDir: 'dist', // Ensure output directory is explicitly 'dist'
  },
});