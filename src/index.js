import { render, h, Text, Fragment, nextTick, createApp } from './runtime';
import { ref } from './reactive/ref'
createApp({
  setup() {
    const count = ref(0);
    const add = () => {
      count.value++
      count.value++
      count.value++
      console.log(count.value);
    }
    return {
      count,
      add,
    }
  },
  render(ctx) {
    console.log('render');
    return [
      h('div', { id: 'div' }, ctx.count.value),
      h(
        'button',
        {
          id: 'btn',
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  }
}).mount(document.body)


const vnodeProps = {
  foo: 'foo',
  bar: 'bar',
};

// const vnode = h(Comp, vnodeProps);
// console.log(vnode);
// render(vnode, document.body); // 渲染为<div class="a" bar="bar">foo</div>
