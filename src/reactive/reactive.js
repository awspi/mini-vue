import { isObject, hasChanged, isArray } from "../utils"
import { track, trigger } from "./effect"
//每生成一个响应式对象,就加入到map中,避免重复生成
const proxyMap = new WeakMap()

/**
 * 创建响应式代理
 * 只代理对象/数组,不代理基本类型
 * @param {*} target 
 * @returns 
 */
export const reactive = (target) => {
  //如果是基本类型
  if (!isObject(target)) return target
  //如果已经被代理过
  if (isReactive(target)) return target
  //如果proxyMap中已经存在,则返回存在的proxy
  if (proxyMap.get(target)) return proxyMap.get(target)
  //如果是对象/数组
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      //如果是检查是否有__isReactive,不需要真的挂载到target,直接返回true即可
      if (key === '__isReactive') return true
      const res = Reflect.get(target, key, receiver)
      track(target, key)
      return isObject(res) ? reactive(res) : res
    },
    set(target, key, val, receiver) {
      let oldLength = target.length//旧的长度(如果是数组)
      const oldVal = target[key]//旧的值
      const res = Reflect.set(target, key, val, receiver)
      //值发生改变,才会执行副函数
      if (hasChanged(oldVal, val)) {
        trigger(target, key)
        if (isArray(target) && hasChanged(oldLength, target.length)) {
          //手动trigger一次
          trigger(target, 'length')
        }
      }
      return res
    }
  })
  proxyMap.set(target, proxy)
  return proxy
}

/**
 * 判断target是否已经被代理
 * (通过判断target是否有特殊的key)
 */
export const isReactive = (target) => {
  return !!(target && target.__isReactive)
}
