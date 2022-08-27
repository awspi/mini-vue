import { render, h, Text, Fragment } from './runtime';
import { ref } from './reactive/ref'
const Comp = {
  setup() {
    const count = ref(0);
    const add = () => {
      count.value++
      console.log(count.value);
    }
    return {
      count,
      add,
    }
  },
  render(ctx) {
    return [
      h('div', null, ctx.count.value),
      h(
        'button',
        {
          onClick: ctx.add,
        },
        'add'
      ),
    ];
  }
}


const vnodeProps = {
  foo: 'foo',
  bar: 'bar',
};

const vnode = h(Comp, vnodeProps);
console.log(vnode);
render(vnode, document.body); // 渲染为<div class="a" bar="bar">foo</div>
