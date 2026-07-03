import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          // single window: canvas + Tweakpane overlay (Tab to toggle)
          output: resolve(__dirname, 'src/renderer/output/index.html')
        }
      }
    }
  }
})
