import { ShapeFlags } from "./vnode"
import { patchProps } from "./patchProps"
import { mountComponent } from "./component"
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
  unmount(vnode.component.subTree)
}

const processComponent = (n1, n2, container, anchor) => {
  //todo
  if (!n1) {
    //n1不存在
    mountComponent(n2, container, anchor, patch)
  } else {
    //n1存在-> shouldComponentUpdate ->updateComponent
    //todo shouldComponentUpdate
    updateComponent(n1, n2)
  }
}



/**
 * updateComponent
 * @param {*} n1 
 * @param {*} n2 
 */
const updateComponent = (n1, n2) => {
  n2.component = n1.component//继承
  n2.component.next = n2
  n2.component.update()
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
 * @param {*} container 
 */
const mountTextNode = (vnode, container, anchor) => {
  const textNode = document.createTextNode(vnode.children)
  ////container.appendChild(textNode)
  container.insertBefore(textNode, anchor)
  vnode.el = textNode
}

const processFragment = (n1, n2, container, anchor) => {

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
 * @param {*} container 
 */
const patchChildren = (n1, n2, container, anchor) => {
  const { shapeFlag: prevShapeFlag, children: c1 } = n1
  const { shapeFlag, children: c2 } = n2
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //* n2:TEXT
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //*n1:ARRAY 删除n1(unmountChildren),更新textContent
      unmountChildren(c1)
    }
    if (c1 !== c2) {
      container.textContent = c2
    }
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //* n2:ARRAY
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //*n1:TEXT 删除n1,mount n2 (mountChildren)
      container.textContent = ''
      mountChildren(c2, container, anchor)
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //*n1:ARRAY patchArrayChildren
      //只要第一个元素有key,就当作都有key
      if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
        patchKeyedChildren(c1, c2, container, anchor)
      } else {
        patchUnkeyedChildren(c1, c2, container, anchor)
      }
    } else {
      //*n1:NULL mount n2 (mountChildren)
      mountChildren(c2, container, anchor)
    }
  } else {
    //* n2:null
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //*n1:TEXT 删除n1
      container.textContent = ''
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //*n1:ARRAY 删除n1(unmountChildren)
      unmountChildren(c2, container)
    } else {
      //*n1:NULL 不做处理
    }
  }
}
/**
 * patchKeyedChildren
 * O(n)
 * @param {*} c1 prev
 * @param {*} c2 next
 * @param {*} container 
 * @param {*} anchor 
 */
const patchKeyedChildren = (c1, c2, container, anchor) => {
  let i = 0
  let e1 = c1.length - 1//下标
  let e2 = c2.length - 1
  //* 1.从左至右依次比对
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[i], c2[i], container, anchor)
    i++
  }
  //* 2.从右至左依次比对
  while (i <= e1 && i <= e2 && c1[e1].key === c2[e2].key) {
    patch(c1[e1], c2[e2], container, anchor)
    e1--
    e2--
  }
  /*
   c1:a b c
   c2 a d b c
   i=1
   e1=2 ->1 ->0
   e2=3 ->2 ->1 
  */
  //* 3.1 经过 1、2 直接将旧结点比对完，此时 i > e1,则剩下的新结点直接 mount
  if (i > e1) {
    for (let j = i; j <= e2; j++) {
      const nextPos = e2 + 1
      const curAnchor = c2[nextPos] && c2[nextPos].el || anchor//防止e2=2.length - 1
      patch(null, c2[j], container, curAnchor)
    }
  } else if (i > e2) {
    //* 3.2 经过 1、2 直接将新结点比对完，，此时 i > e2,则剩下的旧结点直接unmount
    for (let j = i; j <= e1; j++) {
      unmount(c1[j])
    }
  } else {
    //*  4.采用传统 diff算法，但不真的添加和移动，只做 标记和删除
    const map = new Map()//*用 map 优化
    //* c1的前后都可能被截断
    for (let j = i; j <= e1; j++) {
      const prev = c2[k + i]
      map.set(prev.key, { prev, j })
    }

    let maxNewIndexSoFar = 0//*记录当前的 next 在 c1 中找到的 index 的最大值。
    let move = false //是否需要移动
    const toMounted = [] //记录待新增的元素的下标

    const source = new Array(e2 - i + 1).fill(-1)//source数组 记录c2元素在c1下标
    for (let k = 0; k < source.length; k++) {
      const next = c2[k + i]
      if (map.has(next.key)) {
        //*find
        const { prev, j } = map.get(next.key)
        patch(prev, next, container, anchor)
        if (j < maxNewIndexSoFar) {
          //*需要移动
          move = true
        } else {
          maxNewIndexSoFar = j
        }
        source[k] = j //* 填入下标
        map.delete(next.key) //匹配出后就删除
      } else {
        //* 未找到 插入操作
        // patch(null, next, container, curAnchor)
        //* toMounted处理' 不需要移动，但还有未添加的元素' 的情况
        toMounted.push(k + i)//新添加的元素下标
      }
    }
    //匹配结束后剩下的卸载
    map.forEach(prev => {
      unmount(prev)
    })
    //
    if (move) {
      //* 5.需要移动，则采用新的最长上升子序列算法
      const seq = getSequence(source)
      let j = seq[seq.length - 1]
      for (let k = source.length - 1; k >= 0; k--) {
        if (seq[j] === k) {
          //不用移动
          j--
        } else {
          const pos = k + i
          const nextPos = pos + 1
          const curAnchor = c2[nextPos] && c2[nextPos].el || anchor//防止e2=2.length - 1

          if (source[k] === -1) {
            //新节点->mount
            patch(null, c2[pos], container, curAnchor)
          } else {
            //移动
            container.insertBefore(c2[pos].el, curAnchor)
          }
        }
      }
    } else if (toMounted.length) {
      //* 6.特殊情况：不需要移动，但还有未添加的元素
      for (let k = toMounted.length - 1; k >= 0; k--) {
        const pos = toMounted[k]
        const nextPos = pos + 1
        const curAnchor = c2[nextPos] && c2[nextPos].el || anchor//防止e2=2.length - 1
        patch(null, c2[pos], container, curAnchor)
      }
    }
  }
}

/**
 * 最长上升子序列
 *  贪婪+二分
 * @param {*} nums 
 * @returns 
 */
const getSequence = (nums) => {
  const arr = [nums[0]]
  const postion = [0]//nums加入arr时的位置
  //3 2 4 1  
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === -1) continue //! source中初始值为-1,此时不参与最长上升子序列的计算
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i])
      postion.push(arr.length - 1)
    } else {
      //* 二分查找  arr[l]>=nums[i]
      let l = 0
      let r = arr.length
      while (l <= r) {
        let mid = ~~((l + r) / 2)//* 使用 ~~ 去掉一个数的小数部分
        //* 这个方法与Math.floor()不同，它只是单纯的去掉小数部分，无论正负都不会改变整数部分。
        if (nums[i] > arr[mid]) {
          l = mid + 1
        } else if (nums[i] < arr[mid]) {
          r = mid - 1
        } else {
          //相等
          l = mid
          break
        }
      }
      arr[l] = nums[i]
      postion.push(l)
    }
  }
  // *返回子序列 复用arr (arr已经没用了)
  let cur = arr.length - 1
  for (let i = postion.length - 1; i >= 0 && cur >= 0; i--) {
    if (postion[i] === cur) {
      arr[cur--] = i
    }
  }
  return arr
}

/**
 * patchUnkeyedChildren
 * @param {*} c1 
 * @param {*} c2 
 * @param {*} container 
 */
const patchUnkeyedChildren = (c1, c2, container, anchor) => {
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
    patch(c1[i], c2[i], container, anchor)
  }
  if (oldLen > newLen) {
    unmountChildren(c1.slice(commonLen))
  } else if (oldLen < newLen) {
    mountChildren(c2.slice(commonLen), container, anchor)
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
 * @param {*} container 
 */
const mountElement = (vnode, container, anchor) => {
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
  // // container.appendChild(el)
  container.insertBefore(el, anchor)
  vnode.el = el
}
/**
 * mountChildren
 * @param {Array} children 
 * @param {*} container 
 */
const mountChildren = (children, container, anchor) => {
  children.forEach(child => {
    patch(null, child, container, anchor) // 递归
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


