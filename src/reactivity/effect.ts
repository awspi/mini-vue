
let activeEffect:any=null

class ReactiveEffect{
  private _fn
  constructor(fn:any,public scheduler?:any){
    this._fn=fn
    this.scheduler=scheduler
  }
    run(){
      activeEffect=this
       return this._fn()
    }
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
  dep.add(activeEffect)

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
  _effect.run()
    return _effect.run.bind(_effect)
}
