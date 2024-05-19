import ImgList from "@renderer/photo/img-list"
import { createRouter, createWebHashHistory } from "vue-router"

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/img-list",
      component: ImgList
    },
    {
      path: "/",
      redirect: "/img-list"
    }
  ]
})
