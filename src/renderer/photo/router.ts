import DirectoryManager from "@renderer/photo/directory-manager"
import ImgList from "@renderer/photo/img-list"
import { createRouter, createWebHashHistory } from "vue-router"

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/img-list",
      component: ImgList,
      name: ImgList.name
    },
    {
      path: "/directory-manager",
      component: DirectoryManager,
      name: DirectoryManager.name
    },
    {
      path: "/",
      redirect: "/img-list"
    }
  ]
})
