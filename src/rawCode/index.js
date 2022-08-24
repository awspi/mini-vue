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
