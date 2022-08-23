import { ShapeFlags } from "./vnode"

export const render = (vnode, container) => {
  mount(vnode, container)
}

/**
 * 挂载节点
 * @param {*} vnode 
 * @param {*} container 
 */
const mount = (vnode, container) => {
  const { shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.ELEMENT) {
    mountElement(vnode, container)
  } else if (shapeFlag & ShapeFlags.TEXT) {
    mountTextNode(vnode, container)
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container)
  } else {
    mountComponent(vnode, container)
  }
}

/**
 * mountElement
 * 普通元素
 * @param {*} vnode 
 * @param {*} containder 
 */
const mountElement = (vnode, containder) => {
  const { type, props } = vnode
  const el = document.createElement(type)
  mountProps(props, el)
  mountChildren(vnode, el)
  containder.appendChild(el)
}
/**
 * mountProps
 * @param {*} props 
 * @param {*} el 
 */
const mountProps = (props, el) => {
  // {
  //   class: 'a b',
  //   style: {
  //     color: 'red',
  //     fontSize: '14px',
  //   },
  //   onClick: () => console.log('click'),
  //   checked: '',
  //   custom: false
  // }

  //*Attributes 和 DOM Properties 有区别,使用正则区分
  const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
  for (const key in props) {
    const value = props[key]
    switch (key) {
      case 'class':
        el.className = value
        break
      case 'style':
        for (const styleName in value) {
          el.style[styleName] = value[styleName]
        }
        break
      default:
        //事件 onXXX
        if (/^on[^a-z]/.test(key)) {
          const eventName = key.slice(2).toLowerCase()//onClick->click
          el.addEventListener(eventName, value)
        } else if (domPropsRE.test(key)) {
          // 满足上面正则的，作为domProp赋值
          //特殊处理类似<input type="checkbox" checked />
          if (value === '' && typeof el[key] === 'boolean') {
            // 例如{ checked: '' }
            value = true
          }
          el[key] = value;
        } else {
          // 否则，用setAttribute
          //类似{ "custom": false }
          if (value === null || value === false) {
            // 判断，并且使用`removeAttribute`
            el.removeAttribute(key)
          } else {
            el.setAttribute(key, value);
          }
        }
        break
    }
  }
}
const mountChildren = (vnode, containder) => {
  const { shapeFlag, children } = vnode
  //TEXT_CHILDREN
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, containder)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //ARRAY_CHILDREN
    children.forEach(child => {
      //递归
      mount(child, containder)
    })
  }
}
/**
 * mountText
 * @param {*} vnode 
 * @param {*} containder 
 */
const mountTextNode = (vnode, containder) => {
  const textNode = document.createTextNode(vnode.children)
  containder.appendChild(textNode)
}
/**
 * mountFragment
 * @param {*} vnode 
 * @param {*} containder 
 */
const mountFragment = (vnode, containder) => {
  //Fragment本身不渲染,直接渲染子节点
  mountChildren(vnode, containder)
}
/**
 * mountComponent
 * @param {*} vnode 
 * @param {*} containder 
 */
const mountComponent = (vnode, containder) => {
  //todo
}
