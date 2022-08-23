//effect栈->解决effect函数嵌套问题
const effectStack = []
//当前正在执行的副作用函数
let activeEffect = undefined
/**
 * 收集依赖
 * @param {*} fn 副作用函数
 * @returns 
 */
export const effect = (fn, options = { lazy: false, scheduler: undefined }) => {
  const effectFn = () => {
    try {
      activeEffect = effectFn
      effectStack.push(activeEffect)
      return fn()
    } finally {
      //添加后还原activeEffect
      effectStack.pop()
      activeEffect = effectStack[effectStack.length - 1]
    }
  }
  if (!options.lazy) {
    effectFn()
  }
  //scheduler挂载到effectFn
  effectFn.scheduler = options.scheduler
  return effectFn

}
//存储副作用,建立副作用与依赖的对应关系
/*
{ //weakMap
  [target]:{ //key是reactiveObj,val是Map
    [key]:[] //key是reactiveObj的key值,val是一个Set
  }
}
*/
const targetMap = new WeakMap()

/**
 * 追踪
 * @param {*} target 对象
 * @param {*} key 对象的键值
 * @returns 
 */
export const track = (target, key) => {
  //如果没有依赖
  if (!activeEffect) return
  //存在依赖
  //  获取依赖
  let depsMap = targetMap.get(target)
  //首次添加依赖
  if (!depsMap) targetMap.set(target, depsMap = new Map())
  //获取副作用
  let deps = depsMap.get(key)
  //首次添加副作用
  if (!deps) depsMap.set(key, deps = new Set())
  //添加当前正在执行的副作用函数
  deps.add(activeEffect)
}

/**
 * 触发 (寻找依赖的副作用 并执行)
 * @param {*} target 对象
 * @param {*} key 对象的键值
 * @returns 
 */
export const trigger = (target, key) => {
  const depsMap = targetMap.get(target)
  //对象没有被依赖
  if (!depsMap) return
  //对象被依赖
  const deps = depsMap.get(key)
  //key没有被依赖
  if (!deps) return
  //对象的键值被依赖
  deps.forEach(effectFn => {
    //优先执行调度函数
    if (effectFn.scheduler) {
      effectFn.scheduler(effectFn)
    } else {
      effectFn()
    }
  })

}
