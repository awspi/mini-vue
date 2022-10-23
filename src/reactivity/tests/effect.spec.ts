import {reactive} from '../reactive'
import {effect} from '../effect'
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
})
