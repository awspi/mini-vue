//*Attributes 和 DOM Properties 有区别,使用正则区分
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
export const patchProps = (oldProps, newProps, el) => {
  if (oldProps === newProps) {
    //props都相等,就不用patch了
    return
  }
  //*防止props为空或者null(如果用默认参数,当参数为null是会当成有参数)
  oldProps = oldProps || {}//兼容处理
  newProps = newProps || {}//兼容处理
  for (const key in newProps) {
    const next = newProps[key]
    const prev = oldProps[key]
    if (prev !== next) {
      patchDomProp(prev, next, key, el)
    }
    //移除oldProps中 newProps没有的部分
    for (const key in oldProps) {
      if (newProps[key] === null) {
        patchDomProp(oldProps[key], null, key, el)
      }
    }
  }
}
/**
 * patch单个节点属性
 */
const patchDomProp = (prev, next, key, el) => {
  switch (key) {
    case 'class':
      el.className = next || ''//防止next=null 加上||''
      break
    case 'style':
      if (next == null) {
        el.removeAttribute('style')
      } else {
        //先移除next中不存在的prev的style
        if (prev) {
          for (const styleName in prev) {
            if (next[styleName] === null) {
              el.styleName = null
            }
          }
        }
        //再加入next中的style
        for (const styleName in next) {
          el.style[styleName] = next[styleName]
        }
      }
      break
    default:
      //事件 onXXX
      if (/^on[^a-z]/.test(key)) {
        const eventName = key.slice(2).toLowerCase()//onClick->click
        //先移除next中不存在的prev的事件
        if (prev) {
          el.removeEventListener(eventName, prev)
        }
        if (next) {
          //再加入next中的事件
          el.addEventListener(eventName, next)
        }
      } else if (domPropsRE.test(key)) {
        // 满足上面正则的，作为domProp赋值
        //特殊处理类似<input type="checkbox" checked />
        if (next === '' && typeof el[key] === 'boolean') {
          // 例如{ checked: '' }
          next = true
        }
        el[key] = next;
      } else {
        // 否则，用setAttribute
        //类似{ "custom": false }
        if (next === null || next === false) {
          // 判断，并且使用`removeAttribute`
          el.removeAttribute(key)
        } else {
          el.setAttribute(key, next);
        }
      }
      break
  }
}
