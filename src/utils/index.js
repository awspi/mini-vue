/**
 * 判断是否是一个对象 (不能为null)
 */
export const isObject = (target) => {
  return typeof target === 'object' && target !== null
}
/**
 * 判断是否是一个数组
 */
export const isArray = (target) => {
  return Array.isArray(target)
}
/**
 * 值是否发生改变 
 * (注意NaN!==NaN)
 */
export const hasChanged = (oldVal, val) => {
  return oldVal !== val && !(Number.isNaN(oldVal) && Number.isNaN(val))

}

/**
 * isFunction
 */
export const isFunction = (target) => {
  return typeof target === 'function'
}
