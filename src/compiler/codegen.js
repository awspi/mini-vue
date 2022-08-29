import { resolveComponent } from '../runtime'
import { capitalize } from '../utils'
import { NodeTypes, renderList } from './'
import { ElementTypes } from './ast'

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
const traverseNode = (node, parent) => {
  switch (node.type) {
    case NodeTypes.ROOT:
      if (node.children.length === 1) {
        //*根节点只有一个
        //*递归他的children
        return traverseNode(node.children[0], node)
      }
      //*多个根节点
      const result = traverseChildren(node)
      return result
    case NodeTypes.ELEMENT:
      return resolveElementASTNode(node, parent)
    case NodeTypes.INTERPOLATION:
      return createTextVNode(node.content)
    case NodeTypes.TEXT:
      return createTextVNode(node)
  }
}

/**
 * 处理特殊指令 
 * @param {*} node 
 * @param {*} parent 父节点
 * @returns 
 */
const resolveElementASTNode = (node, parent) => {
  //*node.directives里有没有v-
  const ifNode = pluck(node.directives, 'if') || pluck(node.directives, 'else-if')
  if (ifNode) {

    let consequent = resolveElementASTNode(node, parent)//h('div')
    let alternate//h(Text, null, '')
    /*
    <h1 v-if="ok"></h1>
    <h2 v-else></h2> //*v-if的兄弟节点是否有v-else
    <h3></h3> 
    */
    const { children } = parent
    //node在children中的index 那他的下一个兄弟节点就是 index+1
    let i = children.findIndex(child => child === node) + 1
    //*for循环去掉空白节点
    for (; i < children.length; i++) {
      const sibling = children[i]
      if (sibling.type === NodeTypes.TEXT && !sibling.content.trim()) {
        //文本节点并且为空
        children.splice(i, 1)
        i--
        continue
      }
      if (sibling.type === NodeTypes.ELEMENT) {
        if (
          pluck(sibling.directives, 'else') ||
          pluck(sibling.directives, 'else-if', false)
        ) {
          //*else-if既是上一个条件语句的 `alternate`，又是新语句的 `condition`
          alternate = resolveElementASTNode(sibling, parent);
          children.splice(i, 1)
        }
      }
      break
    }
    //<div v-if="ok"></div>
    // 编译目标 ok ? h('div') : h(Text, null, '')

    const { exp } = ifNode
    return `${exp.content} ? ${consequent} : ${alternate || createTextVNode()}`
  }
  //
  const forNode = pluck(node.directives, 'for')
  if (forNode) {
    //含有v-for
    //`v-for` 指令不能只靠编译完成，需要 `runtime` 配合。
    //(item, index) in items
    const { exp } = forNode
    const [args, source] = exp.content.split(/\sin\s|\sof\s/)

    return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(
      node
    )}))`;
  }
  return createElementVNode(node);
}



/**
 * 
 * @param {*} directives 数组
 * @param {*} name 名称
 */
const pluck = (directives, name, remove = true) => {
  const index = directives.findIndex((dir) => dir.name === name)
  const dir = directives[index]
  if (index > -1 && remove) {
    directives.splice(index, 1)
  }
  return dir
}

/**
 * createElementVNode
 * @param {*} node 
 * @returns 
 */
const createElementVNode = (node) => {
  console.log(node);
  const { children, tagType } = node
  const tag = tagType === ElementTypes.ELEMENT
    ? `'${node.tag}'`
    : `resolveComponent('${node.tag}')`//*如果是组件,则是对象,不能是字符串
  const Comp = {

  }

  //*vModel
  const vModel = pluck(node.directives, 'model')
  //利用vue早期实现
  /*
  `<input v-model="test">`
  本质上是
  `<input :value="test" @input="test = $event.target.value">`
  */
  if (vModel) {
    console.log('vModel.exp', vModel.exp);
    node.directives.push({
      type: NodeTypes.DIRECTIVE,
      name: 'bind',
      exp: vModel.exp, // 表达式节点
      arg: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'value',
        isStatic: true,
      }
    }, {
      type: NodeTypes.DIRECTIVE,
      name: 'on',
      exp: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: `($event)=>${vModel.exp.content} = $event.target.value`,
        isStatic: false,
      },
      arg: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'input',
        isStatic: true,
      }
    })
  }

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
    results.push(traverseNode(child, node))//递归
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
  const child = createText(node);
  return `h(Text, null, ${child})`;

}

/**
 * 通用方法
 * 参数默认传入{}
 * {}默认值{ isStatic = true, content = '' }
 */
const createText = ({ isStatic = true, content = '' } = {}) => {

  // 纯文本节点没有isStatic -> 设置默认为true
  return isStatic ? JSON.stringify(content) : content
}
