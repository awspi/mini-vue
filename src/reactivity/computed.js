import { isFunction } from "../utils"
import { effect, track, trigger } from "./effect"

export const computed = (getterOrOption) => {
  let getter, setter
  if (isFunction(getterOrOption)) {
    getter = getterOrOption
    setter = () => {
      console.warn('computed is readOnly')
    }
  } else {
    getter = getterOrOption.get
    setter = getterOrOption.set
  }
  return new ComputedImpl(getter, setter)
}
class ComputedImpl {
  constructor(getter, setter) {
    this._setter = setter
    this._value = undefined
    this._dirty = true//_dirty表示依赖有没有更新
    this.effect = effect(getter, {
      //lazy->不立即执行
      lazy: true,
      //当依赖更新时,不执行getter函数而是执行scheduler
      //!调度程序
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true
          trigger(this, 'value')
        }
      }
    })
  }
  get value() {
    if (this._dirty) {
      //依赖已经更新->重新计算value
      this._value = this.effect()
      this._dirty = false
      track(this, 'value')
    }
    return this._value
  }
  set value(newVal) {
    this._setter(newVal)
  }
}
