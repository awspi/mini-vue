import { isString } from "../utils"
import { render } from "./render"
import { h } from "./vnode"

//
export const createApp = (rootComponent) => {
  const app = {
    mount(rootContainer) {
      //兼容 字符串写法 和 document.XXX 统一转为DOM对象
      if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer)
      }
      if (!rootComponent.render && !rootComponent.template) {
        console.log('here');
        rootComponent.template = rootContainer.innerHTML
      }
      rootContainer.innerHTML = ''//先清空 再渲染
      render(h(rootComponent), rootContainer)
    }
  }
  return app
}
