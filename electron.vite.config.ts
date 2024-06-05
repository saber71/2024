import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import { resolve } from "path"
import swc from "unplugin-swc"

const alias = {
  "@renderer": resolve("src/renderer"),
  "@main": resolve("src/main"),
  "@preload": resolve("src/preload"),
  "@packages": resolve("src/packages")
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), swc.vite()],
    resolve: { alias },
    build: {
      assetsInlineLimit: 0
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias }
  },
  renderer: {
    resolve: { alias },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index/index.html"),
          photo: resolve(__dirname, "src/renderer/photo/photo.html")
        }
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
