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
})
