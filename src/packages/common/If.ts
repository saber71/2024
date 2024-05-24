/**
 * 创建一个条件判断流程控制对象。
 * @param cond 条件，可以是布尔值或返回布尔值的函数。
 * @returns 返回一个包含 `then`, `else`, `elseIf`, 和 `done` 方法的对象，用于构建条件分支和获取最终结果。
 */
export function If<Result>(cond: Condition): If<Result> {
  // 初始化记录对象，用于存储条件判断和对应的结果。
  const record: Record = {
    if: { then: undefined, checkResult: checkCondition(cond) },
    elseIf: []
  }
  // 定义对外接口对象，提供链式调用能力。
  const object: If<Result> = {
    /**
     * 设置当条件满足时的结果。
     * @param value 条件满足时的结果值，可以是直接的值或者返回值的函数。
     * @returns 返回当前 If 对象，支持链式调用。
     */
    then(value: Value<Result>) {
      // 仅当该条件分支未被设置结果时，才设置结果。
      if (record.if.then === undefined) record.if.then = value
      else if (record.else) {
        // 如果存在 else 分支且未设置结果，设置该结果。
        if (!record.else.then) record.else.then = value
      } else {
        // 如果存在 elseIf 分支且未设置结果，设置该结果。
        const lastElseIf = record.elseIf.at(-1)
        if (lastElseIf) lastElseIf.then = value
      }
      return this
    },
    /**
     * 设置其他情况下的结果。
     * @param value 其他情况下的结果值，可以是直接的值或者返回值的函数。
     * @returns 返回最终结果，调用 `done` 方法来结束条件判断流程并获取结果。
     */
    else(value: Value<Result>) {
      // 如果 else 分支未被设置，初始化并设置结果。
      if (!record.else) record.else = {} as any
      record.else!.then = value
      return object.done()
    },
    /**
     * 添加另一个条件分支。
     * @param cond 新的条件，可以是布尔值或返回布尔值的函数。
     * @returns 返回当前 If 对象，支持链式调用。
     */
    elseIf(cond: Condition) {
      // 添加新的条件分支到记录中。
      record.elseIf.push({ then: undefined, cond })
      return this
    },
    /**
     * 结束条件判断流程并返回最终结果。
     * @returns 返回根据条件判断得到的结果。
     */
    done(): Result {
      // 根据条件判断顺序，获取最终结果。
      let result: Result
      if (record.if.checkResult) result = getValue(record.if.then)
      else {
        let gotIt = false
        for (let item of record.elseIf) {
          if (checkCondition(item.cond)) {
            result = getValue(item.then)
            gotIt = true
            break
          }
        }
        if (!gotIt) result = getValue(record.else?.then)
      }
      return result!
    }
  }
  return object
}

// 定义相关接口和类型。
interface Record {
  if: { then: Value; checkResult: boolean }
  else?: { then: Value }
  elseIf: Array<{ then: Value; cond: Condition }>
}

interface If<Result = any> {
  then(value: Value<Result>): this
  else(value: Value<Result>): Result
  elseIf(cond: Condition): this
  done(): Result
}

type Condition = boolean | (() => boolean)
type Value<Result = any> = Result | (() => Result)

// 辅助函数，用于检查条件是否满足。
function checkCondition(cond: Condition) {
  if (typeof cond === "function") return cond()
  return cond
}

// 辅助函数，用于获取值，支持函数类型的结果。
function getValue(val: Value) {
  if (typeof val === "function") return val()
  return val
}
