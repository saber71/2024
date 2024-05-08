import "./assets/main.css"
import { ModuleName, VueClass } from "@packages/vue-class"

import { createApp } from "vue"
import App from "./App"

VueClass.dependencyInjection.load({ moduleName: ModuleName })

createApp(App).mount("#app")
