/**
 * 没有归并简化的patch
 * @param {*} n1 
 * @param {*} n2 
 * @param {*} containder 
 */
const patchChildren = (n1, n2, containder) => {
  const { shapeFlag: prevShapeFlag, children: c1 } = n1
  const { shapeFlag, children: c2 } = n2
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //* n2:TEXT
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //*n1:TEXT 更新textContent
      containder.textContent = n2.textContent
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //*n1:ARRAY 删除n1(unmountChildren),更新textContent
      unmountChildren(c1)
      containder.textContent = n2.textContent
    } else {
      //*n1:NULL 更新textContent
      containder.textContent = n2.textContent
    }
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //* n2:ARRAY
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //*n1:TEXT 删除n1,mount n2 (mountChildren)
      containder.textContent = ''
      mountChildren(c2, containder)
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //*n1:ARRAY patchArrayChildren
      // patchArrayChildren()
    } else {
      //*n1:NULL mount n2 (mountChildren)
      mountChildren(c2, containder)
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
 * patchKeyedChildren V1
 * O(n2)
 * @param {*} c1 
 * @param {*} c2 
 * @param {*} container 
 * @param {*} anchor 
 */
const patchKeyedChildrenV1 = (c1, c2, container, anchor) => {
  //*记录当前的 next 在 c1 中找到的 index 的最大值。
  let maxNewIndexSoFar = 0
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i]
    let isFind = false
    for (let j = 0; j < c1.length; j++) {
      const prev = c1[j]
      if (next.key === prev.key) {
        isFind = true
        patch(prev, next, container, anchor)
        if (j < maxNewIndexSoFar) {
          //*需要移动
          //首个 const curAnchor = c1[0].el 首个
          //非首个 const curAnchor = c2[i - 1].el.nextSibling
          const curAnchor = c2[i - 1].el.nextSibling
          container.insertBefore(next.el, curAnchor)
        } else {
          maxNewIndexSoFar = j
        }
        break
      }
    }
    if (!isFind) {
      //* 未找到 插入操作
      const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling
      patch(null, next, container, curAnchor)
    }
  }
  //* 考虑c1中有需要移除节点的情况 ->遍历旧节点,看新节点中是否存在,若不存在则移除
  for (let i = 0; i < c1.length; i++) {
    const prev = c1[i]
    if (!c2.find(next => next.key === prev.key)) {
      unmount(c1[i])
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
const patchKeyedChildrenV2 = (c1, c2, container, anchor) => {
  const map = new Map()//*用 map 优化
  c1.forEach((prev, j) => {
    map.set(prev.key, { prev, j })
  })
  //*记录当前的 next 在 c1 中找到的 index 的最大值。
  let maxNewIndexSoFar = 0
  for (let i = 0; i < c2.length; i++) {
    const next = c2[i]
    //首个 const curAnchor = c1[0].el 首个
    //非首个 const curAnchor = c2[i - 1].el.nextSibling
    const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling
    if (map.has(next.key)) {
      const { prev, j } = map.get(next.key)
      //*find
      patch(prev, next, container, anchor)
      if (j < maxNewIndexSoFar) {
        //*需要移动
        container.insertBefore(next.el, curAnchor)
      } else {
        maxNewIndexSoFar = j
      }
      map.delete(next.key) //匹配出后就删除
    } else {
      //* 未找到 插入操作
      patch(null, next, container, curAnchor)
    }
  }
  //匹配结束后剩下的卸载
  map.forEach(prev => {
    unmount(prev)
  })
}
