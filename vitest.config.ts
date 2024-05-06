import { resolve } from "path"
import swc from "unplugin-swc"
import { defineConfig } from "vitest/config"

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: "./tsconfig.json"
    }
  },
  plugins: [swc.vite()],
  resolve: {
    alias: {
      "@renderer": resolve("src/renderer/src"),
      "@packages": resolve("src/packages")
    }
  }
})
