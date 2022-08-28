import { NodeTypes, ElementTypes, createRoot } from './ast'
import { isVoidTag, isNativeTag } from '.'
import { camelize } from '../utils'
export const parse = (content) => {

  //vue中 使用函数式而不是类的写法
  //纯函数需要上下文
  //把上下文相互传递
  const context = createParserContext(content)
  const children = parseChildren(context)
  return createRoot(children)

}
const createParserContext = (content) => {
  return {
    options: {
      delimiters: ['{{', '}}'],//分隔符 插值{{}}
      isVoidTag,
      isNativeTag
    },
    source: content
  }
}

const parseChildren = (context) => {
  const nodes = []
  while (!isEnd(context)) {
    const s = context.source
    let node = null
    if (s.startsWith(context.options.delimiters[0])) {
      //{{开头 ->parse 插值节点
      // parseInterpolation
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      //<开头 ->parse 元素节点(元素节点、属性节点、指令节点)
      //parseElement
      node = parseElement(context)
    } else {
      //other ->parse Text
      // parseText 
      node = parseText(context)
    }
    nodes.push(node)
  }
  //!whitespace优化
  let removedWhitespaces = false
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === NodeTypes.TEXT) {
      // 区分文本节点是否全是空白
      if (/[^\t\r\f\n ]/.test(node.content)) {
        // 文本节点存在一些字符
        node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
      } else {
        // 文本节点全是空白
        const prev = node[i - 1]
        const next = node[i + 1]
        if (!prev || !next || (prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.ELEMENT && /[\r\n]/.text(node.content))) {
          //前一个节点不存在||后一个节点不存在||前一个节点后一个节点都是元素节点且带有换行符
          //删除空白节点
          removedWhitespaces = true;
          nodes[i] = null;
        } else {
          node.content = ' ';
        }
      }
    }
  }
  return removedWhitespaces ? nodes.filter(Boolean) : nodes
}

const parseInterpolation = (context) => {
  //<div id="foo" v-if="ok">hello {{name}}</div>
  const [open, close] = context.options.delimiters
  advanceBy(context, open.length)

  const closeIndex = context.source.indexOf(close)
  const content = parseTextData(context, closeIndex).trim()
  advanceBy(context, close.length)
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      isStatic: false,
    } // 表达式节点
  }
}
/**
 * parseElement
 * @param {*} context 
 */
const parseElement = (context) => {
  //<div id="foo" v-if="ok">hello {{name}}</div>
  //parseTag(start)
  const element = parseTag(context)
  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element
  }
  //parseChildren 递归
  element.children = parseChildren(context)
  //pareseTag(end)
  parseTag(context)//吃掉尾

  return element
}

/**
 * parseTag
 * @param {*} context 
 * @returns 
 */
const parseTag = (context) => {
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)

  const tag = match[1]

  advanceBy(context, match[0].length)
  advanceSpaces(context)//eat space

  const { props, directives } = parseAttributes(context)

  const isSelfClosing = context.source.startsWith('/>')
  advanceBy(context, isSelfClosing ? 2 : 1)// eat /> or >

  const tagType = isComponent(tag, context)
    ? ElementTypes.COMPONENT
    : ElementTypes.ELEMENT
  return {
    type: NodeTypes.ELEMENT,
    tag, // 标签名,
    tagType, // 是组件还是原生元素,
    props, // 属性节点数组,
    directives, // 指令数组
    isSelfClosing,// 是否是自闭合标签,
    children: [],
  }
}
/**
 * 判断是否是组件
 * (通过枚举判断)
 * @param {} context 
 */
const isComponent = (tag, context) => {
  return !context.options.isNativeTag(tag)
}

/**
 * parseAttributes
 */
const parseAttributes = (context) => {

  const props = []
  const directives = []
  while (
    context.source.length &&
    !context.source.startsWith('>') &&
    !context.source.startsWith('/>')
  ) {
    let attr = parseAttribute(context)
    if (attr.type === NodeTypes.DIRECTIVE) {
      directives.push(attr);
    } else {
      props.push(attr);
    }
  }
  return {
    props,
    directives
  }
}
/**
 * parseAttribute 单个
 * @param {*} context 
 */
const parseAttribute = (context) => {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];

  advanceBy(context, name.length)
  advanceSpaces(context)

  let value = null
  if (context.source[0] === '=') {
    advanceBy(context, 1)//eat '='
    advanceSpaces(context)
    value = parseAttributeValue(context)
    advanceSpaces(context);
  }

  //* Directive
  /*
  <div v-bind:class="myClass" />
  <div @click="handleClick" />
  <div :=="handleClick" />
  */
  if (/^(:|@|v-)/.test(name)) {
    let dirName, argContent//!需要初始化为undefined
    if (name[0] === ':') {
      dirName = 'bind'
      argContent = name.slice(1)
    } else if (name[0] === '@') {
      dirName = 'on'
      argContent = name.slice(1)
    } else if (name.startsWith('v-')) {
      [dirName, argContent] = name.slice(2).split(':')
    }
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      }, // 表达式节点
      arg: argContent && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: camelize(argContent),
        isStatic: true,
      } // 表达式节点
    }
  }


  //* Attribute
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    } // undefend|纯文本节点
  }
}
const parseAttributeValue = (context) => {
  //a='XXX'|"XXX"|XXX(不考虑没有引号)
  const quote = context.source[0]
  advanceBy(context, 1)

  const endIndex = context.source.indexOf(quote)
  const content = parseTextData(context, endIndex)
  advanceBy(context, 1)

  return { content }
}

/**
 * parseText
 * 不支持文本节点中带'<'
 * !缺陷 文本节点如果为a<b 会被解析成两个节点
 * ! </
 * @param {*} context 
 * @returns 
 */
const parseText = (context) => {
  const endToken = ['<', context.options.delimiters[0]]  // 结束标识
  let endIndex = context.source.length //长度(下标)

  for (let i = 0; i < endToken.length; i++) {
    let index = context.source.indexOf(endToken[i])
    if (index !== -1 && index < endIndex) {
      endIndex = index //更新endIndex为更小的 (endIndex前移)
    }
  }

  const content = parseTextData(context, endIndex)


  return {
    type: NodeTypes.TEXT,
    content
  }
}

/**
 *  判断是否结束循环
 * @param {*} context 
 * @returns 
 */
const isEnd = (context) => {
  const s = context.source
  return s.startsWith('</') || !s //s==='' s==='</xxx>'

}

//工具函数

const parseTextData = (context, length) => {
  const text = context.source.slice(0, length);
  advanceBy(context, length);
  return text
}

/**
 * 吃掉一个部分
 * @param {*} context 
 * @param {*} numberOfCharacters 吃掉的字符个数
 */
const advanceBy = (context, numberOfCharacters) => {
  context.source = context.source.slice(numberOfCharacters);
}
/**
 * 吃掉所有空格
 */
const advanceSpaces = (context) => {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)//match[0].length匹配到的空格的长度
  }
}
