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
 * 判断是否是String类型
 */
export const isString = (target) => {
  return typeof target === 'string'
}
/**
 * 判断是否是Number类型
 */
export const isNumber = (target) => {
  return typeof target === 'number'
}
/**
 * 判断是否是Boolean类型
 */
export const isBoolean = (target) => {
  return typeof target === 'boolean'
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

/**
 * -转为驼峰
 * @param {*} string 
 * @returns 
 */
export const camelize = (str) => {
  //hello-world
  //hello-world-
  return str.replace(/-\w/g, (_, c) => c ? c.toUpperCase() : '')
}
