import { capitalize } from '../utils'
import { NodeTypes } from './'
export const generate = (ast) => {
  const returns = traverseNode(ast)
  //!with
  const code = `with(ctx){
    const { h, Text, Fragment, renderList, withModel, resolveComponent } = MiniVue;
    return ${returns}
  }`
  return code
}
/**
 * 遍历树
 * @param {*} node 
 */
const traverseNode = (node) => {
  switch (node.type) {
    case NodeTypes.ROOT:
      if (node.children.length === 1) {
        //*根节点只有一个
        //*递归他的children
        return traverseNode(node.children[0])
      }
      //*多个根节点
      const result = traverseChildren(node)
      return result
      break;
    case NodeTypes.ELEMENT:
      return createElementVNode(node)
    case NodeTypes.INTERPOLATION:
      return createTextVNode(node.content)
    case NodeTypes.TEXT:
      return createTextVNode(node)
  }
}

/**
 * createElementVNode
 * @param {*} node 
 * @returns 
 */

const createElementVNode = (node) => {
  console.log(node);
  const { children } = node
  const tag = JSON.stringify(node.tag)//*加引号

  const propArr = createPropArr(node)
  const propStr = propArr.length ? `{${propArr.join(', ')}}` : 'null'

  if (!children.length) {
    if (propStr === 'null') {
      return `h(${tag})`
    } else {
      return `h(${tag},${propStr})`
    }
  }
  let childrenStr = traverseChildren(node) //
  return `h(${tag},${propStr},${childrenStr})`
}

const createPropArr = (node) => {
  /*元素节点
  {
  props: [], // 属性节点数组,
  directives: [], // 指令数组
 }
  */
  /*指令节点
  {
   exp: undefined | {
     content: string,
   }, // 表达式节点
   arg: undefined | {
     content: string,
   } // 表达式节点
 }
  */
  const { props, directives } = node
  return [
    ...props.map(prop => `${prop.name}: ${createText(prop.value)}`),
    ...directives.map(dir => {
      console.log(dir);
      switch (dir.name) {
        case 'bind':
          return `${dir.arg.content}: ${createText(dir.exp)}`
        case 'on':
          const eventName = `on${capitalize(dir.arg.content)}`
          //todo
          let exp = dir.exp.content
          //判断 foo(xxx) $event
          //不严谨方法: 通过判断它是否是以括号结尾，并且不包含 "=>"
          console.log(exp);
          if (/\([^)]*?\)$/.test(exp) && !exp.includes('=>')) {
            // 左括号 中间任意不是右括号的字母 右括号 
            exp = `$event => (${exp})`
          }
          return `${eventName}: ${exp}`
        case 'html'://v-html
          return `innerHTML:${createText(dir.exp)}`
        default:
          //保底
          return `${dir.name}:${createText(dir.exp)} `
      }
    })
  ]
}

const traverseChildren = (node) => {
  const { children } = node
  if (children.length === 1) {
    // 单子节点
    const child = children[0]
    if (child.type === NodeTypes.TEXT) {
      //单子节点>文本节点
      return createText(child)
    } else if (child.type === NodeTypes.INTERPOLATION) {
      //单子节点>插值节点
      return createText(child.content)
    }
  }
  //多子节点
  const results = []
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    results.push(traverseNode(child))//递归
  }
  return `[${results.join(',')}]`
}

const createTextVNode = (node) => {
  /*
{
  type: NodeTypes.INTERPOLATION,
  content: {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content: string,
    isStatic: false,
  } // 表达式节点
}
  */
  /*
  {
  type: NodeTypes.TEXT,
  content: string
}
  */
  const child = createText(node)
  return `h(Text, null, ${child})`
}

/**
 * 通用方法
 */
const createText = ({ isStatic = true, content }) => {
  // 纯文本节点没有isStatic -> 设置默认为true
  return isStatic ? JSON.stringify(content) : content
}
