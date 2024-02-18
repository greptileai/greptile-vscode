import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    outDir: 'build',
    rollupOptions: {
      input: './src/index.tsx',
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
    chunkSizeWarningLimit: 1600,
  },
  // server: {
  //   proxy: {
  //     "/api": {
  //       target: "http://localhost:3001/",
  //       changeOrigin: true,
  //       // rewrite: (path) => path.replace(/^\/api/, ''),
  //       secure: false
  //     }
  //   }
  // }
})
