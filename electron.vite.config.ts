import vue from "@vitejs/plugin-vue"
import { defineConfig, externalizeDepsPlugin, swcPlugin } from "electron-vite"
import { resolve } from "path"

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@packages": resolve("src/packages")
      }
    },
    plugins: [vue(), swcPlugin()]
  }
})
