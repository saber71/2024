import { VueClass } from "@packages/vue-class"
import { createApp } from "vue"
import Index from "./index.tsx"
import "../global.css"
import "ant-design-vue/dist/reset.css"
import "vue-json-pretty/lib/styles.css"
import "../exposed.ts"

const app = createApp(Index)
await VueClass.install(app)
app.mount("#app")
