import { reactive } from '../reactive/reactive'
import { effect } from '../reactive/effect'
import { normalizeVNode } from './vnode'

const fallThrough = (instance, subTree) => {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...instance.attrs
    }
  }
}

const updateProps = (instance, vnode) => {
  const { type: Component, props: vnodeProps } = vnode
  const props = (instance.props = {})
  const attrs = (instance.attrs = {})
  for (const key in vnodeProps) {
    if (Component.props?.includes(key)) {
      props[key] = vnodeProps[key]
    } else {
      attrs[key] = vnodeProps[key]
    }
  }
  instance.props = reactive(instance.props)
}
export const mountComponent = (vnode, container, anchor, patch) => {
  const { type: Component } = vnode
  const instance = (vnode.component = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    subTree: null,
    isMounted: false,
    update: null,
    next: null//保存n2
  })
  updateProps(instance, vnode)
  //* 如果是setup
  instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs })
  //* ctx在vue源码采用代理实现 此处直接合并
  instance.ctx = {
    ...instance.props,
    ...instance.setupState
  }

  //* update 直接使用effect 实现刷新
  instance.update = effect(() => {
    //* 主动更新(组件内部状态发生变化引起组件的更新)
    // 和mount合并
    if (!instance.isMounted) {
      //首次 mount
      const subTree = (instance.subTree = normalizeVNode(Component.render(instance.ctx)))

      fallThrough(instance, subTree)

      patch(null, subTree, container, anchor)
      vnode.el = subTree.el
      instance.isMounted = true
    } else {
      //update
      if (instance.next) {
        //* 被动更新(props改变)
        vnode = instance.next
        instance.next = null
        updateProps(instance, vnode)
        instance.ctx = {
          ...instance.props,
          ...instance.setupState
        }
      }
      const prev = instance.subTree
      const subTree = (instance.subTree = normalizeVNode(Component.render(instance.ctx)))
      fallThrough(instance, subTree)
      //todo BUG
      console.log(prev);
      patch(prev, subTree, container, anchor)
      vnode.el = subTree.el
    }
  })
  instance.update()
}
