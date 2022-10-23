import { extend } from "../shared"

let activeEffect:any=null

class ReactiveEffect{
  private _fn
  deps=[]
  active=true
  onStop?:()=>void
  constructor(fn:any,public scheduler?:any){
    this._fn=fn
    this.scheduler=scheduler
  }
    run(){
      activeEffect=this
       return this._fn()
    }
    //
    stop(){
      if(this.active){
        cleanupEffect(this)
        this.onStop&&this.onStop()
        this.active=false
      }
    } 
}

function cleanupEffect(effect){

  activeEffect.deps.forEach((dep:any) => {
    dep.delete(effect)
   });
}

const targetMap=new Map()

export function track(target: any,key: any){
  //target -> key ->dep
  let depsMap=targetMap.get(target)
  //* 初始化
  if(!depsMap){
    depsMap=new Map()
    targetMap.set(target,depsMap)
  }
  let dep=depsMap.get(key)  
  //* 初始化
  if(!dep){
   dep=new Set()
   depsMap.set(key,dep)
  }
  if(!activeEffect) return
  dep.add(activeEffect)
  activeEffect.deps.push(dep)

}

export function trigger(target:any,key:any){
  // 遍历 -> run
  let depsMap=targetMap.get(target)
  let dep=depsMap.get(key)
  for(const effect  of dep){
    if(effect.scheduler){
      effect.scheduler()
    }else{
      effect.run()
    }
  }
}

export function effect(fn:any,options:any={}){  
  //? scheduler
  const scheduler=options.scheduler
  //? fn
  const _effect=new ReactiveEffect(fn,scheduler)
  //? options
  // _effect.onStop=options.onStop
  extend(_effect,options)
  _effect.run()
  const runner:any= _effect.run.bind(_effect)
  runner.effect=_effect
  return runner
}

export function stop(runner){
  runner.effect.stop()
}
