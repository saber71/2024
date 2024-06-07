import { VueClass } from "@packages/vue-class"
import { router } from "@renderer/photo/router.ts"
import { createApp } from "vue"
import Index from "./photo.tsx"
import "../global.css"
import "ant-design-vue/dist/reset.css"
import "overlayscrollbars/overlayscrollbars.css"

const app = createApp(Index).use(router)
await VueClass.install(app, router)
app.mount("#app")
