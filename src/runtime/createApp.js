import { camelize, capitalize, isString } from "../utils"
import { render } from "./render"
import { h } from "./vnode"

//定义模块全局变量
let components
export const createApp = (rootComponent) => {
  components = rootComponent.components || {}
  const app = {
    mount(rootContainer) {
      //兼容 字符串写法 和 document.XXX 统一转为DOM对象
      if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer)
      }
      if (!rootComponent.render && !rootComponent.template) {
        rootComponent.template = rootContainer.innerHTML
      }
      rootContainer.innerHTML = ''//先清空 再渲染
      render(h(rootComponent), rootContainer)
    }
  }
  return app
}

/**
 * 
 * @param {*} name 
 * @returns 
 */
export const resolveComponent = (name) => {
  //support tree-item||treeItem||TreeItem
  return components && (
    components[name] ||
    components[camelize(name)] ||
    components[capitalize(camelize(name))])
}
