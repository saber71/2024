import vue from "@vitejs/plugin-vue"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import { resolve } from "path"
import swc from "unplugin-swc"

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), swc.vite()]
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
    plugins: [vue(), swc.vite()]
  }
})
