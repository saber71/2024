import { remove, spread } from "@packages/common"
import { Inject } from "@packages/dependency-injection"
import type { ImageInfo } from "@packages/electron"
import {
  BindThis,
  Component,
  type ComponentProps,
  Disposable,
  Link,
  Mut,
  Throttle,
  toNative,
  VueComponent,
  type VueComponentBaseProps,
  Watcher
} from "@packages/vue-class"
import { PhotoDataService } from "@renderer/photo/data.service.ts"
import { Flex } from "ant-design-vue"
import { type VNodeChild } from "vue"
import "./index.scss"

interface Picture {
  info: ImageInfo
  width: number // 图片宽度
  height: number // 图片高度
}

/**
 * 定义一个 RowPicture 接口
 * 用于描述一行图片的数据结构
 */
export interface RowPicture {
  index: number // 行索引，标识这一行的位置
  array: Array<Picture> // 图片信息数组，包含该行所有的图片信息
  complete: boolean
}

export interface ImgListProps extends VueComponentBaseProps {}

@Component()
export class ImgListInst extends VueComponent<ImgListProps> {
  static readonly defineProps: ComponentProps<ImgListProps> = ["inst"]

  @Inject() dataService: PhotoDataService
  @Link() imgContainerEl: HTMLElement
  @Mut() rowPictures: RowPicture[] = []
  @Mut() rowHeight = 200
  @Mut() gap = 50
  @Mut() visibleStartRowIndex = 0
  @Mut() visibleEndRowIndex = 0
  @Mut() selectedImageInfoPath = new Set<string>()
  @Disposable("disconnect") resizeObserver: ResizeObserver

  setup() {
    this.dataService.routeViewScrollListeners.push(this.handleScroll)
  }

  onMounted() {
    this.resizeObserver = new ResizeObserver(this.updateRowPictures)
    this.resizeObserver.observe(this.imgContainerEl, { box: "border-box" })
  }

  onBeforeUnmounted() {
    remove(this.dataService.routeViewScrollListeners, this.handleScroll, false)
  }

  @BindThis() @Watcher() handleScroll() {
    const rowHeight = this.rowHeight
    const scrollbar = this.dataService.scrollbarInstance
    const rowPictureLength = this.rowPictures.length
    const gap = this.gap
    if (!scrollbar) return
    const el = scrollbar.elements().viewport
    const scrollTop = el.scrollTop
    const viewportHeight = el.getBoundingClientRect().height
    this.visibleStartRowIndex = Math.floor(scrollTop / (rowHeight + gap))
    this.visibleEndRowIndex = Math.min(
      Math.ceil((scrollTop + viewportHeight) / (rowHeight + gap)),
      rowPictureLength - 1
    )
  }

  @BindThis() @Watcher() updateRowPictures() {
    let size = 200
    if (this.dataService.imageShowSetting.size === "small") size = 100
    else if (this.dataService.imageShowSetting.size === "big") size = 400
    this.rowHeight = size
    const type = this.dataService.imageShowSetting.type
    const imageInfos = this.dataService.imageInfos
    // 这里必须要确保访问到imageInfos的属性，否则vue会监听不到
    if (!imageInfos.length || !this.imgContainerEl) {
      this.rowPictures = []
      return
    }
    this.updateRowPicturesImpl(type, size)
  }

  @Throttle()
  updateRowPicturesImpl(type: "rect" | "same-height", size: number) {
    const containerSize = this.imgContainerEl.getBoundingClientRect()
    const containerWidth = containerSize.width - 16
    const newRow = () => {
      accWidth = 0
      row = {
        index: rows.length,
        array: [],
        complete: false
      }
      rows.push(row)
    }
    const rows: RowPicture[] = []
    let row: RowPicture = {
      index: 0,
      array: [],
      complete: false
    }
    rows.push(row)
    let accWidth = 0
    for (let info of this.dataService.imageInfos) {
      if (accWidth > containerWidth) newRow()
      const picture = toPicture(info)
      if (row.array.length === 0) {
        row.array.push(picture)
        accWidth += picture.width + this.gap
      } else {
        if (accWidth + picture.width <= containerWidth) {
          row.array.push(picture)
          accWidth += picture.width + this.gap
        } else {
          row.complete = true
          newRow()
          row.array.push(picture)
          accWidth += picture.width + this.gap
        }
      }
    }
    if (row.array.length === 0) rows.pop()
    this.rowPictures = rows

    function toPicture(info: ImageInfo): Picture {
      let width: number, height: number
      if (type === "same-height") {
        height = size
        width = (info.width / info.height) * size
      } else {
        width = height = size
      }
      return {
        info,
        width,
        height
      }
    }
  }

  @BindThis() selectPicture(pic: Picture) {
    if (this.selectedImageInfoPath.has(pic.info.path)) this.selectedImageInfoPath.delete(pic.info.path)
    else this.selectedImageInfoPath.add(pic.info.path)
  }

  render(): VNodeChild {
    return (
      <div
        ref={"imgContainerEl"}
        class={"relative"}
        style={{ height: (this.gap + this.rowHeight) * this.rowPictures.length + "px" }}
      >
        {spread(this.visibleStartRowIndex, this.visibleEndRowIndex, (index) => {
          if (index >= this.rowPictures.length) return null
          const row = this.rowPictures[index]
          return (
            <Flex
              class={"absolute left-2"}
              gap={this.gap}
              align={"center"}
              style={{ top: (this.gap + this.rowHeight) * index + 8 + "px", width: "calc(100% - 16px)" }}
            >
              {row.array.map((pic) => (
                <div
                  class={
                    "picture relative bg-gray-100 flex-shrink-0 box-shadow-hover transition border-2 border-solid box-border"
                  }
                  style={{
                    width: pic.width + "px",
                    height: pic.height + "px",
                    flexGrow: row.complete ? "1" : "0",
                    borderColor: this.selectedImageInfoPath.has(pic.info.path) ? "#334477" : ""
                  }}
                  onClick={() => this.selectPicture(pic)}
                >
                  <img
                    class={"block object-cover object-center"}
                    src={pic.info.path}
                    style={{ width: "100%", height: pic.height + "px" }}
                    loading={"lazy"}
                    title={pic.info.name}
                  />
                </div>
              ))}
            </Flex>
          )
        })}
      </div>
    )
  }
}

export default toNative<ImgListProps>(ImgListInst)
