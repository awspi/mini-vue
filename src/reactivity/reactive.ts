import { track, trigger } from "./effect"

export function reactive(raw:any){
  
  return new Proxy(raw,{
    get(target,key){
      //{foo:1}
      const res=Reflect.get(target,key)
      //? 依赖收集
      track(target,key)
      return res
    },

    set(target,key,value){
      const res=Reflect.set(target,key,value)
      //TODO 触发依赖
      trigger(target,key)
      return res
    }
  })

}
