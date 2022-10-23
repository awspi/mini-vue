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
})
