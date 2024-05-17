import "./assets/main.css"
import { ModuleName, VueClass } from "@packages/vue-class"
import { createApp } from "vue"
import Index from "./index.tsx"

VueClass.dependencyInjection.load({ moduleName: ModuleName })

createApp(Index).mount("#app")
