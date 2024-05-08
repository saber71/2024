import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import { resolve } from "path"
import swc from "unplugin-swc"

const alias = {
  "@renderer": resolve("src/renderer/src"),
  "@preload": resolve("src/preload"),
  "@packages": resolve("src/packages")
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), swc.vite()],
    resolve: { alias }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias }
  },
  renderer: {
    resolve: { alias },
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
