import deepEqual from "deep-equal"

export function matchFilterCondition<T extends { _id: string; [key: string]: any }>(
  data: T,
  condition: FilterCondition<T>
) {
  const filterPredicates = parseFilterCondition(condition)
  return filterPredicates.every((fn) => fn(data))
}

export function filter<T extends FilterItem>(condition?: FilterCondition<T> | null) {
  const arr = parseFilterCondition(condition)
  return (value: any) => arr.every((fn) => fn(value))
}

function parseFilterCondition(condition?: FilterCondition<any> | null): Array<(item: any) => boolean> {
  if (!condition) return []
  const filterPredicates: Array<(item: any) => boolean> = []
  for (let keyOrPropName in condition) {
    const conditionValue = condition[keyOrPropName]
    if (keyOrPropName === "$or" || keyOrPropName === "$nor") {
      const filterConditions = conditionValue as FilterCondition<any>[]
      const conditions = filterConditions.map(parseFilterCondition)
      if (keyOrPropName === "$or") {
        filterPredicates.push((item) => {
          for (let fnArray of conditions) {
            if (fnArray.every((fn) => fn(item))) return true
          }
          return false
        })
      } else {
        filterPredicates.push((item) => {
          for (let fnArray of conditions) {
            if (fnArray.every((fn) => fn(item))) return false
          }
          return true
        })
      }
    } else {
      if (isCondition(conditionValue)) {
        parseCondition(keyOrPropName, conditionValue, filterPredicates)
      } else {
        if (typeof conditionValue === "object" && conditionValue) {
          const subFilterPredicates = parseFilterCondition(conditionValue)
          filterPredicates.push((item) => {
            if (item[keyOrPropName] === undefined || item[keyOrPropName] === null) return false
            return subFilterPredicates.every((fn) => fn(item[keyOrPropName]))
          })
        } else filterPredicates.push((item) => item[keyOrPropName] === conditionValue)
      }
    }
  }
  return filterPredicates
}

function parseCondition(propName: string, condition: Condition<any>, filterPredicates: Array<(item: any) => boolean>) {
  for (let conditionKey in condition) {
    let conditionValue = (condition as any)[conditionKey]
    if (conditionValue === undefined) continue
    if (conditionKey === "$less") filterPredicates.push((item) => item[propName] < conditionValue)
    else if (conditionKey === "$greater") filterPredicates.push((item) => item[propName] > conditionValue)
    else if (conditionKey === "$lessEqual") filterPredicates.push((item) => item[propName] <= conditionValue)
    else if (conditionKey === "$greaterEqual") filterPredicates.push((item) => item[propName] >= conditionValue)
    else if (conditionKey === "$not")
      filterPredicates.push((item) => !deepEqual(item[propName], conditionValue, { strict: true }))
    else if (conditionKey === "$equal")
      filterPredicates.push((item) => deepEqual(item[propName], conditionValue, { strict: true }))
    else if (conditionKey === "$dateBefore") {
      if (conditionValue instanceof Date) conditionValue = conditionValue.getTime()
      filterPredicates.push((item) => {
        let value = item[propName]
        if (value instanceof Date) value = value.getTime()
        else if (typeof value === "string") value = new Date(value).getTime()
        return value < conditionValue
      })
    } else if (conditionKey === "$dateAfter") {
      if (conditionValue instanceof Date) conditionValue = conditionValue.getTime()
      filterPredicates.push((item) => {
        let value = item[propName]
        if (value instanceof Date) value = value.getTime()
        else if (typeof value === "string") value = new Date(value).getTime()
        return value > conditionValue
      })
    } else if (conditionKey === "$or") {
      const conditions: Array<(item: any) => boolean> = []
      conditionValue.forEach((condition: Condition<any>) => parseCondition(propName, condition, conditions))
      filterPredicates.push((item) => {
        for (let predicate of conditions) {
          if (predicate(item)) return true
        }
        return false
      })
    } else if (conditionKey === "$nor") {
      const conditions: Array<(item: any) => boolean> = []
      conditionValue.forEach((condition: Condition<any>) => parseCondition(propName, condition, conditions))
      filterPredicates.push((item) => {
        for (let predicate of conditions) {
          if (predicate(item)) return false
        }
        return true
      })
    } else if (conditionKey === "$in") {
      filterPredicates.push((item) => includes(conditionValue, item[propName]))
    } else if (conditionKey === "$notIn") {
      filterPredicates.push((item) => !includes(conditionValue, item[propName]))
    } else if (conditionKey === "$contains") {
      filterPredicates.push((item) => {
        const value = item[propName]
        if (value instanceof Array) {
          if (conditionValue instanceof Array) {
            for (let cond of conditionValue) {
              if (!includes(value, cond)) return false
            }
            return true
          } else return includes(value, conditionValue)
        } else if (typeof value === "string") {
          if (conditionValue instanceof Array) {
            for (let cond of conditionValue) {
              if (!includes(value, cond)) return false
            }
            return true
          } else return includes(value, conditionValue)
        }
        return false
      })
    } else if (conditionKey === "$notContains") {
      filterPredicates.push((item) => {
        const value = item[propName]
        if (value instanceof Array) {
          if (conditionValue instanceof Array) {
            for (let cond of conditionValue) {
              if (includes(value, cond)) return false
            }
            return true
          } else return !includes(value, conditionValue)
        } else if (typeof value === "string") {
          if (conditionValue instanceof Array) {
            for (let cond of conditionValue) {
              if (includes(value, cond)) return false
            }
            return true
          } else return !includes(value, conditionValue)
        }
        return false
      })
    } else if (conditionKey === "$match") {
      if (typeof conditionValue === "string") conditionValue = new RegExp(conditionValue)
      filterPredicates.push((item) => (conditionValue as RegExp).test(item[propName]))
    }
  }
}

function isCondition(arg?: any): arg is Condition<any> {
  if (!arg || typeof arg !== "object") return false
  const keys = [
    "$less",
    "$lessEqual",
    "greater",
    "$greaterEqual",
    "$equal",
    "$not",
    "$dateBefore",
    "$dateAfter",
    "$or",
    "$nor",
    "$in",
    "$notIn",
    "$contains",
    "$notContains",
    "$match"
  ]
  for (let key of keys) {
    if (key in arg) return true
  }
  return false
}

function includes(arr: Array<any> | string, value: any) {
  if (typeof arr === "string") return arr.includes(value)
  else return arr.find((item) => deepEqual(item, value, { strict: true }))
}

export function sortData(array: any[], sortOrders: SortOrders) {
  const sortPredicates: Array<(a: any, b: any) => number> = sortOrders.map((item: any) => {
    if (item.order === "asc") return (a, b) => a[item.field] - b[item.field]
    else return (a, b) => b[item.field] - a[item.field]
  })
  array.sort((a, b) => {
    for (let sortPredicate of sortPredicates) {
      const value = sortPredicate(a, b)
      if (value) return value
    }
    return 0
  })
}

export interface Condition<Value> {
  $less?: Value
  $lessEqual?: Value
  $greater?: Value
  $greaterEqual?: Value
  $equal?: Value
  $not?: Value
  $dateBefore?: Date | number
  $dateAfter?: Date | number
  /* 数据满足任一条件即可 */
  $or?: Partial<Condition<Value>>[]
  /* or取反, 条件都不满足时即可 */
  $nor?: Partial<Condition<Value>>[]
  /* 值是否在集合中 */
  $in?: Value[]
  /* 值是否不在集合中 */
  $notIn?: Value[]
  /* 适用于数组或字符串。数组或字符串是否包含指定的集合或字符串 */
  $contains: Value[] | Value
  /* 适用于数组或字符串。数组或字符串是否不包含指定的集合或字符串 */
  $notContains: Value[] | Value
  $match: RegExp | string
}

export interface FilterItem {
  _id: string

  [key: string]: any
}

export type FilterCondition<TSchema extends FilterItem> = Partial<{
  [P in keyof TSchema]: TSchema[P] | FilterCondition<TSchema[P]> | Partial<Condition<TSchema[P]>>
}> &
  Partial<{
    $or: FilterCondition<TSchema>[]
    $nor: FilterCondition<TSchema>[]
  }>

export type SortOrders<T = any> = Array<{
  order: "asc" | "desc"
  field: keyof T
}>
