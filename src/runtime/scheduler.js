const queue = []
let isFlushing = false//只执行一次
const resolvedPromise = Promise.resolve()
let currentFlushPromise = null

/**
 * nextTick 
 * !important
 * @param {*} fn 
 */
export const nextTick = (fn) => {
  //*如果调用时正在执行更新操作 使用currentFlushPromise 
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(fn) : p //兼容 await nextTick()
}

/**
 * queueJob
 * @param {*} job 
 */
export const queueJob = (job) => {
  if (!queue.length || !queue.includes(job)) {
    //queue为空或者queue中不存在job才会触发
    queue.push(job)
    queueFlush()
  }
}

/**
 * 
 */
const queueFlush = () => {
  if (!isFlushing) {
    isFlushing = true
    //* 放在微任务中执行
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

const flushJobs = () => {
  try {
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i]
      job()
    }
  } finally {
    isFlushing = false
    queue.length = 0//清空队列
    currentFlushPromise = null;
  }
}


