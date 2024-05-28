import { fullyClick, type FullyClick, isImageExtName, isVideoExtName, spread } from "@packages/common"
import { Inject } from "@packages/dependency-injection"
import type { ImageInfo } from "@packages/electron"
import {
  BindThis,
  Component,
  type ComponentProps,
  Disposable,
  EventListener,
  Link,
  Mut,
  Throttle,
  toNative,
  VueComponent,
  type VueComponentBaseProps,
  Watcher
} from "@packages/vue-class"
import { type FilterType, PhotoDataService, photoEventBus } from "@renderer/photo/data.service.tsx"
import { Checkbox, Flex } from "ant-design-vue"
import { type VNodeChild } from "vue"
import "./index.scss"

interface Picture {
  info: ImageInfo
  width: number // 图片宽度
  height: number // 图片高度
  fullyClick: FullyClick
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
  @Mut() gap = 25
  @Mut() visibleStartRowIndex = 0
  @Mut() visibleEndRowIndex = 0
  @Mut() scaledPictures = new Set<string>()
  @Disposable("disconnect") resizeObserver: ResizeObserver
  filterType: FilterType = "all"

  onMounted() {
    this.resizeObserver = new ResizeObserver(this.updateRowPictures)
    this.resizeObserver.observe(this.imgContainerEl, { box: "border-box" })
  }

  @EventListener(photoEventBus, "scroll") @Watcher() handleScroll() {
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

  @BindThis() @Watcher() @EventListener(photoEventBus, "updateRows") updateRowPictures() {
    this.filterType = this.dataService.imageShowSetting.filter
    let size = 200
    if (this.dataService.imageShowSetting.size === "small") size = 100
    else if (this.dataService.imageShowSetting.size === "big") size = 400
    this.rowHeight = size
    const imageInfos = this.dataService.imageInfos
    // 这里必须要确保访问到imageInfos的属性，否则vue会监听不到
    if (!imageInfos.length || !this.imgContainerEl) {
      this.rowPictures = []
      return
    }
    this.updateRowPicturesImpl()
  }

  @Throttle()
  updateRowPicturesImpl() {
    const type = this.dataService.imageShowSetting.type
    const size = this.rowHeight
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
      if (this.filterType === "image" && !isImageExtName(info.extName)) continue
      if (this.filterType === "video" && !isVideoExtName(info.extName)) continue
      if (accWidth > containerWidth) newRow()
      const picture = toPicture.call(this, info)
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

    function toPicture(this: ImgListInst, info: ImageInfo): Picture {
      let width: number, height: number
      if (type === "same-height") {
        height = size
        width = (info.width / info.height) * size
      } else {
        width = height = size
      }
      const pic: Picture = {
        info,
        width,
        height,
        fullyClick: fullyClick(
          200,
          () => this.scaledPictures.add(pic.info.path),
          () => this.scaledPictures.delete(pic.info.path)
        )
      }
      return pic
    }
  }

  @BindThis() handleClickCheckbox(val: boolean, pic: Picture) {
    if (!val) this.dataService.selectedImagePaths.delete(pic.info.path)
    else this.dataService.selectImage(pic, true)
  }

  render(): VNodeChild {
    return (
      <div
        ref={"imgContainerEl"}
        class={"img-list relative"}
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
              {row.array.map((pic) => {
                const checked = this.dataService.selectedImagePaths.has(pic.info.path)
                return (
                  <div
                    class={[
                      "picture relative bg-gray-100 flex-shrink-0 box-shadow-hover transition box-border",
                      checked ? "checked-picture" : "",
                      !this.scaledPictures.has(pic.info.path) ? "" : "picture-mousedown"
                    ]}
                    style={{
                      width: pic.width + "px",
                      height: pic.height + "px",
                      flexGrow: row.complete && this.dataService.imageShowSetting.type !== "rect" ? "1" : "0"
                    }}
                    onClick={() => this.dataService.selectImage(pic)}
                    onMousedown={pic.fullyClick.onMousedown}
                    onMouseup={pic.fullyClick.onMouseup}
                    onMouseleave={pic.fullyClick.onMouseup}
                  >
                    <img
                      class={"block object-cover object-center"}
                      src={pic.info.path}
                      style={{ width: "100%", height: pic.height + "px" }}
                      loading={"lazy"}
                      title={pic.info.name}
                    />
                    <div class={["checkbox", checked ? "checked" : ""]} onMousedown={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked} onUpdate:checked={(val) => this.handleClickCheckbox(val, pic)} />
                    </div>
                  </div>
                )
              })}
            </Flex>
          )
        })}
      </div>
    )
  }
}

export default toNative<ImgListProps>(ImgListInst)
