// vite.config.js - Should look like this or similar
import { defineConfig } from 'vite';
export default defineConfig({
  resolve: { alias: { 'ethers5': 'ethers' } },
  // NO server.rewrite or appType: 'spa' unless intentional
});
