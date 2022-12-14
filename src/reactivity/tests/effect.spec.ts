import {reactive} from '../reactive'
import {effect,stop} from '../effect'
describe('effect',()=>{
  it('happy path',()=>{
    const user=reactive({
      age:20
    })
    let nextAge
    effect(()=>{
      nextAge=user.age+1
    })
    expect(nextAge).toBe(21)

    //update 触发依赖
    user.age++
    expect(nextAge).toBe(22)
  })
  it('should return runner when call effect',()=>{
    //1.effect(fn) -> function(runner) -> fn -> return
    let foo=10
    const runner=effect(()=>{
      foo++
      return 'foo'
    })
    expect(foo).toBe(11)
    const r=runner()
    expect(foo).toBe(12)
    expect(r).toBe('foo')
  })

  it('scheduler', () => {
    // 1.通过effect的第二个参数给定的一个scheduler（调度器）函数
    // 2.当effect第一次执行的时候还会执行fn
    // 3.当响应式对象改变（做了set操作）的时候，就不会执行fn，而是执行scheduler
    // 4.但是当执行runner的时候，会再次执行fn
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    // should be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    // should not run yet
    expect(dummy).toBe(1)
    // manually run
    run()
    // should have run
    expect(dummy).toBe(2)
  })
  it('stop', () => {
    // stop 的操作可以停止响应式追踪（停止执行副作用），但是依然可以手动更新（调用runner）
    // 之前我们是在 trigger里面去触发副作用函数的，这个需求的话可以想办法将相应的effect从deps
    // 中删除，这样做是不可回退的，或者下次需要重新添加的，也可以非effect加一个属性，控制是否是stop状态
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    stop(runner)

    // obj.prop = 3
    // 下面这种方式的话单元测试无法通过，原因是obj.prop++
    // 相当于obj.prop = obj.prop + 1，这个动作会同时触发get和set，
    // 我们stop操作是在set的时候被清理的，但是执行get的时候又会track，
    // 然后set的时候又会执行新的effect副作用
    // obj.prop++
    // expect(dummy).toBe(2)

    // // stopped effect should still be manually callable
    // runner()
    // expect(dummy).toBe(3)
  })
  it('onStop', () => {
    // onStop相当于是stop操作的一个回调，他会在stop被调用后执行
    const obj = reactive({
      foo: 1,
    })

    const onStop = jest.fn()
    let dummy
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      {
        onStop,
      }
    )

    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  })
})
