import type { Class } from "./types"

/* 判断给定的类是否是js的内置类型 */
function isBasicType(type: Class) {
  return !!{
    Object: true,
    String: true,
    Boolean: true,
    Number: true,
    Symbol: true,
    Array: true,
    Function: true,
    Date: true,
    Set: true,
    Map: true,
    WeakSet: true,
    WeakMap: true
  }[type.name]
}
