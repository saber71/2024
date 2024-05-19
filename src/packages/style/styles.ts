import { randomString } from "@packages/common"
import { type CSSProperties, effectScope, watch, watchEffect } from "vue"
import { isDynamicValue } from "./dynamic"
import type { DynamicValue, PseudoClassType } from "./types"

let id = 0,
  selectorId = 0
const selectorMapId: Record<string, number> = {}

function getSelectorId(selector: string) {
  let id = selectorMapId[selector]
  if (typeof id === "undefined") selectorMapId[selector] = id = selectorId++
  return id
}

export class Styles<Class extends string> {
  constructor() {
    this.classNames = new Proxy(
      {},
      {
        get(target: any, p: string): any {
          return target[p] ?? (target[p] = p + "-" + randomString(6))
        }
      }
    ) as any
  }

  private readonly _id = id++
  private readonly _effectScope = effectScope()
  private readonly _selectorMapCSS = new Map<string, string>()
  private _styleEL?: HTMLStyleElement
  private _timeoutHandler?: any
  readonly classNames: Readonly<Record<Class, string>>

  inject(selector: string, properties: CSSStyle): this {
    this._handleCSSProperties(selector, properties, [])
    return this
  }

  add(className: Class, properties: CSSStyle, pseudoClasses?: DynamicOptions["pseudoClasses"]) {
    this._handleCSSPropertiesByClassName(className, getPseudoClasses(pseudoClasses), properties)
    return this
  }

  addDynamic(className: Class, callback: () => CSSStyle, options: DynamicOptions = {}): this {
    setTimeout(() => {
      this._effectScope.run(() => {
        const watchCallback = () => {
          this._handleCSSPropertiesByClassName(className, getPseudoClasses(options.pseudoClasses), callback())
        }
        const { source } = options
        if (source) watch(source, watchCallback, { immediate: true })
        else watchEffect(watchCallback)
      })
    })
    return this
  }

  injectDynamic(selector: Class, callback: () => CSSStyle, options: Omit<DynamicOptions, "pseudoClasses"> = {}): this {
    setTimeout(() => {
      this._effectScope.run(() => {
        const watchCallback = () => {
          this._handleCSSProperties(selector, callback(), [])
        }
        const { source } = options
        if (source) watch(source, watchCallback, { immediate: true })
        else watchEffect(watchCallback)
      })
    })
    return this
  }

  dispose() {
    this._effectScope.stop()
    if (this._timeoutHandler) {
      clearTimeout(this._timeoutHandler)
      this._timeoutHandler = undefined
    }
    if (this._styleEL) {
      document.head.removeChild(this._styleEL)
      this._styleEL = undefined
    }
    this._selectorMapCSS.clear()
  }

  private _handleCSSPropertiesByClassName(className: string, pseudoClasses: PseudoClassType[], properties: CSSStyle) {
    className = (this.classNames as any)[className]
    let selector: string
    if (pseudoClasses.length) selector = pseudoClasses.map((val) => `.${className}:${val}`).join(",")
    else selector = `.${className}`
    this._handleCSSProperties(selector, properties, pseudoClasses)
  }

  private _handleCSSProperties(selector: string, properties: CSSStyle, pseudoClasses: PseudoClassType[]) {
    let css = ""
    for (let property in properties) {
      const value = (properties as any)[property]
      if (typeof value === "object") {
        if (isDynamicValue(value)) {
          const name = this._createCSSPropertyName(selector, property, pseudoClasses)
          document.documentElement.style.setProperty(name, value.value + "")
          css += `${transformProperty(property)}:var(${name});`
        }
      } else {
        css += `${transformProperty(property)}:${value};`
      }
    }
    css = `${selector}{${css}}`
    if (this._selectorMapCSS.get(selector) !== css) {
      this._selectorMapCSS.set(selector, css)
      this._updateStyleElement()
    }
  }

  private _updateStyleElement() {
    if (this._timeoutHandler) return
    this._timeoutHandler = setTimeout(() => {
      this._timeoutHandler = undefined
      let output = ""
      for (let css of this._selectorMapCSS.values()) {
        output += css + "\n"
      }
      if (!this._styleEL) {
        this._styleEL = document.createElement("style")
        document.head.appendChild(this._styleEL)
      }
      this._styleEL.innerHTML = output
    })
  }

  private _createCSSPropertyName(selector: string, propertyName: string, pseudoClasses: PseudoClassType[]) {
    return `--${getSelectorId(selector)}-${pseudoClasses.join("-")}-${propertyName}-${this._id}`
  }
}

function getPseudoClasses(data?: DynamicOptions["pseudoClasses"]) {
  let pseudoClasses: PseudoClassType[]
  if (data) {
    if (data instanceof Array) pseudoClasses = data
    else pseudoClasses = [data]
  } else pseudoClasses = []
  return pseudoClasses
}

function transformProperty(property: string) {
  let result = ""
  for (let i = 0; i < property.length; i++) {
    const char = property[i]
    if (/[A-Z]/.test(char)) result += "-" + char.toLowerCase()
    else result += char
  }
  return result
}

export type CSSStyle = {
  [P in keyof CSSProperties]: CSSProperties[P] | DynamicValue<CSSProperties[P]>
}

export interface DynamicOptions {
  source?: import("vue").WatchSource | import("vue").WatchSource[]
  pseudoClasses?: PseudoClassType | PseudoClassType[]
}
