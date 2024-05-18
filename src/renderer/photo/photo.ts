import { VueClass } from "@packages/vue-class"
import { createApp } from "vue"
import Index from "./photo.tsx"

const app = createApp(Index)
await VueClass.install(app)
app.mount("#app")
