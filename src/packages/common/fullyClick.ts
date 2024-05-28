/**
 * 定义一个完全点击接口，包含鼠标按下和鼠标抬起两个事件的处理函数。
 */
export interface FullyClick {
  onMousedown: () => void
  onMouseup: () => void
}

/**
 * 创建一个完全点击事件的管理器。
 * @param time 定义一个时间阈值，用于判断是否为快速点击。
 * @param onMousedown 鼠标按下时的处理函数。
 * @param onMouseup 鼠标抬起时的处理函数。
 * @returns 返回一个包含onMousedown和onMouseup方法的对象，用于管理点击事件。
 */
export function fullyClick(time: number, onMousedown: () => void, onMouseup: () => void): FullyClick {
  // 定义状态变量和计时器
  let down = false, // 表示鼠标是否按下
    downTime = 0, // 记录鼠标按下的时间
    handler: any = 0 // 记录定时器的ID

  // 返回一个包含鼠标按下和抬起事件处理的方法的对象
  return {
    onMousedown() {
      down = true
      downTime = Date.now()
      if (handler) {
        clearTimeout(handler)
        handler = 0
      }
      onMousedown() // 调用传入的鼠标按下事件处理函数
    },
    onMouseup() {
      if (down) {
        down = false
        const bias = Date.now() - downTime // 计算鼠标按下到抬起的时间差
        if (bias < time) {
          // 如果时间差小于定义的时间阈值，则认为是快速点击，使用setTimeout延迟执行onMouseup
          handler = setTimeout(() => {
            handler = 0
            onMouseup()
          }, bias)
        } else {
          // 如果时间差大于等于时间阈值，直接执行onMouseup
          onMouseup()
        }
      }
    }
  }
}
