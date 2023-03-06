import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import svg from 'vite-plugin-svgo'

export default defineConfig({
  build: {
    outDir: fileURLToPath(new URL('./app/public/', import.meta.url)),
    rollupOptions: {
      input: ['src/js/app.js', 'src/scss/main.scss'],
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].[ext]',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  plugins: [svg()],
})
