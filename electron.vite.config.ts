import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
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
        "@preload": resolve("src/preload"),
        "@packages": resolve("src/packages")
      }
    },
    plugins: [
      vue(),
      vueJsx({
        babelPlugins: [
          "babel-plugin-transform-typescript-metadata",
          [
            "@babel/plugin-proposal-decorators",
            {
              version: "legacy"
            }
          ],
          ["@babel/plugin-transform-class-properties"]
        ]
      }),
      swc.vite()
    ]
  }
})
