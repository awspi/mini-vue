# MINI_VUE

vue最简实现

☑️完成笔记

**代码实现**

- ✅reactivity
  - reactive
  - ref
  - effect
  - computed
- ✅runtime
  - h()
  - render()
  - createApp()
  - nextTick()
- ✅compiler
  - parse()
  - compile()

# reactivity

VUE2监听对象的变化通过 是通过Object.defineProperty的方式

VUE3使用Proxy+Reflect实现

#  runtime
# compiler

## 编译的中间产物

了解compiler的工作流程,一步步最终实现compiler部分

![image-20220829232135906](https://wsp-typora.oss-cn-hangzhou.aliyuncs.com/images/202208292321952.png)



### 模板代码

就是一段字符串,通过解析 **`parse`** 转换为原始 `AST` 抽象语法树。

```js
//例如
const tem=`<div id="foo" v-if="ok">hello {{name}}</div>`
```

### AST

指抽象语法树

例如

```vue
<div id="foo" v-if="ok">hello {{name}}</div>
```

转化结果⬇️

```js
{
  "type": "ROOT",
  "children": [
    {
      "type": "ELEMENT",
      "tag": "div",
      "tagType": "ELEMENT",
      "props": [
        {
          "type": "ATTRIBUTE",
          "name": "id",
          "value": { "type": "TEXT", "content": "foo" }
        }
      ],
      "directives": [
        {
          "type": "DIRECTIVE",
          "name": "if",
          "exp": {
            "type": "SIMPLE_EXPRESSION",
            "content": "ok",
            "isStatic": false
          }
        }
      ],
      "isSelfClosing": false,
      "children": [
        { "type": "TEXT", "content": "hello " },
        {
          "type": "INTERPOLATION",
          "content": {
            "type": "SIMPLE_EXPRESSION",
            "isStatic": false,
            "content": "name"
          }
        }
      ]
    }
  ]
}
```

![image-20220829234014176](https://wsp-typora.oss-cn-hangzhou.aliyuncs.com/images/202208292340222.png)

#### AST Node 的类型

```js
export const NodeTypes = {
  ROOT: 'ROOT',//根节点
  ELEMENT: 'ELEMENT',//元素节点
  TEXT: 'TEXT',//文本节点
  SIMPLE_EXPRESSION: 'SIMPLE_EXPRESSION',//minivue只实现表达式
  INTERPOLATION: 'INTERPOLATION',//插值节点
  ATTRIBUTE: 'ATTRIBUTE',//属性节点
  DIRECTIVE: 'DIRECTIVE',//指令节点
};
```

```js
//元素类型
const ElementTypes = {
  ELEMENT: 'ELEMENT',//元素
  COMPONENT: 'COMPONENT',//组件
};
```

#### AST Node最终转换结果

1. 根节点

```javascript
{
  type: NodeTypes.ROOT,
  children: [],
}
```

2. 纯文本节点

```javascript
{
  type: NodeTypes.TEXT,
  content: string
}
```

3. 表达式节点

```javascript
{
  type: NodeTypes.SIMPLE_EXPRESSION,
  content: string,
  // 表达式是否静态。静态可以理解为content就是一段字符串；而动态的content指的是一个变量，或一段js表达式
  isStatic: boolean,
}
```

4. 插值节点

```javascript
{
  type: NodeTypes.INTERPOLATION,
  content: {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content: string,
    isStatic: false,
  } // 表达式节点
}
```

5. 元素节点

```javascript
{
  type: NodeTypes.ELEMENT,
  tag: string, // 标签名,
  tagType: ElementTypes, // 是组件还是原生元素,
  props: [], // 属性节点数组,
  directives: [], // 指令数组
  isSelfClosing: boolean, // 是否是自闭合标签,
  children: [],
}
```

6. 属性节点

```javascript
{
  type: NodeTypes.ATTRIBUTE,
  name: string,
  value: undefined | {
    type: NodeTypes.TEXT,
    content: string,
  } // 纯文本节点
}
```

7. 指令节点

```javascript
{
  type: NodeTypes.DIRECTIVE,
  name: string,
  exp: undefined | {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content: string,
    isStatic: false,
  }, // 表达式节点
  arg: undefined | {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content: string,
    isStatic: true,
  } // 表达式节点
}
```



### Code

codegen生成的函数代码

例如

```html
<div id="foo" v-if="ok">hello {{name}}</div>
```

经过prase+transform+codegen之后生成的代码code⬇️

```js
with (ctx) {
  const { h, Text, Fragment, renderList, withModel, resolveComponent } =
    MiniVue;
  return ok
    ? h("div", { id: "foo" }, [h(Text, null, "hello "), h(Text, null, name)])
    : h(Text, null, "");
}
```



## 编译的关键函数

### parse

原始的模板代码通过解析 `parse` 转换为原始 `AST` 抽象语法树。



### transfrom

### codegen(code generate)

遍历 `codegenNode`，递归地生成最终的渲染函数代码。

从 `AST` 到渲染函数代码，`vue` 经过了 `transform`, `codegen` 两个步骤。`vue` 的 `transform` 太复杂了将这两个步骤合而为一
