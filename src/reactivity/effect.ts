
let activeEffect:any=null

class ReactiveEffect{
  private _fn
  constructor(fn:any){
    this._fn=fn
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
    effect.run()
  }
}

export function effect(fn:any){
  //? fn
  const _effect=new ReactiveEffect(fn)
  _effect.run()
  //* runner
  return _effect.run.bind(_effect)
}
