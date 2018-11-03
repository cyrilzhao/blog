
// Promise 状态
var STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
}

var _resolutionProcedure = function (promise, x) {
  var isOnResolvedCalled = false
  var isOnRejectedCalled = false

  if (x === promise) {
    // 如果 x 和 promise 是同一个对象的引用(x === promise) ，那么 reject promise 并将一个TypeError 赋值给 reason
    _reject.call(promise, new Error('Type Error'))
  } else if (x instanceof _Promise && x.status !== STATUS.PENDING) {
    // 如果 x 是一个 Promise 对象，则需要判断 x 的状态来决定 promise 的状态
    if (x.status === STATUS.RESOLVED) {
      // 如果 x 处于 resolved 状态，那么用 x 的 value 来 resolve promise
      _resolve.call(promise, x.value)
    } else {
      // 如果x 处于 rejected 状态，那么用 x 的 reason 来 reject promise
      _reject.call(promise, x.reason)
    }
  } else if (typeof x === 'object' || typeof x === 'function') {
    if (x.then === undefined || x.then === null) {
      // 如果获取 x.then 的过程中抛出异常 e ，那么将 e 作为 reason 来 reject promise
      _reject.call(promise, new Error('TypeError: Then should not be undefined or null'))
    } else if (typeof x.then === 'function') {
      // 如果 x.then 是一个 Function，那么调用 x.then 并传入参数 resolvePromise 和 rejectPromise
      try {
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

var _resolve = function (value) {
  var self = this

  process.nextTick(function () {
    self.status = STATUS.RESOLVED
    self.value = value

    while (self.resolvedCallBacks.length) {
      var callback = self.resolvedCallBacks.pop()
      var x = callback(value)
      var forkPromise = self.forkPromiseMap[callback]

      _resolutionProcedure(forkPromise, x)
    }
  })
}

var _reject = function (reason) {
  var self = this

  process.nextTick(function () {
    self.status = STATUS.REJECTED
    self.reason = reason

    while (self.rejectedCallBacks.length) {
      var callback = self.rejectedCallBacks.pop()
      var x = callback(value)
      var forkPromise = self.forkPromiseMap[callback]

      _resolutionProcedure(forkPromise, x)
    }
  })
}

function _Promise (callback) {
  var self = this

  this.status = STATUS.PENDING

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
    if (typeof callback === 'function') {
      callback(resolve, reject)
    } else {
      resolve()
    }
  } catch (err) {
    if (this.status === STATUS.PENDING) {
      reject(err)
    }
  }
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

  var forkPromise = new _Promise()
  this.forkPromiseMap[onResolved] = forkPromise
  this.forkPromiseMap[onRejected] = forkPromise

  return forkPromise
}

module.exports = _Promise