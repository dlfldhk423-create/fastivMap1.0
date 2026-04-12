import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for deployment (usually './' for mini-apps)
  base: './',
  build: {
    // Ensures all assets are inlined or correctly referenced for a WebView
    assetsInlineLimit: 10000,
    rollupOptions: {
      output: {
        // Keeps file names simple
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      }
    }
  }
});
