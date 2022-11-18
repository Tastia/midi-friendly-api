export function deepCopy<T>(target: T): T {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }
  // First part is for array and second part is for Realm.Collection
  // if (target instanceof Array || typeof (target as any).type === 'string') {
  if (typeof target === 'object') {
    if (typeof (target as { [key: string]: any })[(Symbol as any).iterator] === 'function') {
      const cp = [] as any[];
      if ((target as any as any[]).length > 0) {
        for (const arrayMember of target as any as any[]) {
          cp.push(deepCopy(arrayMember));
        }
      }
      return cp as any as T;
    } else {
      const targetKeys = Object.keys(target);
      const cp = {} as { [key: string]: any };
      if (targetKeys.length > 0) {
        for (const key of targetKeys) {
          cp[key] = deepCopy((target as { [key: string]: any })[key]);
        }
      }
      return cp as T;
    }
  }
  // Means that object is atomic
  return target;
}
