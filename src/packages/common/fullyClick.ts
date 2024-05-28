export interface FullyClick {
  onMousedown: () => void
  onMouseup: () => void
}

export function fullyClick(time: number, onMousedown: () => void, onMouseup: () => void): FullyClick {
  let down = false,
    downTime = 0,
    handler: any = 0
  return {
    onMousedown() {
      down = true
      downTime = Date.now()
      if (handler) {
        clearTimeout(handler)
        handler = 0
      }
      onMousedown()
    },
    onMouseup() {
      if (down) {
        down = false
        const bias = Date.now() - downTime
        if (bias < time) {
          handler = setTimeout(() => {
            handler = 0
            onMouseup()
          }, bias)
        } else {
          onMouseup()
        }
      }
    }
  }
}
