/* 从集合中删除指定的内容 */
export function remove<T>(
  collection: Array<T> | Set<T>,
  item?: T | ((item: T) => boolean),
  isPredicate?: boolean,
) {
  let needRemove: T[];
  if (isPredicate === undefined && typeof item === "function")
    isPredicate = true;
  if (isPredicate && item)
    needRemove = Array.from(collection).filter(item as any);
  else needRemove = [item as any];
  if (collection instanceof Array) {
    for (let item of needRemove) {
      const index = collection.indexOf(item);
      if (index >= 0) collection.splice(index, 1);
    }
  } else {
    for (let item of needRemove) {
      collection.delete(item);
    }
  }
  return collection;
}
