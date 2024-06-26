import "./index.css"
import "../global.css"
import { VueClass } from "@packages/vue-class"
import { createApp } from "vue"
import Index from "./index.tsx"
import "../exposed.ts"

const app = createApp(Index)
await VueClass.install(app)
app.mount("#app")
