import { ShapeFlags } from "./vnode"
import { patchProps } from "./patchProps"
export const render = (vnode, container) => {
  const prevVNode = container._vnode
  if (!vnode) {
    // n2不存在
    if (prevVNode) {
      // n1存在
      unmount(prevVNode)
    }
  } else {
    // n2存在
    patch(prevVNode, vnode, container)
  }
  container._vnode = vnode
}

const unmount = (vnode) => {
  const { shapeFlag, el } = vnode
  if (shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode)
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    unmountFragment(vnode)
  } else {
    //对Text,Element执行removeChild
    el.parentNode.removeChild(el)
  }
}

/**
 * 卸载fragment
 * @param {*} vnode 
 */
const unmountFragment = (vnode) => {
  const { el: cur, anchor: end } = vnode
  const { parentNode } = cur
  while (cur != end) {
    let next = cur.nextSibling
    parentNode.removeChild(cur)
    cur = next
  }
  parentNode.removeChild(end)
}

/**
 * 卸载组件
 * @param {} vnode 
 */
const unmountComponent = (vnode) => {
  //todo
}

const processComponent = (n1, n2, container, anchor) => {
  //todo
}

/**
 * 处理Text节点
 * @param {*} n1 
 * @param {*} n2 
 * @param {*} container 
 */
const processText = (n1, n2, container, anchor) => {
  if (!n1) {
    //n1不存在
    mountTextNode(n2, container, anchor)
  } else {
    //n1存在->更新el.textContent
    n2.el = n1.el;
    n2.el.textContent = n2.children;
  }
}
/**
 * mountTextNode
 * @param {*} vnode 
 * @param {*} containder 
 */
const mountTextNode = (vnode, containder, anchor) => {
  const textNode = document.createTextNode(vnode.children)
  ////containder.appendChild(textNode)
  containder.insertBefore(textNode, anchor)
  vnode.el = textNode
}

const processFragment = (n1, n2, container, anchor) => {
  //todo 复习下
  const fragmentStartAnchor = (n2.el = n1
    ? n1.el
    : document.createTextNode(''))
  const fragmentEndAnchor = (n2.anchor = n1
    ? n1.anchor
    : document.createTextNode(''))

  if (!n1) {
    ////container.appendChild(FragmentStartAnchor)
    ////container.appendChild(FragmentEndAnchor)
    container.insertBefore(fragmentStartAnchor, anchor)
    container.insertBefore(fragmentEndAnchor, anchor)
    mountChildren(n2.children, container, fragmentEndAnchor)
  } else {
    patchChildren(n1, n2, container, fragmentEndAnchor)
  }
}
const processElement = (n1, n2, container, anchor) => {
  if (!n1) {
    //n1不存在
    mountElement(n2, container, anchor)
  } else {
    //n1存在
    patchElement(n1, n2)
  }
}
/**
 *  patchElement
 * patchElement不需要anchor
 * @param {*} n1 
 * @param {*} n2 
 */
const patchElement = (n1, n2) => {
  n2.el = n1.el
  patchProps(n1.props, n2.props, n2.el)
  patchChildren(n1, n2, n2.el)
}


/**
 * patchChildren
 * @param {*} n1 
 * @param {*} n2 
 * @param {*} containder 
 */
const patchChildren = (n1, n2, containder, anchor) => {
  const { shapeFlag: prevShapeFlag, children: c1 } = n1
  const { shapeFlag, children: c2 } = n2
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //* n2:TEXT
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //*n1:ARRAY 删除n1(unmountChildren),更新textContent
      unmountChildren(c1)
    }
    if (c1 !== c2) {
      containder.textContent = c2.textContent
    }
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //* n2:ARRAY
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //*n1:TEXT 删除n1,mount n2 (mountChildren)
      containder.textContent = ''
      mountChildren(c2, containder, anchor)
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //*n1:ARRAY patchArrayChildren
      patchArrayChildren(c1, c2, containder, anchor)
    } else {
      //*n1:NULL mount n2 (mountChildren)
      mountChildren(c2, containder, anchor)
    }
  } else {
    //* n2:null
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //*n1:TEXT 删除n1
      containder.textContent = ''
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //*n1:ARRAY 删除n1(unmountChildren)
      unmountChildren(c2, containder)
    } else {
      //*n1:NULL 不做处理
    }
  }
}
/**
 * patchArrayChildren
 * @param {*} c1 
 * @param {*} c2 
 * @param {*} containder 
 */
const patchArrayChildren = (c1, c2, containder, anchor) => {
  /*
  > c1: a b c
  > c2: d e f

  > c1: a b c
  > c2: d e f g h

  > c1: a b c g h
  > c2: d e f
  */
  const oldLen = c1.length
  const newLen = c2.length
  const commonLen = Math.min(oldLen, newLen)
  for (let i = 0; i < commonLen; i++) {
    patch(c1[i], c2[i], containder, anchor)
  }
  if (oldLen > newLen) {
    unmountChildren(c1.slice(commonLen))
  } else if (oldLen < newLen) {
    mountChildren(c2.slice(commonLen), containder, anchor)
  }
}
/**
 * unmountChildren
 * @param {Array} children 
 */
const unmountChildren = (children) => {
  children.forEach(child => {
    unmount(child)
  })
}
/**
 * mountElement
 * 挂载普通元素
 * @param {*} vnode 
 * @param {*} containder 
 */
const mountElement = (vnode, containder, anchor) => {
  const { type, props, shapeFlag, children } = vnode
  const el = document.createElement(type)
  //TEXT_CHILDREN
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //! mountTextNode(vnode, el, anchor) 不传入anchor
    mountTextNode(vnode, el)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //ARRAY_CHILDREN
    // 这里不用传anchor，因为这里的el是新建的，anchor等同于最后一个
    mountChildren(children, el)
  }
  if (props) {
    patchProps(null, props, el)//复用patchProps
  }
  // // containder.appendChild(el)
  containder.insertBefore(el, anchor)
  vnode.el = el
}
/**
 * mountChildren
 * @param {Array} children 
 * @param {*} containder 
 */
const mountChildren = (children, containder, anchor) => {
  children.forEach(child => {
    patch(null, child, containder, anchor) // 递归
  })
}


/**
 * patch
 * @param {*} n1 prevVNode
 * @param {*} n2 nextVNode
 * @param {*} container 
 */
const patch = (n1, n2, container, anchor) => {
  if (n1 && !isSameVNode(n1, n2)) {
    // n2与n1类型不同
    //!重设anchor
    anchor = (n1.anchor || n1.el).nextSibling
    unmount(n1)
    n1 = null
  }
  const { shapeFlag } = n2
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container, anchor)
  } else if (shapeFlag & ShapeFlags.TEXT) {

    processText(n1, n2, container, anchor)
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container, anchor)
  } else {
    processElement(n1, n2, container, anchor)
  }
}
/**
 * 判断是否是同类型的节点
 * @param {*} n1 
 * @param {*} n2 
 * @returns 
 */
const isSameVNode = (n1, n2) => {
  return n1.type === n2.type
}


