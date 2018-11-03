
let promise = new Promise(function (resolve, reject) {
  resolve()
})

function onResolved (value) {
  console.log('The promise is resolved with value: ', value)
}
function onRejected (e) {
  console.log('The promise is rejected with reason: ', e)
}
let newPromise = promise.then(function() {
  console.log('resolved in promise1')
  throw new Error('dasdas')
}, onRejected).then(onResolved, function () {
  console.log('rejected in promise2')
  return 'xxx'
})

newPromise.then(onResolved, onRejected)

// newPromise.then(onResolved, onRejected).catch(function (e) {
//   console.log(e)
// })