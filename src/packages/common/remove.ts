/**
 * 从集合中删除指定的内容
 * @param collection - 要操作的集合，可以是数组或Set
 * @param item - 要删除的项目，或者是一个函数，用于判断哪些项目应该被删除
 * @param isPredicate - 指示参数item是否为一个判断函数的布尔值，默认为undefined
 * @returns 修改后的集合
 */
export function remove<T>(
  collection: Array<T> | Set<T>,
  item?: T | T[] | ((item: T) => boolean),
  isPredicate?: boolean
) {
  let needRemove: T[]
  // 判断是否以函数方式指定要删除的项
  if (isPredicate === undefined && typeof item === "function") isPredicate = true

  // 根据是否是判断函数，筛选出需要删除的项
  if (isPredicate && item) needRemove = Array.from(collection).filter(item as any)
  else {
    if (item instanceof Array) needRemove = item
    else needRemove = [item as any]
  }

  // 对数组类型的集合进行删除操作
  if (collection instanceof Array) {
    for (let item of needRemove) {
      const index = collection.indexOf(item)
      if (index >= 0) collection.splice(index, 1)
    }
  } else {
    // 对Set类型的集合进行删除操作
    for (let item of needRemove) {
      collection.delete(item)
    }
  }
  return collection
}
