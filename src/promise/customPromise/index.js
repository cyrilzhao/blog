
// Promise 状态
var STATUS = {
  FORK_PENDING: 'forkPending',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
}

var _resolutionProcedure = function (promise, x) {
  var isOnResolvedCalled = false
  var isOnRejectedCalled = false

  if (x === promise) {
    // 如果 x 和 promise 是同一个对象的引用(x === promise) ，那么 reject promise 并将一个TypeError 赋值给 reason
    _reject.call(promise, new TypeError('Type Error'))
  } else if (x instanceof _Promise) {
    // 如果 x 是一个 Promise 对象，则需要判断 x 的状态来决定 promise 的状态
    if (x.status === STATUS.PENDING) {
      // 如果 x 处于 pending 状态，那么 promise 也处于 pending 状态，直到 x 的状态变为 resolved 或者 rejected
      x.then(function (value) {
        _resolve.call(promise, value)
      }, function (reason) {
        _reject.call(promise, reason)
      })
    } else if (x.status === STATUS.RESOLVED) {
      // 如果 x 处于 resolved 状态，那么用 x 的 value 来 resolve promise
      _resolve.call(promise, x.value)
    } else {
      // 如果x 处于 rejected 状态，那么用 x 的 reason 来 reject promise
      _reject.call(promise, x.reason)
    }
  } else if (typeof x === 'object' || typeof x === 'function') {
    if (x.then === undefined || x.then === null) {
      // 如果获取 x.then 的过程中抛出异常 e ，那么将 e 作为 reason 来 reject promise
      _reject.call(promise, new TypeError('TypeError: Then should not be undefined or null'))
    } else if (typeof x.then === 'function') {
      // 如果 x.then 是一个 Function，那么调用 x.then 并传入参数 resolvePromise 和 rejectPromise

      var resolvePromise = function(y) {
        // 如果 resolvePromise 和 rejectPromise 同时被调用，或被用相同的参数调用多次，那么应该只处理第一次调用，之后的调用都应该被忽略
        if (!isOnResolvedCalled && !isOnRejectedCalled) {
          // 如果 resolvePromise 被调用且传入的参数为 y，那么再次执行此操作，参数为 (promise, y)
          _resolutionProcedure(promise, y)
          isOnResolvedCalled = true
        }
      }
      var rejectPromise = function (r) {
        // 如果 resolvePromise 和 rejectPromise 同时被调用，或被用相同的参数调用多次，那么应该只处理第一次调用，之后的调用都应该被忽略
        if (!isOnResolvedCalled && !isOnRejectedCalled) {
          // 如果 rejectPromise 被调用且传入的参数为 r，那么将 r 作为 reason 来 reject promise
          _reject.call(promise, r)
          isOnRejectedCalled = true
        }
      }

      try {
        x.then(resolvePromise, rejectPromise)
      } catch (err) {
        // 如果调用 x.then 抛出了异常 e，若在抛出异常前已经调用过 resolvePromise 或 rejectPromise，那么忽略异常即可
        // 否则将 e 作为 reason 来 reject promise
        if (!isOnResolvedCalled && !isOnRejectedCalled) {
          _reject.call(promise, err)
        }
      }
    } else {
      // 如果 x.then 不是一个 Function，那么用 x 来 resolve promise
      _resolve.call(promise, x)
    }
  } else {
    // 如果 x 不是一个 Object 或 Function，那么用 x 来 resolve promise
    _resolve.call(promise, x)
  }
}

/**
 * 用某个值来 resolve 当前 promise 对象
 *
 * @param  {Any} value    Promise 对象的结果值
 */
var _resolve = function (value) {
  var self = this

  // onResolved 通过异步的方式执行，采用 micro-task 机制，这里用 process.nextTick 来模拟
  process.nextTick(function () {
    self.status = STATUS.RESOLVED
    self.value = value

    while (self.resolvedCallBacks.length) {
      // onResolved 只能被调用一次
      var callback = self.resolvedCallBacks.shift()
      try {
        // onResolved 只会作为单纯的函数被调用
        var x = callback(value)
      } catch (err) {
        // 从 forkPromise 容器中取出当前回调函数对应的 Promise 对象
        var forkPromise = self.forkPromiseMap[callback]
        // 如果 onResolved 抛出一个异常 e, 那么 forkPromise 必须 rejected 且 reason = e
        _reject.call(forkPromise, err)
        continue
      }

      // 从 forkPromise 容器中取出当前回调函数对应的 Promise 对象
      var forkPromise = self.forkPromiseMap[callback]
      // 如果 onResolved 没有抛出异常
      // 则根据 x 的情况来决定 forkPromise 对象的状态
      _resolutionProcedure(forkPromise, x)
    }
  })
}

/**
 * 用某个 reason 来 reject 当前 promise 对象
 *
 * @param  {Error} reason    包含 Promise 对象执行失败原因的 Error 对象
 */
var _reject = function (reason) {
  var self = this

  // onRejected 通过异步的方式执行，采用 micro-task 机制，这里用 process.nextTick 来模拟
  process.nextTick(function () {
    self.status = STATUS.REJECTED
    self.reason = reason

    while (self.rejectedCallBacks.length) {
      // onRejected 只能被调用一次
      var callback = self.rejectedCallBacks.shift()
      try {
        // onRejected 只会作为单纯的函数被调用
        var x = callback(reason)
      } catch (err) {
        // 从 forkPromise 容器中取出当前回调函数对应的 Promise 对象
        var forkPromise = self.forkPromiseMap[callback]
        // 如果 onRejected 抛出一个异常 e, 那么 forkPromise 必须 rejected 且 reason = e
        _reject.call(forkPromise, err)
        continue
      }

      // 从 forkPromise 容器中取出当前回调函数对应的 Promise 对象
      var forkPromise = self.forkPromiseMap[callback]
      // 如果 onRejected 没有抛出异常
      // 则根据 x 的情况来决定 forkPromise 对象的状态
      _resolutionProcedure(forkPromise, x)
    }
  })
}

function _Promise (callback, isFork) {
  var self = this

  if (typeof callback !== 'function') {
    throw new TypeError(`Promise resolver ${callback} is not a function`)
  }

  if (isFork) {
    this.status = STATUS.FORK_PENDING
  } else {
    this.status = STATUS.PENDING
  }

  this.resolvedCallBacks = []
  this.rejectedCallBacks = []
  this.forkPromiseMap = {}

  var resolve = function (value) {
    _resolve.call(self, value)
  }
  var reject = function (reason) {
    _reject.call(self, reason)
  }

  try {
    if (this.status === STATUS.FORK_PENDING) {
      // 当前 promise 是 then 方法产生的 forkPromise 时，
      // 其状态的改变只应该由 _resolutionProcedure 操作来决定
      // 所以此处不对其做任何操作
    } else {
      // 当前 promise 不是 then 方法产生的 forkPromise 时,
      // 直接 resolve
      callback(resolve, reject)
    }
  } catch (err) {
    // 如果抛出异常的时候是 pending 状态，说明 resolve 回调还没有被执行，
    // 此时直接用 err 对象作为 reason 进行 reject
    if (this.status === STATUS.PENDING) {
      reject(err)
    }
  }
}

/**
 * 专供 then 方法用来产生 forkPromise 对象
 *
 * @param  {Function} callback    forkPromise 对象的回调函数
 * @return {_Promise}             新的 forkPromise 对象
 */
_Promise.fork = function (callback) {
  if (typeof callback !== 'function') {
    callback = function () {}
  }

  return new _Promise(callback, true)
}

_Promise.prototype.then = function (onResolved, onRejected) {
  if (typeof onResolved === 'function') {
    this.resolvedCallBacks.push(onResolved)
  }
  if (typeof onRejected === 'function') {
    this.rejectedCallBacks.push(onRejected)
  }

  if (this.status === STATUS.RESOLVED) {
    _resolve.call(this, this.value)
  }
  if (this.status === STATUS.REJECTED) {
    _reject.call(this, this.reason)
  }

  // then 方法会返回一个新的 Promise 实例对象
  var forkPromise = _Promise.fork()
  // 将当前 then 函数返回的 forkPromise 对象保存起来，方便当前 promise 对象状态变化时，
  // 能根据 onResolved 或 onRejected 函数的返回值来修改 forkPromise 对象的状态
  this.forkPromiseMap[onResolved] = forkPromise
  this.forkPromiseMap[onRejected] = forkPromise

  return forkPromise
}

module.exports = _Promise
