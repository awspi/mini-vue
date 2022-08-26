import { isArray, isNumber, isString } from "../utils"

//ShapeFlags枚举
export const ShapeFlags = {
  ELEMENT: 1, // 00000001
  TEXT: 1 << 1, // 00000010
  FRAGMENT: 1 << 2, // 00000100
  COMPONENT: 1 << 3, // 00001000
  TEXT_CHILDREN: 1 << 4, // 00010000
  ARRAY_CHILDREN: 1 << 5, // 00100000
  CHILDREN: (1 << 4) | (1 << 5), //00110000
}

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

/**
 * 
 * @param {string|Object|Text|Fragment} type 
 * @param {Object|null} props 
 * @param {string|number|Array|null} children 
 * @returns VNode
 */
export const h = (type, props, children) => {
  let shapeFlag = 0
  //确定shapeFlag的类型
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT
  } else if (type === Fragment) {
    shapeFlag = ShapeFlags.FRAGMENT
  } else {
    shapeFlag = ShapeFlags.COMPONENT
  }
  //判断children
  if (isString(children) || isNumber(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
    //number->string
    children = children.toString()
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  return {
    type,
    props,
    children,
    shapeFlag,
    el: null,
    anchor: null,
    key: props && props.key
  }
}
