import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages 저장소 이름에 맞게 베이스 경로 설정
  base: '/fastivMap1.0/',
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
