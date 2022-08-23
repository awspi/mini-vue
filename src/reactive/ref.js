import { hasChanged, isObject } from "../utils"
import { track, trigger } from "./effect"
import { reactive } from "./reactive"

export const ref = (val) => {
  //如果已经被代理
  if (isRef(val)) return val
  return new RefImpl(val)
}
export const isRef = (val) => {
  return !!(val && val.__isRef)
}
class RefImpl {
  constructor(val) {
    this.__isRef = true
    this._value = convert(val)
  }
  get value() {
    track(this, 'value')
    return this._value
  }
  set value(newVal) {
    if (hasChanged(newVal, this._value)) {
      //先赋值再trigger,保证trigger得到的值是新的
      this._value = convert(newVal)
      trigger(this, 'value')
    }
  }
}
const convert = (val) => {
  return isObject(val) ? reactive(val) : val
}
